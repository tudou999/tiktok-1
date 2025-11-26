<template>
  <el-container class="ai-chat">
    <el-container class="chat-container">
      <!-- 侧边栏 -->
      <el-aside class="sidebar">
        <div class="aside-header">
          <h2>聊天记录</h2>
          <el-button
            size="large"
            @click="startNewChat(currentChatId)"
            type="primary"
          >
            <el-icon>
              <ChatDotSquare />
            </el-icon>
            新对话
          </el-button>
        </div>
        <el-menu
          class="history-menu"
          :default-active="currentChatId !== null ? String(currentChatId) : ''"
          @select="handleHistorySelect"
        >
          <el-menu-item
            v-for="chat in chatHistory"
            :key="chat.id"
            class="history-item"
            :index="String(chat.id)"
            :class="{
              active: currentChatId === chat.id,
              editing: chat.editing !== 0,
            }"
          >
            <ChatBubbleLeftRightIcon class="icon" />

            <span v-if="chat.editing === 0" class="title">
              {{ chat.title || "新对话" }}
            </span>

            <div v-else class="rename-editing" @click.stop>
              <el-input
                ref="refInput"
                v-model="chat.title"
                size="default"
                placeholder="请输入新标题"
                clearable
                @keydown.enter.stop.prevent="confirmRename(chat)"
                :disabled="renamingId && renamingId !== chat.id"
                class="rename-input"
              />
              <el-button
                type="primary"
                size="small"
                @click.stop="confirmRename(chat)"
                :loading="renamingId === chat.id"
                :disabled="renamingId && renamingId !== chat.id"
                class="rename-confirm-btn"
              >
                <el-icon><Check /></el-icon>
              </el-button>
              <el-button
                size="small"
                @click.stop="cancelRename(chat)"
                :disabled="renamingId && renamingId !== chat.id"
                class="rename-cancel-btn"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>

            <span class="actions" @click.stop>
              <el-dropdown size="large" trigger="click">
                <el-button
                  :disabled="isAnyEditing && chat.editing === 0"
                  text
                  style="padding: 0"
                >
                  <el-icon style="margin: 0">
                    <More />
                  </el-icon>
                </el-button>

                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="renameSession(chat)"
                      >重命名会话</el-dropdown-item
                    >
                    <el-dropdown-item
                      @click="deleteSession(chat.id, chat.title)"
                      >删除会话</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主区域：通过路由渲染具体聊天内容 -->
      <el-main class="chat-main">
        <router-view v-slot="{ Component }">
          <component
            :is="Component || ChatRecord"
            :chat-id="String(currentChatId)"
            @chat-created="handleChatCreated"
          />
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
// TODO：重命名的显示有bug
// TODO：省略号

import { ChatDotSquare, Check, Close, More } from "@element-plus/icons-vue";
import { computed, nextTick, onMounted, ref } from "vue";
import { ChatBubbleLeftRightIcon } from "@heroicons/vue/24/outline";
import ChatRecord from "./ChatRecord.vue";
import { chatAPI } from "../services/chat.js";
import { ElMessage, ElMessageBox } from "element-plus";

defineOptions({
  name: "AIChat",
});

// 会话列表与当前选中状态
const chatHistory = ref([]); // 所有会话的历史列表
const currentChatId = ref(null); // 当前选中的会话 ID

// 重命名相关状态
const renamingId = ref(null); // 正在重命名的会话 ID
const originalTitle = ref(null); // 进入重命名前的原始标题，用于取消恢复

// 是否存在任意一条会话处于编辑态，用于禁用其他项的操作按钮
const isAnyEditing = computed(
  () =>
    Array.isArray(chatHistory.value) &&
    chatHistory.value.some((c) => c.editing !== 0),
);

// 开始新的对话（将 currentChatId 置为临时ID0，并聚焦输入框）
function startNewChat() {
  if (currentChatId.value === 0) {
    ElMessage.success("当前已是最新对话！");
  }
  currentChatId.value = 0;
  focusInput();
}

// 聚焦输入框
function focusInput() {
  // 等待下一个 DOM 更新周期后再聚焦
  nextTick(() => {
    const inputEl = document.querySelector(".ai-chat .el-textarea__inner");
    if (inputEl) {
      inputEl.focus();
    }
  });
}

// 点击左侧菜单时切换当前会话，重设 currentChatId
function handleHistorySelect(index) {
  const chatId = Number(index);
  if (!chatId) return;

  const chat = Array.isArray(chatHistory.value)
    ? chatHistory.value.find((item) => item.id === chatId)
    : null;

  if (!chat || chat.editing !== 0) return;
  if (currentChatId.value === chatId) return;

  currentChatId.value = chatId;
}

