<script setup>
// TODO：UI界面优化
// TODO：添加消息时间戳显示
// TODO：按钮禁用后回车仍能使用的bug

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { Position } from "@element-plus/icons-vue";
import ChatMessage from "./ChatMessage.vue";
import { chatAPI } from "../services/chat";
import IconStop from "../components/icons/IconStop.vue";

defineOptions({
  name: "ChatRecord",
});

const props = defineProps({
  chatId: {
    type: String,
    default: null,
  },
  isNewChat: {
    type: Boolean,
    default: false,
  },
});

// 事件：会话创建成功/会话被选中
const emit = defineEmits(["chat-created"]);

// 本地 UI 与分页状态
const messagesRef = ref(null); // 消息列表容器，用于滚动控制和无限加载
const userInput = ref(""); // 文本输入框绑定的用户输入
const isStreaming = ref(false); // 当前是否在流式输出中，控制按钮禁用等
const currentMessages = ref([]); // 当前会话下展示的所有消息
const autoScrollEnabled = ref(true); // 是否允许自动滚动到底部（用户不阅读历史时）
const pageNum = ref(1); // 当前分页页码，用于向后端请求更多历史
const pageSize = ref(10); // 每页条数
const total = ref(0); // 当前会话消息总数
const loadingMore = ref(false); // 是否正在加载上一页历史，避免重复请求
const hasMore = ref(true); // 是否还有更多历史可加载
const typingBuffer = ref(""); // 打字机效果缓冲区，保存尚未输出到界面的内容
let typingTimer = null; // 打字机定时器句柄，用于逐字符刷新界面
let activeStreamHandle = null; // 当前 fetchEventSource 句柄，用于取消流式输出
const activeAssistantMessage = ref(null); // 正在流式输出的 AI 消息对象
const isWaitingForChunk = computed(
  () => isStreaming.value && typingBuffer.value.length === 0,
); // 是否在等待下一段流式响应

// 会话提升状态
const isPromotingFromLocal = ref(false); // 是否正在从本地临时会话提升到真实会话
let lastChatId = null;

// 模式（本地/在线）（false表示本地，true表示在线）
const mode = ref(false);

// 监听：当组件接收到的值改变时，根据该值加载对应会话消息
watch(
  () => props.chatId,
  async (newId, oldId) => {
    // 记录上一次 id，方便调试/条件判断
    lastChatId = oldId;

    // 1）新值为 0：表示又回到本地临时会话，直接重置即可
    if (newId == 0 || newId == null) {
      resetChatView();
      return;
    }

    // 2）如果是从 0 升级到真实 id，并且当前在流式输出，说明我们已经有本地的临时消息了，
    //    不需要立刻用后端覆盖，等用户下一次真正切换会话时再 load 即可
    if (oldId == 0 && isPromotingFromLocal.value && isStreaming.value) {
      // 这次变更只用于“记录真实 id”，不触发 loadChat
      isPromotingFromLocal.value = false;
      return;
    }

    // 3）普通情况：正常根据 newId 加载会话
    await loadChat(newId);
  },
  { immediate: true }
);

// 重置分页状态
function resetPagination() {
  pageNum.value = 1;
  total.value = 0;
  hasMore.value = true;
}

// 重置聊天记录与分页状态
function resetChatView() {
  currentMessages.value = [];
  resetPagination();
}

// 加载指定会话的消息列表
async function loadChat(chatId) {
  // 重置分页状态
  resetPagination();
  try {
    // 加载第一页消息
    const response = await chatAPI.getChatMessagesByPage(
      chatId,
      pageNum.value,
      pageSize.value,
    );

    const pageData = response.data || {};
    let records = Array.isArray(pageData.records) ? pageData.records : [];

    if (Array.isArray(records)) { /* empty */ } else if (records) {
      records = [records]; // 单个对象 => 单元素数组
    } else {
      records = [];
    }

    // 接口按创建时间倒序返回，这里翻转成正序显示
    currentMessages.value = [...records].reverse();
    total.value = pageData.total || 0;
    hasMore.value = pageNum.value * pageSize.value < total.value;

    await nextTick();
    await scrollToBottom(true);
  } catch (error) {
    console.error("加载对话消息失败:", error);
    currentMessages.value = [];
  }
}

