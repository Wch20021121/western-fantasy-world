<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { routes } from '@/router/routes'

const route = useRoute()
// 导航项直接由路由表生成 —— 加页面只要改 routes.js，这里自动多出一个标签
const items = computed(() => routes.filter((r) => r.meta && r.meta.nav))
// 激活判定：自己匹配，或作为**父路径**包含当前页（区域子页 /geography/xxx 要点亮「地理」）
// 首页 '/' 必须排除在前缀匹配之外，否则它会在任何页面都亮着
const isActive = (path) => route.path === path || (path !== '/' && route.path.startsWith(path + '/'))
</script>

<template>
  <nav>
    <router-link
      v-for="item in items"
      :key="item.path"
      :to="item.path"
      :class="{ active: isActive(item.path) }"
    >{{ item.meta.nav }}</router-link>
  </nav>
</template>
