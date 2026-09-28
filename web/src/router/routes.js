/**
 * 路由表 —— 全站唯一真值（single source of truth）
 *
 * router 据此生成路由，SiteNav 据此生成导航，scripts/check.py 据此校验视图文件。
 * 增删页面时**只改这一个文件**，再把对应 .vue 丢进 views/ 即可。
 *
 * 字段：
 *   path      路由路径（hash 模式下表现为  #/power）
 *   name      路由名（唯一）
 *   meta.nav  导航栏显示的文字；不填 = 不出现在导航里
 *   meta.title 浏览器标签页标题（切换路由时自动改写 document.title）
 *
 * ⚠️ nav / title 必须写在 meta 里 —— vue-router 只认 meta，
 *    写在路由顶层会被静默丢弃（标题就不会随页面切换）。
 *   component 视图组件（web/src/views/ 下）
 */
export const routes = [
  {
    path: '/',
    name: 'home',
    meta: { nav: '首页', title: '埃拉西亚大陆 · 完整世界观设定' },
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/world',
    name: 'world',
    meta: { nav: '世界本源', title: '世界本源 · 埃拉西亚大陆' },
    component: () => import('@/views/WorldView.vue')
  },
  {
    path: '/power',
    name: 'power',
    meta: { nav: '力量体系', title: '力量体系 · 埃拉西亚大陆' },
    component: () => import('@/views/PowerView.vue')
  },
  {
    path: '/races',
    name: 'races',
    meta: { nav: '种族', title: '六大种族 · 埃拉西亚大陆' },
    component: () => import('@/views/RacesView.vue')
  },
  {
    path: '/factions',
    name: 'factions',
    meta: { nav: '势力', title: '势力图谱 · 埃拉西亚大陆' },
    component: () => import('@/views/FactionsView.vue')
  },
  {
    path: '/geography',
    name: 'geography',
    meta: { nav: '地理', title: '大陆地理 · 埃拉西亚大陆' },
    component: () => import('@/views/GeographyView.vue')
  },
  {
    path: '/history',
    name: 'history',
    meta: { nav: '战史·时间线', title: '战史与时间线 · 埃拉西亚大陆' },
    component: () => import('@/views/HistoryView.vue')
  },
  {
    path: '/armaments',
    name: 'armaments',
    meta: { nav: '联军军械', title: '联军军械目录 · 埃拉西亚大陆' },
    component: () => import('@/views/ArmamentsView.vue')
  },
  {
    path: '/characters',
    name: 'characters',
    meta: { nav: '半神与人物', title: '半神与人物 · 埃拉西亚大陆' },
    component: () => import('@/views/CharactersView.vue')
  },
  {
    path: '/presentation',
    name: 'presentation',
    meta: { nav: '呈现与玩法', title: '呈现与玩法 · 埃拉西亚大陆' },
    component: () => import('@/views/PresentationView.vue')
  },
  {
    path: '/glossary',
    name: 'glossary',
    meta: { nav: '术语表', title: '术语表 · 埃拉西亚大陆' },
    component: () => import('@/views/GlossaryView.vue')
  }
]

export default routes
