import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Window } from 'happy-dom'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIST = path.join(ROOT, 'web', 'dist')
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const entry = html.match(/src="\.\/(assets\/[^"]+\.js)"/)[1]

const win = new Window({ url: 'http://127.0.0.1:8000/' })
const doc = win.document
doc.write(html.replace(/<script\s+type="module"[^>]*><\/script>/, ''))

for (const k of ['window','document','navigator','location','history','HTMLElement','SVGElement','Element','Node','Text','Comment','Event','MutationObserver','getComputedStyle']) {
  if (win[k] === undefined) continue
  try { Object.defineProperty(globalThis, k, { value: win[k], writable: true, configurable: true, enumerable: false }) } catch {}
}
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
const sleep = ms => new Promise(r => setTimeout(r, ms))

const dump = (tag) => {
  const navEl = doc.querySelector('header nav')
  const navs = [...doc.querySelectorAll('header nav a')].map(a => `${a.textContent.trim()}${a.className ? '[' + a.className + ']' : ''}`)
  console.log(`[${tag}] hash=${win.location.hash || '(空)'} title="${doc.title}"`)
  console.log(`         nav 的 data-rp = ${navEl ? navEl.getAttribute('data-rp') : '(无 nav)'}`)
  console.log(`         nav: ${navs.join(' ')}`)
}
globalThis.__dump = dump

await import(pathToFileURL(path.join(DIST, entry)).href)
await sleep(300)
dump('初始')
const mainBefore = doc.querySelector('main') ? doc.querySelector('main').innerHTML.length : 0
const firstH2 = doc.querySelector('main h2') ? doc.querySelector('main h2').textContent : '(无)'
console.log('         切换前 main 长度 =', mainBefore, '| 首个 h2 =', firstH2)

win.addEventListener('hashchange', (e) => console.log('  [事件] hashchange fired →', win.location.hash))
win.addEventListener('popstate', () => console.log('  [事件] popstate fired'))
console.log('  -- 方式A：直接赋值 location.hash --')
win.location.hash = '#/power'
await sleep(400)
dump('切换后')
console.log('  切换后首个 h2 =', doc.querySelector('main h2') ? doc.querySelector('main h2').textContent : '(无)')
  console.log('  main.innerHTML 长度变了?', (doc.querySelector('main')||{innerHTML:''}).innerHTML.length !== mainBefore)
  console.log('  main.innerHTML 长度:', doc.querySelector('main') ? doc.querySelector('main').innerHTML.length : '无 main')
console.log('  globalThis.document === win.document ?', globalThis.document === win.document)
console.log('  location.hash 读回:', JSON.stringify(win.location.hash))
doc.title = 'ZZZ-测试'
console.log('  手动设 doc.title 是否生效:', JSON.stringify(doc.title))
doc.head.innerHTML = doc.head.innerHTML
console.log('  head 里的 <title>:', JSON.stringify(doc.querySelector('title') && doc.querySelector('title').textContent))
