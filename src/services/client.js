import axios from "axios";
import { useUserStore } from "../stores/user";
import { ElMessage } from "element-plus";

const BASE_URL = "/api/v1";

// In-memory state for sessions to simulate persistence during runtime
let inMemorySessions = null;

const handleGetSessions = async () => {
  if (!inMemorySessions) {
    const response = await loadMockJson("mock_session_list.json");
    inMemorySessions = response?.data || [];
  }
  return {
    code: 200,
    msg: "ok",
    data: inMemorySessions,
  };
};

const handleCreateSession = async (config) => {
  if (!inMemorySessions) await handleGetSessions();
  
  const title = config.params?.title || "新对话";
  const newId = Math.max(...inMemorySessions.map(s => s.id), 0) + 1;
  const newSession = {
    id: newId,
    title,
    createTime: new Date().toLocaleString(),
    updateTime: new Date().toLocaleString(),
    lastMessage: ""
  };
  
  inMemorySessions.unshift(newSession);
  
  return {
    code: 200,
    msg: "ok",
    data: newId
  };
};

const handleRenameSession = async (config) => {
  if (!inMemorySessions) await handleGetSessions();
  
  const id = Number(config.params?.id);
  const title = config.params?.title;
  
  const session = inMemorySessions.find(s => s.id === id);
  if (session) {
    session.title = title;
    session.updateTime = new Date().toLocaleString();
  }
  
  return {
    code: 200,
    msg: "ok",
    data: null
  };
};

const handleDeleteSession = async (config) => {
  if (!inMemorySessions) await handleGetSessions();
  
  // Extract ID from URL: /session/123
  const match = config.url.match(/\/session\/(\d+)$/);
  const id = match ? Number(match[1]) : null;
  
  if (id) {
    inMemorySessions = inMemorySessions.filter(s => s.id !== id);
  }
  
  return {
    code: 200,
    msg: "ok",
    data: null
  };
};

const MOCK_ROUTE_CONFIGS = [
  {
    method: "post",
    pattern: /^\/user\/login$/,
    file: "mock_user_login.json",
  },
  {
    method: "post",
    pattern: /^\/user\/register$/,
    file: "mock_user_register.json",
  },
  {
    method: "get",
    pattern: /^\/user\/admin$/,
    file: "mock_admin_user_list.json",
    transform: (payload) => adaptAdminUserList(payload),
  },
  {
    method: "delete",
    pattern: /^\/user\/admin\/[^/]+$/,
    file: "mock_admin_user_delete.json",
  },
  {
    method: "get",
    pattern: /^\/session$/,
    handler: handleGetSessions,
  },
  {
    method: "post",
    pattern: /^\/session$/,
    handler: handleCreateSession,
  },
  {
    method: "put",
    pattern: /^\/session$/,
    handler: handleRenameSession,
  },
  {
    method: "delete",
    pattern: /^\/session\/[^/]+$/,
    handler: handleDeleteSession,
  },
  {
    method: "get",
    pattern: /^\/message\/session\/[^/]+\/page$/,
    file: "mock_message_page_{chatId}.json", // default fallback
    resolvePath: (config) => {
      // Extract chatId from url: /message/session/{chatId}/page
      // URL might be absolute or relative, handle carefully
      const match = config.url.match(/\/message\/session\/([^/]+)\/page/);
      const chatId = match ? match[1] : "1";
      return `mock_message_page_${chatId}.json`;
    },
    transform: (payload) => adaptChatMessagePage(payload),
  },
];

// 添加 token
const addAuthHeader = (config) => {
  const { token } = useUserStore();
  if (token) config.headers.Authorization = token;
  return config;
};

// 统一错误处理
const handleResponseError = (error) => {
  if (error.response?.status !== 200) {
    ElMessage.warning("网络错误！请联系管理员");
  }
  return Promise.reject(error);
};

