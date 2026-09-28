<script setup>
import SiteNav from '@/components/SiteNav.vue'
</script>

<template>
  <header>
    <div class="brand">
      <h1>
        <router-link to="/">
          埃拉西亚大陆<small>ERATHIA · 完整西幻世界观设定</small>
        </router-link>
      </h1>
      <div class="site-note">誓约纪元 30000 年<br>第 15 次以太潮汐 · 前夜</div>
    </div>

    <SiteNav />
  </header>

  <!-- 路由出口：各视图自带 <main> 与 <footer>，DOM 结构与原静态站完全一致 -->
  <router-view />
</template>
