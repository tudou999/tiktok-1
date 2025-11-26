import { apiClient } from "./client";

export const SignAPI = {
  // 用户登录
  login(loginFormValue) {
    return apiClient.post("/user/login", {
      email: loginFormValue.email,
      password: loginFormValue.password,
    });
  },

  // 用户注册
  register(registerFormValue) {
    return apiClient.post("/user/register", {
      email: registerFormValue.email,
      password: registerFormValue.password,
      confirmPassword: registerFormValue.confirmPassword,
    });
  },
};

export const RootAPI = {
  // 获取所有用户列表（管理员接口）
  getAllUsers(pageNum, pageSize) {
    return apiClient.get("/user/admin", {
      params: {
        pageNum: pageNum,
        pageSize: pageSize,
      },
    });
  },

  // 删除用户（管理员接口）
  deleteUser(userId) {
    return apiClient.delete(`/user/admin/${userId}`);
  },
};
