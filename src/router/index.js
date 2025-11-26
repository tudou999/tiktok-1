import { createRouter, createWebHistory } from 'vue-router'

// 懒加载组件封装，支持错误处理
function lazyLoad(view) {
  return () =>
    import(`../views/${view}.vue`).catch(() => {
      console.error(`Failed to load view: ${view}`)
    })
}

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/ai-chat',
    name: 'AIChat',
    component: lazyLoad('AIChat'),
  },
  {
    path: '/login',
    name: 'Login',
    component: lazyLoad('Login'),
  },
  {
    path: '/register',
    name: 'Register',
    component: lazyLoad('Register'),
  },
  {
    path: '/root',
    name: 'Root',
    component: lazyLoad('Root'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
