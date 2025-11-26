import { useUserStore } from "../stores/user";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { apiClient, loadMockJson } from "./client";

const userStore = useUserStore();

export const chatAPI = {
  // 发送消息并处理流式响应（返回用于取消的句柄）
  sendMessage({ message, sessionId, mode, onChunk, onFinish, onError }) {
    // 开发环境下使用 Mock 数据
    if (import.meta.env.DEV) {
      const controller = new AbortController();
      let timer = null;

      const finished = (async () => {
        try {
          // 模拟网络延迟
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          if (controller.signal.aborted) return;

          // 加载 Mock 数据
          const response = await loadMockJson("mock_chat_stream.json");
          
          // 使用用户指定的长文本进行流式输出模拟
          let finalChunks = [
            "**星眸瞰南粤——遥感技术绘就自然资源智慧治理新图景**\n\n",
            "在距地球表面约600公里的太阳同步轨道上，一颗颗遥感卫星正无声运行。",
            "它们不带情感，却承载着对岭南大地最深沉的守望；它们沉默不语，却将山川、河流、城市与田野的每一寸变化尽数记录。",
            "作为广东省国土资源测绘院卫星应用中心的一员，我深知，这双来自太空的“星眸”，不仅是现代测绘科技的巅峰之作，更是新时代自然资源管理与生态文明建设的重要支撑。\n\n",
            "### 遥感：天空之眼，洞察大地脉动\n",
            "遥感（Remote Sensing）是通过非接触方式获取地表信息的技术。",
            "它利用搭载于卫星、无人机等平台上的传感器，采集地物反射或发射的电磁波信号，结合光谱分析与空间建模，生成高分辨率影像、土地利用图、植被覆盖变化图等多维地理信息产品。",
            "其最大优势在于大范围、周期性、客观性和可回溯性，特别适用于对国土空间进行动态监测。\n",
            "以广东为例，全省陆域面积达17.97万平方千米，地形复杂，气候多变，传统人工巡查难以实现全覆盖、高频次监管。",
            "而遥感技术可在数小时内完成全省影像采集，并结合地理信息系统（GIS）进行空间分析，极大提升了管理效率。\n\n",
            "### 精准监测，服务自然资源治理\n",
            "近年来，我院依托高分系列（GF-1、GF-2、GF-6）、资源三号及Sentinel等国产与国际卫星数据，构建了“年度普查+季度更新+应急响应”的三级遥感监测体系，重点监控耕地保护、生态保护红线、违法用地等关键领域。\n",
            "每年开展的土地利用动态监测中，我们通过多时相影像对比，精准识别耕地“非农化”“非粮化”问题，成果直接服务于自然资源执法平台，助力守住18亿亩耕地红线。",
            "例如，在珠三角某市的监测中，我们发现一处隐蔽的非法填湖造地项目，仅用36小时便完成变化检测与图斑提取，为执法部门及时制止违法行为提供了科学依据。\n\n",
            "### 智慧防灾，守护人民生命财产安全\n",
            "在应对突发自然灾害方面，遥感展现出强大的应急响应能力。",
            "2023年台风“海葵”登陆粤东，引发严重内涝与山体滑坡。受云雨遮挡，光学影像难以获取地表信息。",
            "我们迅速调用Sentinel-1合成孔径雷达（SAR）数据，穿透云层获取灾后地表形变信息，并结合数字高程模型（DEM）进行淹没区提取与滑坡风险评估，仅用6小时完成灾情初步研判，为救援力量部署与灾后重建规划提供了关键空间支持。"
          ];

          let index = 0;
          return new Promise((resolve) => {
            timer = setInterval(() => {
              if (controller.signal.aborted) {
                clearInterval(timer);
                resolve();
                return;
              }

              if (index >= finalChunks.length) {
                clearInterval(timer);
                onFinish && onFinish();
                resolve();
                return;
              }

              const chunk = finalChunks[index];
              if (chunk !== "[DONE]") {
                onChunk && onChunk(chunk);
              }
              
              index++;
            }, 100);
          });
        } catch (err) {
          console.error("Mock Error:", err);
          onError && onError(err);
        }
      })();

      return {
        cancel: () => {
          controller.abort();
          if (timer) clearInterval(timer);
        },
        finished,
      };
    }

    const Mode = {
      LOCAL: "LOCAL",
      ONLINE: "ONLINE",
    };

    let paramMode = mode ? Mode.ONLINE : Mode.LOCAL;

    const base = window.location.origin;
    const url = new URL("/api/v1/assistant/chat", base);

    url.searchParams.append("session", `${sessionId}/${paramMode}`);

    const controller = new AbortController();

    const finished = fetchEventSource(url, {
      method: "POST",
      headers: {
        Authorization: userStore.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
      openWhenHidden: true,
      signal: controller.signal,

      onmessage(event) {
        if (!event.data) return;
        let chunk = event.data;

        try {
          chunk = JSON.parse(event.data);
        } catch (_) {}

        if (typeof chunk !== "string") chunk = String(chunk);
        chunk = chunk.replace(/\r\n/g, "\n");
        chunk = chunk.replace(/^data:\s?/gm, "");

        onChunk && onChunk(chunk);
      },

      onclose() {
        onFinish && onFinish();
      },

      onerror(err) {
        onError && onError(err);
        // 这里可以选择要不要 throw；如不想 fetchEventSource 自动重试，就不要再 throw
      },
    });

    return {
      cancel: () => controller.abort(),
      finished,
    };
  },

  // 获取聊天历史列表
  getChatHistory() {
    // 添加类型参数
    return apiClient.get("/session");
  },

  // 创建新的聊天会话
  postCreateSession(title = "新对话") {
    return apiClient.post("/session", null, {
      params: {
        title: title,
      },
    });
  },

  // 重命名聊天会话
  putRenameSession(chatId, name) {
    return apiClient.put(`/session`, null, {
      params: {
        id: chatId,
        title: name,
      },
    });
  },

  // 删除聊天会话
  deleteDeleteSession(chatId) {
    return apiClient.delete(`/session/${chatId}`);
  },

  // 分页获取对话聊天记录
  getChatMessagesByPage(chatId, pageNum = 1, pageSize = 10) {
    return apiClient.get(`/message/session/${chatId}/page`, {
      params: {
        pageNum,
        pageSize,
      },
    });
  },
};
