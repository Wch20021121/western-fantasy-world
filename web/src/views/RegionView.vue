<script setup>
/**
 * 区域详情页 —— 一个组件服务 11 个区域（/geography/:slug）
 *
 * 内容全部来自 data/regions.js（canon 取自 docs/08 §9），
 * 本文件只负责版式，不含任何设定文字 —— 改设定改数据文件。
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { regions, bySlug } from '@/data/regions'
import RegionMap from '@/components/RegionMap.vue'

const route = useRoute()

const region = computed(() => bySlug[route.params.slug] || null)

/* 上一个 / 下一个区域（按 docs/08 §9 的顺序） */
const idx = computed(() => regions.findIndex((r) => r.slug === route.params.slug))
const prev = computed(() => (idx.value > 0 ? regions[idx.value - 1] : null))
const next = computed(() => (idx.value >= 0 && idx.value < regions.length - 1 ? regions[idx.value + 1] : null))
</script>

<template>
  <main v-if="region">
    <div class="page-title">
      <span class="num">{{ region.num }}</span>{{ region.name }}
      <span class="en">{{ region.en }}</span>
    </div>

    <div class="rg-crumb">
      <router-link to="/geography">← 返回大陆地图</router-link>
      <span class="rg-dir">{{ region.dir }}</span>
    </div>

    <p class="rg-tagline">{{ region.tagline }}</p>

    <div class="rg-chips">
      <span class="chip"><i>归属</i>{{ region.ruler }}</span>
      <span class="chip"><i>危险</i><b class="hz">{{ region.hazard }}</b></span>
      <span class="chip"><i>传送网</i>{{ region.waygate }}</span>
    </div>

    <RegionMap :sub="region.sub" />

    <section class="rg-sec">
      <h2>关键事实</h2>
      <div class="rg-facts">
        <div class="fact" v-for="(f, i) in region.facts" :key="i">
          <h3>{{ f.h }}</h3>
          <!-- 文本里用 **…** 标重 → 拆成段后偶数段为正文、奇数段为粗体 -->
          <p><template v-for="(seg, j) in f.p.split('**')" :key="j"><b v-if="j % 2 === 1">{{ seg }}</b><template v-else>{{ seg }}</template></template></p>
        </div>
      </div>
    </section>

    <section class="rg-sec">
      <h2>势力划分</h2>
      <div class="rg-factions">
        <div class="fac" v-for="(f, i) in region.factions" :key="i">
          <span class="dot" :style="{ background: f.color }"></span>
          <div class="fac-body">
            <h3>{{ f.name }}</h3>
            <p><template v-for="(seg, j) in f.note.split('**')" :key="j"><b v-if="j % 2 === 1">{{ seg }}</b><template v-else>{{ seg }}</template></template></p>
          </div>
        </div>
      </div>
    </section>

    <section class="rg-sec">
      <h2>叙事钩子</h2>
      <ul class="rg-hooks">
        <li v-for="(k, i) in region.hooks" :key="i">{{ k }}</li>
      </ul>
    </section>

    <section class="rg-sec" v-if="region.links && region.links.length">
      <h2>相关页面</h2>
      <div class="rg-links">
        <router-link v-for="(l, i) in region.links" :key="i" :to="l.to" class="rg-link">{{ l.label }} →</router-link>
      </div>
    </section>

    <div class="pagefoot">
      <router-link v-if="prev" :to="'/geography/' + prev.slug">← {{ prev.num }} {{ prev.name }}</router-link>
      <a v-else class="disabled">← 已是第一区</a>
      <router-link v-if="next" :to="'/geography/' + next.slug">{{ next.name }} {{ next.num }} →</router-link>
      <a v-else class="disabled">已是最后一区 →</a>
    </div>
  </main>

  <main v-else>
    <div class="page-title"><span class="num">?</span>没有这个区域<span class="en">NOT FOUND</span></div>
    <p class="rg-tagline">地址 <code>{{ route.params.slug }}</code> 不对应任何已登记区域。</p>
    <div class="pagefoot">
      <router-link to="/geography">← 返回大陆地图</router-link>
      <router-link to="/">回首页 →</router-link>
    </div>
  </main>
</template>
