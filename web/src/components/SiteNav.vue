<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { routes } from '@/router/routes'

const route = useRoute()
// 导航项直接由路由表生成 —— 加页面只要改 routes.js，这里自动多出一个标签
const items = computed(() => routes.filter((r) => r.meta && r.meta.nav))
// 用严格相等判定激活：首页 / 只在 / 时高亮（避免前缀匹配导致"首页永远亮"）
const isActive = (path) => route.path === path
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
