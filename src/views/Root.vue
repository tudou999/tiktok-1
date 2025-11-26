<template>
  <el-container class="user-management">
    <!-- 标题 -->
    <el-header>
      <h1>用户管理</h1>
    </el-header>

    <!-- 用户列表 -->
    <el-container>
      <el-table v-loading="loading" size="large" :data="users">
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column
          prop="username"
          label="用户名"
          align="center"
          min-width="150"
        >
          <template #default="scope">
            {{ scope.row.username || "未设置" }}
          </template>
        </el-table-column>
        <el-table-column label="角色" align="center" width="100">
          <template #default="scope">
            <span :class="['role-badge', scope.row.role]">
              {{ getName(scope.row.role) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="90">
          <template #default="scope">
            <el-button
              type="danger"
              size="default"
              color="#dc3545"
              v-if="showButton(scope.row)"
              @click="deleteUser(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-container>

    <!-- 分页 -->
    <el-pagination
      class="pagination-wrapper"
      v-if="!loading && pagination"
      size="large"
      background
      layout="prev, pager, next"
      :total="pagination.total"
      :page-size="pageSize"
      :current-page="pagination.current"
      @current-change="changePage"
    />
  </el-container>
</template>

<script setup>
import { ElMessage, ElMessageBox } from "element-plus";

defineOptions({
  name: "Root",
});

import { ref, onMounted } from "vue";
import { RootAPI } from "../services/user.js";

const users = ref([]);
const loading = ref(false);
const error = ref(null);
const pagination = ref(null);
const currentPage = ref(1);
const pageSize = ref(10);

// 加载用户列表
const loadUsers = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await RootAPI.getAllUsers(
      currentPage.value,
      pageSize.value,
    );

    if (getCode(response)) {
      users.value = response.data.records || [];

      pagination.value = {
        current: Number(response.data.current),
        pages: Number(response.data.pages),
        total: Number(response.data.total),
      };
    } else {
      error.value = response.msg;
      ElMessage.error(error.value);
    }
  } catch (err) {
    ElMessage.error("加载用户列表失败:", err);
    error.value = "网络错误，请检查网络连接";
  } finally {
    loading.value = false;
  }
};

// 切换页面
const changePage = async (page) => {
  if (page < 1 || page > pagination.value.pages) return;

  currentPage.value = page;
  await loadUsers();
};

// 删除用户
// TODO：email需要改成name
const deleteUser = (user) => {
  ElMessageBox.confirm(
    `确定要删除用户 ${user?.email} 吗？此操作不可撤销。`,
    "注意！",
    {
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      type: "warning",
    },
  )
    // 确认删除
    .then(async () => {
      if (!user) return;

      try {
        const response = await RootAPI.deleteUser(user.id);

        if (getCode(response)) {
          ElMessage.success("删除成功！");
          await loadUsers();
        } else {
          ElMessage.error(response.msg);
        }
      } catch (err) {
        console.error("删除用户失败:", err);
      }
    })
    // 取消删除
    .catch(() => {});
};

// 是否显示删除按钮
const showButton = (user) => {
  return user.auth === 0;
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN");
};

// 获得用户权限信息
const getName = (role) => (role === "ADMIN" ? "管理员" : "普通用户");

// 返回操作码
const getCode = (response) => {
  return response.code === 200;
};

// 组件挂载时加载数据
onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
.user-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .error {
    text-align: center;
    padding: 40px;
    font-size: 16px;
    color: #dc3545;
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    border-radius: 4px;
  }

  // 用户角色标签样式
  .role-badge {
    min-width: 64px;
    display: inline-block;
    text-align: center;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;

    &.ADMIN {
      background: #883b7e;
      color: white;
    }

    &.USER {
      background: #83ad50;
      color: white;
    }
  }

  // 删除按钮样式
  .delete-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;

    &:hover:not(:disabled) {
      background: #c82333;
    }

    &:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;

    .dialog {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;

      h3 {
        margin: 0 0 16px 0;
        color: #333;
      }

      p {
        margin: 0 0 20px 0;
        color: #666;
        line-height: 1.5;
      }

      .dialog-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;

        .cancel-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background: #5a6268;
          }
        }

        .confirm-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background: #c82333;
          }
        }
      }
    }
  }
}
</style>
