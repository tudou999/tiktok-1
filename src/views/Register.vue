<template>
  <div class="register-container" :class="{ dark: isDark }">
    <div class="register-card">
      <div class="register-header">
        <h1 class="register-title">创建新账号</h1>
        <p class="register-subtitle">请填写以下信息完成注册</p>
      </div>

      <form class="register-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="email" class="form-label">邮箱地址</label>
          <div class="input-wrapper">
            <input
              id="email"
              v-model="registerForm.email"
              type="email"
              class="form-input"
              placeholder="请输入您的邮箱地址"
              required
            />
            <div class="input-icon">
              <svg
                class="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="password" class="form-label">密码</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="registerForm.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入密码（至少6位）"
              required
            />
            <div class="input-icon">
              <svg
                class="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            </div>
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              <svg
                v-if="showPassword"
                class="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                ></path>
              </svg>
              <svg
                v-else
                class="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">确认密码</label>
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="registerForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请再次输入密码"
              required
            />
            <div class="input-icon">
              <svg
                class="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            </div>
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <svg
                v-if="showConfirmPassword"
                class="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                ></path>
              </svg>
              <svg
                v-else
                class="icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="register-button" :disabled="isLoading">
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>注册</span>
        </button>

        <div class="register-footer">
          <p class="login-text">
            已有账号？
            <a href="#" class="login-link" @click.prevent="gotoLogin"
              >立即登录</a
            >
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "Register",
});

// TODO: 表单验证正则化
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useDark } from "@vueuse/core";
import { SignAPI } from "../services/user.js";
import { ElMessage } from "element-plus";

const isDark = useDark();
const router = useRouter();

const registerForm = ref({
  email: "",
  password: "",
  confirmPassword: "",
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);

// 注册处理函数
const handleRegister = async () => {
  isLoading.value = true;
  try {
    const response = await SignAPI.register(registerForm.value);
    if (response.code === 200) {
      router.push("/home");
      ElMessage.success("注册成功！");
    } else {
      ElMessage.error(response.msg);
    }
  } catch (error) {
    ElMessage.warning("注册失败，请联系管理员。");
  } finally {
    isLoading.value = false;
  }
};

// 跳转到登录页面
const gotoLogin = () => {
  router.push("/login");
};
</script>

<style scoped lang="scss">
.register-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  padding: 2rem;
  overflow: hidden;

  .register-card {
    width: 100%;
    max-width: 420px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 1.5rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 3rem 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .register-header {
    text-align: center;
    margin-bottom: 2.5rem;

    .register-title {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #007cf0, #00d4ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .register-subtitle {
      font-size: 1rem;
      color: #666;
      margin: 0;
      font-weight: 400;
    }
  }

  .register-form {
    .form-group {
      margin-bottom: 1.5rem;

      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;

        .form-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 0.75rem;
          font-size: 1rem;
          background: rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
          outline: none;

          &:focus {
            border-color: #007cf0;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 0 0 3px rgba(0, 124, 240, 0.1);
          }

          &::placeholder {
            color: #9ca3af;
          }
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: #9ca3af;
          pointer-events: none;

          .icon {
            width: 1.25rem;
            height: 1.25rem;
          }
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: color 0.2s ease;

          &:hover {
            color: #007cf0;
          }

          .icon {
            width: 1.25rem;
            height: 1.25rem;
          }
        }
      }
    }

    .form-options {
      margin-bottom: 2rem;

      .agree-terms {
        display: flex;
        align-items: flex-start;
        cursor: pointer;

        .checkbox {
          width: 1rem;
          height: 1rem;
          margin-right: 0.5rem;
          margin-top: 0.125rem;
          accent-color: #007cf0;
          flex-shrink: 0;
        }

        .checkbox-text {
          font-size: 0.875rem;
          color: #374151;
          line-height: 1.4;

          .terms-link {
            color: #007cf0;
            text-decoration: none;
            transition: color 0.2s ease;

            &:hover {
              color: #0066cc;
            }
          }
        }
      }
    }

    .register-button {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #007cf0, #00d4ff);
      color: white;
      border: none;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 124, 240, 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      .loading-spinner {
        display: inline-block;
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
      }
    }

    .register-footer {
      text-align: center;
      margin-top: 2rem;

      .login-text {
        font-size: 0.875rem;
        color: #666;
        margin: 0;

        .login-link {
          color: #007cf0;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;

          &:hover {
            color: #0066cc;
          }
        }
      }
    }
  }
}

.dark {
  .register-card {
    background: rgba(40, 40, 40, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .register-header {
    .register-title {
      color: #fff;
    }

    .register-subtitle {
      color: #9ca3af;
    }
  }

  .register-form {
    .form-group {
      .form-label {
        color: #e5e7eb;
      }

      .input-wrapper {
        .form-input {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: #fff;

          &:focus {
            background: rgba(255, 255, 255, 0.1);
            border-color: #007cf0;
            box-shadow: 0 0 0 3px rgba(0, 124, 240, 0.2);
          }

          &::placeholder {
            color: #6b7280;
          }
        }

        .input-icon {
          color: #6b7280;
        }

        .password-toggle {
          color: #6b7280;

          &:hover {
            color: #007cf0;
          }
        }
      }
    }

    .form-options {
      .agree-terms {
        .checkbox-text {
          color: #e5e7eb;
        }
      }
    }

    .register-footer {
      .login-text {
        color: #9ca3af;
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
