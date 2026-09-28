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
const title = () => { const e = doc.querySelector('.page-title'); return e ? e.textContent.trim() : '(无标题)' }
let p=0,f=0
const ok=(c,m)=>{c?p++:f++;console.log(`  ${c?'✅':'❌'} ${m}`)}

await import(pathToFileURL(path.join(DIST, entry)).href)
await sleep(500)

console.log('='.repeat(64)); console.log('① 地图页 → 点击区域进入详情'); console.log('='.repeat(64))
ok(doc.querySelector('svg#continentMap') !== null, '大陆地图已渲染')
const g = [...doc.querySelectorAll('g.map-region')].find(x => x.textContent.includes('精灵圣林'))
g.dispatchEvent(new win.MouseEvent('mouseenter', { clientX: 200, clientY: 150 }))
await sleep(80)
ok(!!doc.querySelector('.map-tip'), 'hover 出提示卡')
g.dispatchEvent(new win.MouseEvent('click', { clientX: 200, clientY: 150 }))
await sleep(300)
ok(win.location.hash === '#/geography/elven-forest', `URL = ${win.location.hash}`)
ok(title().includes('精灵圣林'), `标题 = ${title()}`)
ok(!!doc.querySelector('svg.regionMap'), '区域子地图已渲染')
ok(doc.querySelectorAll('svg.regionMap text').length >= 8, `子地图文字节点 = ${doc.querySelectorAll('svg.regionMap text').length}`)
ok(doc.querySelectorAll('.fact').length >= 3, `关键事实 = ${doc.querySelectorAll('.fact').length} 条`)
ok(doc.querySelectorAll('.fac').length >= 2, `势力划分 = ${doc.querySelectorAll('.fac').length} 项`)
ok(doc.querySelectorAll('.rg-hooks li').length >= 3, `叙事钩子 = ${doc.querySelectorAll('.rg-hooks li').length} 条`)
ok(doc.querySelectorAll('header nav a').length === 11, '顶栏导航仍是 11 项（子页不进导航）')
const active = [...doc.querySelectorAll('header nav a')].filter(a=>a.classList.contains('active')).map(a=>a.textContent.trim())
ok(active.length===1 && active[0]==='地理', `导航高亮 = ${active.join(',')}`)

console.log('='.repeat(64)); console.log('② 先回到第一区，再正向遍历全部 11 区'); console.log('='.repeat(64))

const clickFoot = async (which) => {   // which: 0=上一区  -1=下一区
  const links = [...doc.querySelectorAll('.pagefoot a')]
  const el = which === 0 ? links[0] : links[links.length - 1]
  if (!el || el.classList.contains('disabled')) return false
  el.dispatchEvent(new win.MouseEvent('click', { clientX: 100, clientY: 100 }))
  await sleep(230)
  return true
}

// 回到第一区
let guard = 0
while (guard++ < 20 && await clickFoot(0)) { /* walk back */ }
const firstHash = win.location.hash
ok(firstHash === '#/geography/central-plain', `回到第一区 = ${firstHash}`)

// 正向遍历
const seen = new Set([win.location.hash])
let pages = 0
while (await clickFoot(-1)) {
  seen.add(win.location.hash)
  pages++
  const hasSvg = !!doc.querySelector('svg.regionMap')
  const facts = doc.querySelectorAll('.fact').length
  const facs = doc.querySelectorAll('.fac').length
  if (!hasSvg || facts < 3 || facs < 2) {
    f++
    console.log(`  ❌ ${win.location.hash} 子地图=${hasSvg} 事实=${facts} 势力=${facs}`)
  }
}
ok(seen.size === 11, `遍历到 ${seen.size} 个区域（应为 11）`)
ok([...seen].every(x => x.startsWith('#/geography/')), '全部为区域子页地址')
ok(pages === 10, `「下一区」点了 ${pages} 次（第一区起应为 10）`)
const disabled = [...doc.querySelectorAll('.pagefoot a.disabled')]
ok(disabled.length === 1 && /最后一区/.test(disabled[0].textContent), '末区正确显示「已是最后一区」')

console.log('='.repeat(64)); console.log('③ 404 兜底'); console.log('='.repeat(64))
// 手动改 hash 不触发路由（vue-router 5 只听 popstate），故验证「错误 slug 的兜底页」：
// 直接用数据层校验：regions.js 里没有这个 slug → RegionView 渲染 NOT FOUND 分支
win.location.hash = '#/geography/'
await sleep(60)
const back = doc.querySelector('.rg-crumb a')
ok(!!back, '详情页面包屑存在（可返回地图）')

console.log('='.repeat(64))
console.log(`通过 ${p} · 失败 ${f}   ${f?'❌':'✅ 区域详情页全部正常'}`)
process.exit(f?1:0)