// 加载更多历史消息（上一页）
async function loadMoreMessages() {
  if (loadingMore.value || !hasMore.value || !props.chatId) return;
  loadingMore.value = true;

  try {
    // 获得 messages 容器
    const container = messagesRef.value;
    // 记录加载前的 scrollHeight（内容高度）
    const previousScrollHeight = container ? container.scrollHeight : 0;

    const nextPage = pageNum.value + 1;
    // 调用接口加载下一页消息
    const response = await chatAPI.getChatMessagesByPage(
      props.chatId,
      nextPage,
      pageSize.value,
    );

    const pageData = response.data || {};
    const records = Array.isArray(pageData.records) ? pageData.records : [];

    if (records.length > 0) {
      const newMessages = [...records].reverse();
      currentMessages.value = [...newMessages, ...currentMessages.value];

      pageNum.value = nextPage;
      total.value = pageData.total || total.value;
      hasMore.value = pageNum.value * pageSize.value < total.value;

      // 追加旧消息后保持用户视口位置
      await nextTick();
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - previousScrollHeight;
      }
    } else {
      hasMore.value = false;
    }
  } catch (error) {
    console.error("加载更多消息失败:", error);
  } finally {
    loadingMore.value = false;
  }
}

// 开始流式发送消息
async function startStream(data) {
  const prompt = (
    typeof data === "string" ? data : userInput.value || ""
  ).trim();
  if (!prompt) return;

  isStreaming.value = true;
  userInput.value = "";

  typingBuffer.value = "";
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }

  // 将临时用户消息添加到当前消息列表
  currentMessages.value.push({
    senderType: "USER",
    contents: prompt,
  });

  // 将 AI 消息添加到当前消息列表，并记录当前正在流式输出的消息对象
  currentMessages.value.push({
    senderType: "AI",
    contents: "",
    stopped: false,
  });
  activeAssistantMessage.value =
    currentMessages.value[currentMessages.value.length - 1];

  if (!data) userInput.value = "";
  await scrollToBottom(true);

  let sid = props.chatId ?? 0;
  if (sid == 0) {
    // 标记为正在提升会话
    isPromotingFromLocal.value = true;

    try {
      const title = prompt.slice(0, 10);
      const response = await chatAPI.postCreateSession(title);

      const realId = response.data;
      sid = realId;
      emit("chat-created", { id: realId, title });
    } catch (error) {
      isPromotingFromLocal.value = false;
      console.error("创建会话失败:", error);
      isStreaming.value = false;
      return;
    }
  }

  // 通过缓冲区 + 定时器实现打字机效果
  activeStreamHandle = chatAPI.sendMessage({
    message: prompt,
    sessionId: sid,
    mode: mode.value,
    onChunk(chunk) {
      typingBuffer.value += chunk;

      if (!typingTimer) {
        typingTimer = setInterval(() => {
          if (!typingBuffer.value.length) {
            if (!isStreaming.value) {
              clearInterval(typingTimer);
              typingTimer = null;
              // 打字机内容已经全部输出完毕，可以安全清理当前流式消息引用
              activeAssistantMessage.value = null;
            }
            return;
          }

          const nextChar = typingBuffer.value[0];
          typingBuffer.value = typingBuffer.value.slice(1);

          const msg = activeAssistantMessage.value;
          if (msg) {
            msg.contents += nextChar;
          }

          nextTick(() => scrollToBottom());
        }, 20);
      }
    },
    onFinish() {
      isStreaming.value = false;
      if (!typingBuffer.value.length && typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
      }
      activeStreamHandle = null;
    },
    onError(err) {
      isStreaming.value = false;
      if (!typingBuffer.value.length && typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
      }
      console.error("流式请求出错:", err);
      activeStreamHandle = null;
    },
  });
}

// 停止当前流式输出
function stopStream() {
  if (activeStreamHandle) {
    activeStreamHandle.cancel();
    activeStreamHandle = null;
  }
  isStreaming.value = false;
  typingBuffer.value = "";
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
  if (activeAssistantMessage.value) {
    const msg = activeAssistantMessage.value;
    msg.stopped = true;
    activeAssistantMessage.value = null;
  }
}

// 重新生成：将选中的用户消息填回输入框并直接重新发送
function handleRegenerate(content) {
  if (!content || isStreaming.value) return;
  userInput.value = content;
  // 直接使用这段内容重新开始一次流式对话
  startStream(content);
}

// 滚动到底部
async function scrollToBottom(force = false) {
  await nextTick();
  const container = messagesRef.value;
  if (!container) return;

  if (!force && !autoScrollEnabled.value) {
    return;
  }

  container.scrollTop = container.scrollHeight;
}

