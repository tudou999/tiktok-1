<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useDark, useToggle } from "@vueuse/core";
import {
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/vue/24/outline";
import { useRouter } from "vue-router";
import { ref, computed, onMounted } from "vue";
import { User, SwitchButton, HomeFilled } from "@element-plus/icons-vue";
import { useUserStore } from "./stores/user";

const isDark = useDark();
const toggleDark = useToggle(isDark);
const router = useRouter();
const userStore = useUserStore();

// 添加全局状态来跟踪当前路由
const currentRoute = ref(router.currentRoute.value.path);

// 登录状态管理
const isLoggedIn = ref(false);

// 是否显示管理员按钮
const isAdmin = computed(() => {
  return userStore.role === "ADMIN";
});

// 检查登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem("token");
  // 如果缓存中有token，value为true，否则为false
  isLoggedIn.value = !!token;
};

// 退出登录
const handleLogout = () => {
  userStore.clearToken();
  isLoggedIn.value = false;
  // 重定向到登录页面
  router.push("/login");
};

// 是否显示退出登录按钮（登录和注册页面不显示）
const showLogOutButton = computed(() => {
  return (
    isLoggedIn.value &&
    currentRoute.value !== "/login" &&
    currentRoute.value !== "/register"
  );
});

// 跳转到管理员页
const handleGoAdmin = () => {
  router.push("/root");
};

// 组件挂载时检查登录状态
onMounted(() => {
  checkLoginStatus();
});

// 添加全局路由守卫
router.beforeEach((to, from, next) => {
  // 检查登录状态
  checkLoginStatus();

  // 如果用户未登录且访问需要登录的页面，重定向到登录页
  const publicRoutes = ["/login", "/register"];
  if (!isLoggedIn.value && !publicRoutes.includes(to.path)) {
    next("/login");
    return;
  }

  currentRoute.value = to.path;
  next();
});
</script>

<template>
  <div class="app" :class="{ dark: isDark }">
    <nav class="navbar">
      <div class="navbar-left">
        <router-link to="/ai-chat" class="logo">TikTok智能问答助手</router-link>
      </div>
      <div class="navbar-actions">
        <button @click="toggleDark()" class="theme-toggle">
          <SunIcon v-if="isDark" class="icon" />
          <MoonIcon v-else class="icon" />
        </button>
        <el-button
          plain
          type="primary"
          size="large"
          v-if="showLogOutButton && isAdmin"
          @click="handleGoAdmin"
          title="管理员"
        >
          <el-icon style="vertical-align: middle">
            <User />
          </el-icon>
          管理员中心
        </el-button>
        <el-button
          plain
          type="danger"
          size="large"
          v-if="showLogOutButton"
          @click="handleLogout"
          title="退出登录"
        >
          <el-icon style="vertical-align: middle">
            <SwitchButton />
          </el-icon>
          退出登录
        </el-button>
      </div>
    </nav>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style lang="scss">
:root {
  --bg-color: #f5f5f5;
  --text-color: #333;
}

.dark {
  --bg-color: #1a1a1a;
  --text-color: #fff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  color: var(--text-color);
  background: var(--bg-color);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .logo {
    font-size: 1.5rem;
    font-weight: bold;
    text-decoration: none;
    color: inherit;
    background: #007cf0;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .navbar-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .navbar-actions {
    display: flex;
    align-items: center;
    gap: 0.1rem;
  }

  .theme-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background-color 0.3s;
    margin-right: 0.75rem;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .icon {
      width: 24px;
      height: 24px;
      color: var(--text-color);
    }
  }

  .admin-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.25);
    color: #2563eb;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.35);
      transform: translateY(-1px);
    }

    .admin-text {
      @media (max-width: 768px) {
        display: none;
      }
    }
  }

  .logout-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(220, 38, 38, 0.1);
    border: 1px solid rgba(220, 38, 38, 0.2);
    color: #dc2626;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(220, 38, 38, 0.2);
      border-color: rgba(220, 38, 38, 0.3);
      transform: translateY(-1px);
    }

    .icon {
      width: 18px;
      height: 18px;
    }

    .logout-text {
      @media (max-width: 768px) {
        display: none;
      }
    }
  }

  .dark & {
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .logout-button {
      background: rgba(220, 38, 38, 0.15);
      border-color: rgba(220, 38, 38, 0.3);
      color: #f87171;

      &:hover {
        background: rgba(220, 38, 38, 0.25);
        border-color: rgba(220, 38, 38, 0.4);
      }
    }

    .admin-button {
      background: rgba(59, 130, 246, 0.18);
      border-color: rgba(59, 130, 246, 0.35);
      color: #60a5fa;

      &:hover {
        background: rgba(59, 130, 246, 0.26);
        border-color: rgba(59, 130, 246, 0.45);
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;

    .navbar-actions {
      gap: 0.25rem;
    }

    .logout-button {
      padding: 0.5rem;

      .logout-text {
        display: none;
      }
    }
    .admin-button {
      padding: 0.5rem;
    }
  }
}
</style>
