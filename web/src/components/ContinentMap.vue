<script>
/**
 * 大陆地图 —— 数据驱动渲染
 *
 * 本组件**不含任何具体坐标**：全部内容来自 data/mapData.js。
 * 用 render() 函数而非 template，是因为要递归渲染节点树
 * （template 里没法自然地把 vnode 数组塞进 <g>，v-html 又对 SVG 不可靠）。
 *
 * 交互：
 *   hover  → 区域高亮 + 右侧跟随鼠标的悬浮卡（名字 / 归属 / 危险度 / 一句话）
 *   click  → 跳转该区详情页 /geography/:slug
 *   提示卡用 position:fixed —— #map-wrap 有 overflow:auto，absolute 会被裁掉
 */
import { h } from 'vue'
import { VIEWBOX, defsNodes, baseLayers, regions, overlays, legend } from '@/data/mapData'
import { renderNodes } from '@/lib/svgNodes'   // 共享工具，不复制第二份

const TIP_W = 290
const TIP_H = 236

export default {
  name: 'ContinentMap',

  data() {
    return { active: null, tx: 0, ty: 0 }
  },

  methods: {
    /* 让提示卡始终留在视口内：右侧放不下就翻到左边，底部放不下就上移 */
    place(e) {
      const pad = 18
      let x = e.clientX + pad
      let y = e.clientY + pad
      if (x + TIP_W > window.innerWidth - 8) x = e.clientX - TIP_W - pad
      if (y + TIP_H > window.innerHeight - 8) y = window.innerHeight - TIP_H - 8
      if (y < 8) y = 8
      this.tx = x
      this.ty = y
    },
    enter(r, e) {
      this.active = r
      this.place(e)
    },
    leave() {
      this.active = null
    },
    go(r) {
      if (r && r.slug) this.$router.push('/geography/' + r.slug)
    }
  },

  render() {
    const a = this.active

    const tip = a
      ? h('div', { class: 'map-tip', style: { left: this.tx + 'px', top: this.ty + 'px' } }, [
          h('div', { class: 'tip-head' }, [
            h('span', { class: 'tip-num' }, a.num),
            h('b', null, a.name),
            h('i', null, a.en)
          ]),
          h('div', { class: 'tip-row' }, [h('span', null, '方位'), h('em', null, a.dir)]),
          h('div', { class: 'tip-row' }, [h('span', null, '归属'), h('em', null, a.tip.ruler)]),
          h('div', { class: 'tip-row' }, [h('span', null, '危险'), h('em', { class: 'hz' }, a.tip.hazard)]),
          h('p', { class: 'tip-key' }, a.tip.key),
          h('div', { class: 'tip-tag' }, a.tip.tag),
          h('div', { class: 'tip-go' }, '点击进入该区详情页 →')
        ])
      : null

    return h('div', { id: 'map-wrap' }, [
      h('svg', {
        id: 'continentMap',
        viewBox: VIEWBOX,
        xmlns: 'http://www.w3.org/2000/svg',
        onMousemove: this.place,
        onMouseleave: this.leave
      }, [
        h('defs', null, renderNodes(defsNodes)),
        ...renderNodes(baseLayers),

        /* 区域层：数组顺序即 z 序 */
        ...regions.map((r) =>
          h('g', {
            key: r.id,
            class: ['map-region', a && a.id === r.id ? 'on' : ''],
            onMouseenter: (e) => this.enter(r, e),
            onClick: () => this.go(r)
          }, renderNodes(r.draw))
        ),

        ...renderNodes(overlays)
      ]),

      tip,

      h('div', { class: 'map-legend' },
        legend.map((l, i) =>
          h('div', { class: 'legend-item', key: i }, [
            h('span', { class: 'swatch', style: { background: l.color } }),
            l.label
          ])
        )
      )
    ])
  }
}
</script>
