import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'

/**
 * 用 HashHistory（URL 形如  http://host:8000/#/power）
 * 而不是 History（/power）——因为生产环境是纯静态托管（scripts/serve.sh → python http.server），
 * 静态服务器不认识 /power 这种路径，会 404；hash 模式只请求一次 index.html，天然兼容。
 * 以后若迁到 Nginx 并配 try_files，可无痛换成 createWebHistory()。
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // 让激活态 class 变成 CSS 里已有的  nav a.active
  linkActiveClass: 'active',
  // 每次换页回到顶部（等价于原静态站"整页刷新"的默认行为）
  scrollBehavior: () => ({ top: 0 })
})

// 切换路由时同步浏览器标签标题
router.afterEach((to) => {
  if (to.meta && to.meta.title) document.title = to.meta.title
})

export default router