// data客户端
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 原始客户端
const rawApiClient = axios.create({
  baseURL: BASE_URL,
});

// mock 客户端（直接访问 public/mock 下的静态数据）
const mockClient = axios.create({
  baseURL: "/mock",
  headers: {
    "Content-Type": "application/json",
  },
});

const ensureLeadingSlash = (path) => (path.startsWith("/") ? path : `/${path}`);

const adaptAdminUserList = (payload) => {
  const page = payload?.data || {};
  const list = Array.isArray(page.list) ? page.list : [];
  const total = Number(page.total ?? list.length);
  const rawSize = page.pageSize ?? list.length ?? 1;
  const pageSize = Number(rawSize ?? 1) || 1;
  const current = Number(page.pageNum ?? 1);
  const pages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  return {
    ...payload,
    data: {
      records: list,
      current,
      pages,
      total,
    },
  };
};

const adaptSessionCreate = (payload) => ({
  ...payload,
  data: payload?.data?.id ?? payload?.data ?? null,
});

const adaptChatMessagePage = (payload) => {
  const page = payload?.data || {};
  const list = Array.isArray(page.list) ? page.list : [];
  const total = Number(page.total ?? list.length);
  const pageSize = Number(page.pageSize ?? list.length ?? 10);
  const pageNum = Number(page.pageNum ?? 1);

  // Normalize list items to match ChatMessage expectations and reverse to simulate "newest first" from backend
  const normalizedList = list.map(item => ({
    ...item,
    senderType: item.role === 'user' ? 'USER' : 'AI',
    contents: item.content
  })).reverse();

  return {
    ...payload,
    data: {
      records: normalizedList,
      total,
      pageNum,
      pageSize,
    },
  };
};

const findMockRoute = (config) => {
  const method = (config.method || "get").toLowerCase();
  const urlPath = String(config.url || "").split("?")[0];
  return MOCK_ROUTE_CONFIGS.find(
    (route) => route.method === method && route.pattern.test(urlPath),
  );
};

const buildMockAdapter = (route, config) => {
  // If route has a custom handler, use it instead of file loading
  if (route.handler) {
    return async () => {
      try {
        const data = await route.handler(config);
        return {
          data,
          status: 200,
          statusText: "OK",
          headers: config.headers,
          config,
        };
      } catch (error) {
        console.error("Mock handler error:", error);
        return Promise.reject(error);
      }
    };
  }

  const mockPath = ensureLeadingSlash(
    route.resolvePath ? route.resolvePath(config) : route.file,
  );

  return () =>
    mockClient.get(mockPath).then((response) => {
      const payload = response?.data ?? response;
      const transformed = route.transform
        ? route.transform(payload, config)
        : payload;

      return {
        data: transformed,
        status: 200,
        statusText: "OK",
        headers: config.headers,
        config,
      };
    });
};

const injectMockIfNeeded = (config) => {
  const match = findMockRoute(config);
  if (!match) return config;
  config.adapter = buildMockAdapter(match, config);
  if (import.meta?.env?.DEV) {
    console.debug(
      "[Mock] intercept",
      (config.method || "get").toUpperCase(),
      config.url,
      "->",
      match.file,
    );
  }
  return config;
};

const composeRequestInterceptors = (config) => {
  const withAuth = addAuthHeader(config);
  return injectMockIfNeeded(withAuth);
};

// 请求拦截器
apiClient.interceptors.request.use(composeRequestInterceptors, handleResponseError);
rawApiClient.interceptors.request.use(addAuthHeader, handleResponseError);

// 响应拦截器
apiClient.interceptors.response.use((res) => res.data, handleResponseError);
rawApiClient.interceptors.response.use((res) => res, handleResponseError);

// helper to load mock JSON files from public/mock
const loadMockJson = (path) =>
  mockClient.get(ensureLeadingSlash(path)).then((response) => response?.data ?? response);

export { apiClient, rawApiClient, loadMockJson };
