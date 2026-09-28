/**
 * 渲染验证（temp/ 下，按 AGENT.md 留档不删）
 *
 * 用真实用户行为验证 dist 构建产物：
 *   A. 首屏加载「/」        → 首页渲染、导航 11 项、首页高亮
 *   B. 点击导航链接          → 正文/标题/高亮三者同步切换（走 vue-router pushState）
 *   C. 深链「/#/races」       → 直接落到种族页（另开进程跑，见 run.sh）
 *
 * 注意：vue-router 5 只监听 popstate，不监听 hashchange，
 *      所以**不能**用 location.hash 赋值来模拟导航——必须真的点。
 *
 * 跑法： cd temp/render-check && node check.mjs
 *       START_URL='http://127.0.0.1:8000/#/races' node check.mjs   （深链用例）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Window } from 'happy-dom'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..', '..')
const DIST = path.join(ROOT, 'web', 'dist')
const START = process.env.START_URL || 'http://127.0.0.1:8000/'

let pass = 0
let fail = 0
const ok = (cond, msg) => {
  cond ? pass++ : fail++
  console.log(`  ${cond ? '✅' : '❌'} ${msg}`)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- 载入 dist/index.html ----------
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const entry = html.match(/src="\.\/(assets\/[^"]+\.js)"/)
if (!entry) { console.log('❌ 找不到入口脚本'); process.exit(1) }

const win = new Window({ url: START })
const doc = win.document
doc.write(html.replace(/<script\s+type="module"[^>]*><\/script>/, ''))
if (!doc.getElementById('app')) { console.log('❌ 无法把 index.html 写入 DOM'); process.exit(1) }

for (const k of [
  'window', 'document', 'navigator', 'location', 'history',
  'HTMLElement', 'SVGElement', 'Element', 'Node', 'Text', 'Comment',
  'CustomEvent', 'Event', 'MouseEvent', 'KeyboardEvent', 'MutationObserver',
  'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  'localStorage', 'sessionStorage', 'performance'
]) {
  if (win[k] === undefined) continue
  // Node 24 自带只读的 navigator/location，直接赋值会抛 TypeError，故用 defineProperty 覆盖
  try {
    Object.defineProperty(globalThis, k, {
      value: win[k], writable: true, configurable: true, enumerable: false
    })
  } catch { /* 覆盖不了就沿用 Node 自带的 */ }
}
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)

const navState = () =>
  [...doc.querySelectorAll('header nav a')].map((a) => ({
    text: a.textContent.trim(),
    active: a.classList.contains('active')
  }))
const activeText = () => navState().filter((n) => n.active).map((n) => n.text).join(',')
const firstH2 = () => {
  const el = doc.querySelector('main h2')
  return el ? el.textContent.trim() : '(无 h2)'
}
const clickNav = async (label) => {
  const a = [...doc.querySelectorAll('header nav a')].find((x) => x.textContent.trim() === label)
  if (!a) throw new Error('导航里找不到：' + label)
  a.click()
  await sleep(400)
}

try {
  await import(pathToFileURL(path.join(DIST, entry[1])).href)
} catch (e) {
  console.log('❌ 入口模块加载抛错：', e && e.stack ? e.stack : e)
  process.exit(1)
}
await sleep(400)

// ================= 深链用例 =================
if (START.includes('#/')) {
  console.log('='.repeat(64))
  console.log(`① 深链  ${START}`)
  console.log('='.repeat(64))
  ok(doc.querySelector('header nav') !== null, '导航已渲染')
  ok(navState().length === 11, `导航项 = ${navState().length}（应为 11）`)
  const want = { '/races': ['种族', '六大种族 · 埃拉西亚大陆'], '/power': ['力量体系', '力量体系 · 埃拉西亚大陆'] }
  const hash = START.split('#')[1]
  const exp = want[hash]
  if (exp) {
    ok(activeText() === exp[0], `深链直接高亮「${exp[0]}」（实际: ${activeText() || '无'}）`)
    ok(doc.title === exp[1], `标题 = ${doc.title}`)
  }
  ok(doc.querySelector('main h2') !== null, `正文已渲染，首个 h2 = ${firstH2()}`)
} else {
  // ================= 用例 A：首屏 =================
  console.log('='.repeat(64))
  console.log('① 首屏加载「/」')
  console.log('='.repeat(64))
  const app = doc.getElementById('app')
  ok(app && app.children.length > 0, `#app 已挂载（子节点 ${app ? app.children.length : 0} 个）`)
  ok(!!doc.querySelector('header'), '存在 <header>')
  ok(navState().length === 11, `导航项 = ${navState().length}（应为 11）`)
  ok(activeText() === '首页', `激活态 = 首页（实际: ${activeText() || '无'}）`)
  ok(doc.title === '埃拉西亚大陆 · 完整世界观设定', `标题 = ${doc.title}`)
  ok(firstH2() === '埃拉西亚大陆', `首个 h2 = ${firstH2()}`)
  ok(doc.querySelectorAll('main section').length > 0,
     `首页 section 数 = ${doc.querySelectorAll('main section').length}`)

  // ================= 用例 B：点击切换 =================
  console.log('='.repeat(64))
  console.log('② 点击导航 → 力量体系')
  console.log('='.repeat(64))
  const h2Before = firstH2()
  await clickNav('力量体系')
  ok(win.location.hash === '#/power', `URL hash = ${win.location.hash}`)
  ok(activeText() === '力量体系', `激活态切到「力量体系」（实际: ${activeText()}）`)
  ok(doc.title === '力量体系 · 埃拉西亚大陆', `标题 = ${doc.title}`)
  ok(firstH2() !== h2Before, `正文已换（首个 h2: ${h2Before} → ${firstH2()}）`)
  ok(doc.body.textContent.includes('相消律'), '正文含力量体系核心概念「相消律」')
  ok(!navState().find((n) => n.text === '首页').active, '首页标签已取消高亮')

  console.log('='.repeat(64))
  console.log('③ 点击导航 → 术语表 → 首页（往返闭环）')
  console.log('='.repeat(64))
  await clickNav('术语表')
  ok(activeText() === '术语表', `激活态 = 术语表（实际: ${activeText()}）`)
  ok(doc.title === '术语表 · 埃拉西亚大陆', `标题 = ${doc.title}`)
  await clickNav('首页')
  ok(activeText() === '首页', `回到首页（激活态 = ${activeText()}）`)
  ok(win.location.hash === '#/', `URL hash = ${win.location.hash}`)
  ok(firstH2() === '埃拉西亚大陆', `首页正文恢复（首个 h2 = ${firstH2()}）`)
}

console.log('='.repeat(64))
console.log(`通过 ${pass} · 失败 ${fail}   ${fail === 0 ? '✅ 渲染验证通过' : '❌ 有问题'}`)
console.log('='.repeat(64))
process.exit(fail ? 1 : 0)