// 当右侧 ChatRecord 创建了一个新的会话时，更新会话列表并选中该会话
function handleChatCreated(chat) {
  if (!chat?.id) return;
  const normalized = { ...chat, editing: 0 };
  chatHistory.value = [
    normalized,
    ...chatHistory.value.filter((item) => item.id !== normalized.id),
  ];
  currentChatId.value = normalized.id;
}

// 进入重命名模式：重置其他会话的编辑状态，并记录原始标题
async function renameSession(data) {
  if (Array.isArray(chatHistory.value)) {
    chatHistory.value.forEach((c) => {
      c.editing = 0;
    });
  }
  originalTitle.value = data.title || "";
  data.editing = 1;
  await nextTick();
  const inputEl =
    document.querySelector(".history-item.active .el-input__inner") ||
    document.querySelector(".history-item .el-input__inner");
  if (inputEl) {
    inputEl.focus();
  }
}

// 取消重命名：恢复原始标题并退出编辑态
function cancelRename(chat) {
  if (chat) {
    chat.title = originalTitle.value || "";
    chat.editing = 0;
    originalTitle.value = null;
  }
}

// 确认提交重命名：调用后端接口更新标题，成功后刷新列表
async function confirmRename(chat) {
  if (!chat || renamingId.value) return;
  renamingId.value = chat.id;
  try {
    const response = await chatAPI.putRenameSession(chat.id, chat.title || "");
    if (response?.code === 200) {
      chat.editing = 0;
      originalTitle.value = null;
      ElMessage.success("重命名成功！");
    } else {
      ElMessage.error(`重命名失败：${response?.msg || "未知错误"}`);
    }
  } catch (e) {
    ElMessage.error("重命名失败：网络或服务器异常");
  } finally {
    renamingId.value = null;
    await loadChatHistory();
  }
}

// 删除会话：弹出确认框，确认后调用后端删除，并刷新历史列表
async function deleteSession(id, name) {
  ElMessageBox.confirm(`确认删除 ${name} 吗？`, "warning", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      const response = await chatAPI.deleteDeleteSession(id);
      if (response.code === 200) {
        ElMessage({
          type: "success",
          message: `删除 ${name} 成功！`,
        });
        if (currentChatId.value === id) {
          currentChatId.value = null;
        }
        await loadChatHistory();
      } else {
        ElMessage({
          type: "error",
          message: `删除 ${name} 失败！请联系管理员。`,
        });
      }
    })
    .catch(() => {
      ElMessage({
        type: "info",
        message: "已取消删除",
      });
    });
}

// 从后端加载会话历史列表，并为每条记录增加 editing 字段
async function loadChatHistory() {
  try {
    const response = await chatAPI.getChatHistory();
    const history = Array.isArray(response.data)
      ? response.data.map((item) => ({ ...item, editing: 0 }))
      : [];
    chatHistory.value = history;

    if (!history.length) {
      startNewChat();
      return;
    }

    if (!history.some((item) => item.id === currentChatId.value)) {
      currentChatId.value = history[0].id;
    }
  } catch (error) {
    console.error("加载聊天历史失败:", error);
    chatHistory.value = [];
    startNewChat();
  }
}

// 组件挂载时拉取历史会话列表
onMounted(() => {
  loadChatHistory();
});
</script>

