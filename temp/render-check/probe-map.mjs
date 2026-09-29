import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Window } from 'happy-dom'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIST = path.join(ROOT, 'web', 'dist')
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const entry = html.match(/src="\.\/(assets\/[^"]+\.js)"/)[1]

const win = new Window({ url: 'http://127.0.0.1:8000/#/geography' })
const doc = win.document
doc.write(html.replace(/<script\s+type="module"[^>]*><\/script>/, ''))
for (const k of ['window','document','navigator','location','history','HTMLElement','SVGElement','Element','Node','Text','Comment','Event','MutationObserver','getComputedStyle']) {
  if (win[k] === undefined) continue
  try { Object.defineProperty(globalThis, k, { value: win[k], writable:true, configurable:true, enumerable:false }) } catch {}
}
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
const sleep = ms => new Promise(r => setTimeout(r, ms))

await import(pathToFileURL(path.join(DIST, entry)).href)
await sleep(500)

let p=0,f=0
const ok=(c,m)=>{c?p++:f++;console.log(`  ${c?'✅':'❌'} ${m}`)}

const svg = doc.querySelector('svg#continentMap')
ok(!!svg, `svg#continentMap 存在（viewBox=${svg?svg.getAttribute('viewBox'):'-'}）`)
const gs = [...doc.querySelectorAll('g.map-region')]
ok(gs.length === 12, `区域组 = ${gs.length}（应为 12：11 区 + 焚天火山）`)
ok(doc.querySelectorAll('.map-legend .legend-item').length === 12, `图例 = ${doc.querySelectorAll('.map-legend .legend-item').length} 项（v15 加了「龙涎渡」→ 11 → 12）`)
ok(doc.querySelectorAll('svg text').length > 30, `SVG 文本节点 = ${doc.querySelectorAll('svg text').length} 个`)
ok(!doc.querySelector('.map-tip'), '未 hover 时不显示提示卡')

// hover
const target = gs.find(g => g.textContent.includes('精灵圣林'))
const evt = new win.MouseEvent('mouseenter', { clientX: 300, clientY: 200, bubbles: false })
target.dispatchEvent(evt)
await sleep(120)
const tip = doc.querySelector('.map-tip')
ok(!!tip, 'hover 后出现提示卡')
if (tip) {
  ok(tip.textContent.includes('精灵圣林'), `提示卡含区域名（${tip.textContent.slice(0,40)}…）`)
  ok(tip.textContent.includes('生命'), '提示卡含归属信息')
  ok(!!tip.style.left && !!tip.style.top, `提示卡有坐标（${tip.style.left}, ${tip.style.top}）`)
}
ok(target.classList.contains('on'), 'hover 的区域获得 .on 高亮类')

// 离开
doc.querySelector('svg#continentMap').dispatchEvent(new win.MouseEvent('mouseleave', {clientX:1,clientY:1}))
await sleep(80)
ok(!doc.querySelector('.map-tip'), '移开后提示卡消失')

console.log(''.padEnd(60,'='))
console.log(`通过 ${p} · 失败 ${f}  ${f?'❌':'✅ 地图渲染与交互正常'}`)
process.exit(f?1:0)
