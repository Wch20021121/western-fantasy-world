<script>
/**
 * 区域子地图 —— 渲染 data/regions.js 里每个区域的 sub.nodes
 * 与 ContinentMap 共用 lib/svgNodes.js 的递归渲染器，不复制第二份。
 * defs 从 mapData 引入，这样半岛那张图能用到 url(#darkHole) 渐变。
 */
import { h } from 'vue'
import { defsNodes } from '@/data/mapData'
import { renderNodes } from '@/lib/svgNodes'

export default {
  name: 'RegionMap',
  props: {
    sub: { type: Object, required: true }
  },
  render() {
    return h('div', { class: 'region-map-wrap' }, [
      h('svg', {
        class: 'regionMap',
        viewBox: this.sub.viewBox,
        xmlns: 'http://www.w3.org/2000/svg',
        role: 'img'
      }, [
        h('defs', null, renderNodes(defsNodes)),
        ...renderNodes(this.sub.nodes)
      ])
    ])
  }
}
</script>