<style scoped lang="scss">
.ai-chat {
  position: fixed; // 修改为固定定位
  top: 64px; // 导航栏高度
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: var(--el-bg-color);
  overflow: hidden; // 防止页面滚动

  .chat-container {
    flex: 1;
    display: flex;
    max-width: 1800px;
    width: 100%;
    margin: 0 auto;
    padding: 1.5rem 2rem;
    gap: 1.5rem;
    height: 100%; // 确保容器占满高度
    overflow: hidden; // 防止容器滚动
  }

  .sidebar {
    width: 280px;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color-overlay);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

    .aside-header {
      flex-shrink: 0;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        font-size: 1.1rem;
        font-weight: 600;
      }
    }

    .history-menu {
      flex: 1;
      border-right: none;
      background: transparent;
      padding: 0 0.75rem 1rem;
      overflow-y: auto;

      :deep(.el-menu-item) {
        height: auto;
        line-height: 1.4;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border-radius: 0.75rem;
        display: flex;
        gap: 0.5rem;
        align-items: center;
        transition: background-color 0.2s;

        &.is-active,
        &:hover {
          background: color-mix(
            in srgb,
            var(--el-color-primary) 10%,
            transparent
          );
        }

        &.editing {
          background: var(--el-fill-color-light);
        }

        .icon {
          width: 1.25rem;
          height: 1.25rem;
          flex-shrink: 0;
        }

        .title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .new-chat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      background: var(--el-color-primary);
      color: var(--el-color-white, #fff);
      border: none;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background: var(--el-color-primary-dark-2);
      }

      .icon {
        width: 1.25rem;
        height: 1.25rem;
        .actions {
          margin-left: auto;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.15s ease;
        }

        &:hover .actions {
          opacity: 1;
          visibility: visible;
        }
      }
    }
  }

  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color-overlay);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden; // 防止内容溢出

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem; // 减少 padding
      display: flex;
      flex-direction: column;
      gap: 1.5rem; // 增加消息间距

      // 限制消息内容宽度并居中
      > * {
        max-width: 48rem; // 约 768px
        width: 100%;
        margin: 0 auto;
      }

      /* 美化滚动条 */
      &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb:hover {
        background: var(--el-border-color-dark);
      }
    }

    .input-area {
      flex-shrink: 0;
      padding: 1rem;
      background: transparent; // 背景透明
      display: flex;
      flex-direction: column;
      align-items: center; // 居中

      .input-wrapper {
        width: 100%;
        max-width: 48rem; // 限制宽度
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .selected-files {
        background: var(--el-bg-color);
        border-radius: 0.75rem;
        padding: 0.5rem;
        border: 1px solid var(--el-border-color-light);
        width: 100%;

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: var(--el-bg-color);
          border-radius: 0.5rem;
          margin-bottom: 0.75rem;
          border: 1px solid var(--el-border-color);
          transition: all 0.2s ease;

          &:last-child {
            margin-bottom: 0;
          }

          &:hover {
            background: color-mix(
              in srgb,
              var(--el-color-primary) 3%,
              transparent
            );
            border-color: color-mix(
              in srgb,
              var(--el-color-primary) 20%,
              var(--el-border-color)
            );
          }

          .file-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .icon {
              width: 1.5rem;
              height: 1.5rem;
              color: var(--el-color-primary);
            }

            .file-name {
              font-size: 0.875rem;
              color: var(--el-text-color-primary);
              font-weight: 500;
            }

            .file-size {
              font-size: 0.75rem;
              color: var(--el-text-color-secondary);
              background: var(--el-fill-color-light);
              padding: 0.25rem 0.5rem;
              border-radius: 1rem;
            }
          }

          .remove-btn {
            padding: 0.375rem;
            border: none;
            background: var(--el-fill-color-light);
            color: var(--el-text-color-secondary);
            cursor: pointer;
            border-radius: 0.375rem;
            transition: all 0.2s ease;

            &:hover {
              background: var(--el-color-danger);
              color: var(--el-color-white, #fff);
            }

            .icon {
              width: 1.25rem;
              height: 1.25rem;
            }
          }
        }
      }

      .input-row {
        display: flex;
        gap: 0.75rem;
        align-items: flex-end; // 底部对齐
        background: var(--el-bg-color);
        padding: 0.75rem;
        border-radius: 1.5rem; // 更大的圆角
        border: 1px solid var(--el-border-color-light);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); // 悬浮感阴影
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

        // 去掉 el-input 自己的边框和背景，只用外面的那块区域
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

        .file-upload {
          .hidden {
            display: none;
          }

          .upload-btn {
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            border-radius: 0.75rem;
            background: color-mix(
              in srgb,
              var(--el-color-primary) 12%,
              transparent
            );
            color: var(--el-color-primary);
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover:not(:disabled) {
              background: color-mix(
                in srgb,
                var(--el-color-primary) 20%,
                transparent
              );
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .icon {
              width: 1.25rem;
              height: 1.25rem;
            }
          }
        }

        textarea {
          flex: 1;
          resize: none;
          border: none;
          background: transparent;
          padding: 0.25rem 0.5rem; // 调整 padding
          color: inherit;
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.5;
          max-height: 200px; // 增加最大高度

          &:focus {
            outline: none;
          }

          &::placeholder {
            color: var(--el-text-color-placeholder);
          }
        }

        .send-button {
          width: 2rem; // 稍微改小一点
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 0.5rem; // 圆角
          background: var(--el-text-color-primary); // 黑色背景（亮色模式）
          color: var(--el-bg-color);
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          margin-bottom: 0.25rem; // 对齐到底部

          &:hover:not(:disabled) {
            background: var(--el-text-color-regular);
            transform: none;
          }

          &:disabled {
            background: var(--el-fill-color);
            color: var(--el-text-color-placeholder);
            cursor: not-allowed;
          }

          .icon {
            width: 1.25rem;
            height: 1.25rem;
          }
        }
      }
    }
  }
}
</style>