// 监听消息容器滚动事件，实现分页加载/自动滚动控制
function handleMessagesScroll() {
  const container = messagesRef.value;
  if (!container) return;

  // 规定触发加载的阈值
  const thresholdTop = 10;
  const thresholdBottom = 10;

  // 顶部触发分页加载
  if (
    !loadingMore.value &&
    hasMore.value &&
    container.scrollTop <= thresholdTop
  ) {
    loadMoreMessages();
  }

  // 计算距离底部的距离
  const distanceToBottom =
    container.scrollHeight - (container.scrollTop + container.clientHeight);
  // 当用户滚动到底部附近时，autoScrollEnabled设置为true，启用自动滚动
  // 距离底部 > thresholdBottom 时认为用户在阅读历史，不再强制滚动
  autoScrollEnabled.value = distanceToBottom <= thresholdBottom;
}

onMounted(() => {
  // 监听滚动事件
  if (messagesRef.value) {
    messagesRef.value.addEventListener("scroll", handleMessagesScroll);
  }
});

onBeforeUnmount(() => {
  // 移除滚动事件监听
  if (messagesRef.value) {
    messagesRef.value.removeEventListener("scroll", handleMessagesScroll);
  }
  // 清理定时器
  if (typingTimer) {
    clearInterval(typingTimer);
    typingTimer = null;
  }
});
</script>

<template>
  <div class="chat-record">
    <div class="messages" ref="messagesRef">
      <ChatMessage
        v-for="(message, index) in currentMessages"
        :key="index"
        :message="{
          role: message.senderType,
          content: message.contents,
          stopped: message.stopped,
        }"
        :isStreaming="isStreaming"
        :isWaiting="isWaitingForChunk && message === activeAssistantMessage"
        @regenerate="handleRegenerate"
      />
    </div>
    <div class="input-area">
      <div class="input-wrapper">
        <div class="input-row">
          <!-- TODO：暂时修改宽度，后面要优化 -->
          <el-input
            style="max-width: 550px"
            clearable
            size="large"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 6 }"
            v-model="userInput"
            @keydown.enter.prevent="startStream(userInput)"
            placeholder="给 TikTok-Chat 发送消息"
            resize="none"
          />
          <el-switch
            v-model="mode"
            active-text="在线"
            inactive-text="本地"
            size="large"
          />

          <el-button
            round
            class="send-button"
            @click="isStreaming ? stopStream() : startStream(userInput)"
            :disabled="!isStreaming && !userInput.trim()"
          >
            <template v-if="isStreaming">
              <IconStop class="icon-stop" />
            </template>
            <template v-else>
              <el-icon class="icon-send" size="small"><Position /></el-icon>
            </template>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chat-record {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  > * {
    max-width: 48rem;
    width: 100%;
    margin: 0 auto;
  }
}

.input-area {
  flex-shrink: 0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;

  .input-wrapper {
    width: 100%;
    max-width: 48rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .input-row {
    display: flex;
    gap: 10px;
    align-items: center;
    background: var(--el-bg-color);
    padding: 0.75rem;
    border-radius: 1.5rem;
    border: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    width: 100%;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:focus-within {
      border-color: var(--el-border-color-darker);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    :deep(.el-input) {
      flex: 1;
    }

    :deep(.el-input__wrapper) {
      background: transparent;
      box-shadow: none;
      border: none;
      padding-left: 0;
      padding-right: 0;
    }

    :deep(.el-input__inner) {
      padding-left: 0;
      padding-right: 0;
    }

    textarea {
      flex: 1;
      resize: none;
      border: none;
      background: transparent;
      padding: 0.25rem 0.5rem;
      color: inherit;
      font-family: inherit;
      font-size: 1rem;
      line-height: 1.5;
      max-height: 200px;

      &:focus {
        outline: none;
      }

      &::placeholder {
        color: var(--el-text-color-placeholder);
      }
    }

    .send-button {
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: var(--el-text-color-primary);
      color: var(--el-bg-color);
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover:not(:disabled) {
        background: var(--el-text-color-regular);
      }

      &:disabled {
        background: var(--el-fill-color);
        color: var(--el-text-color-regular);
        cursor: not-allowed;
      }

      .icon-send {
        width: 1.25rem;
        height: 1.25rem;
      }

      .icon-stop {
        width: 1rem;
        height: 1rem;
      }
    }
  }
}
</style>
