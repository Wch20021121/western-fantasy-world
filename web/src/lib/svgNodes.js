/**
 * SVG 节点树 → Vue vnode（两个地图组件共用，别复制第二份）
 *
 * 节点格式：{ t:'标签名', a:{属性}, c:'文本' | [子节点] }
 * 属性名与 SVG 规范完全一致（font-size / stroke-width / text-anchor ...），
 * Vue 会原样透传，不做任何改写。
 */
import { h } from 'vue'

export function renderNodes(nodes) {
  if (!Array.isArray(nodes)) return []
  return nodes.map((n, i) => {
    const a = { key: (n.t || 'n') + '-' + i, ...(n.a || {}) }
    if (typeof n.c === 'string') return h(n.t, a, n.c)
    if (Array.isArray(n.c)) return h(n.t, a, renderNodes(n.c))
    return h(n.t, a)
  })
}

/* 写数据时的几个快捷方式（与 mapData.js 里的一致，便于阅读） */
export const txt = (x, y, fill, size, c, a = {}) => ({
  t: 'text', a: { x, y, fill, 'font-size': size, ...a }, c
})
export const grp = (a, c) => ({ t: 'g', a, c })
export const shape = (t, a) => ({ t, a })
