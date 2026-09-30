#!/usr/bin/env node
/**
 * 把 Vue 站的地图与区域详情数据导出成 JSON（长期工具，按 AGENT.md 放 scripts/）
 *
 * 用法：node scripts/dump_data.mjs
 * 输出：temp/_map_data.json —— 供 scripts/build_site.py 生成 site/map.html
 *
 * 为什么要 shim：web/src/data/regions.js 用了 Vite 别名 import { txt } from '@/lib/svgNodes'，
 * 纯 node 解析不了这个别名，所以在落盘副本里替换成等价的 txt 工厂函数（内容完全一致）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TMP_DIR = path.join(ROOT, 'temp')
fs.mkdirSync(TMP_DIR, { recursive: true })

/* ① regions.js：替换别名 import 后写副本 */
const regionsPath = path.join(ROOT, 'web', 'src', 'data', 'regions.js')
const TXT_SHIM = `const txt = (x, y, fill, size, c, a = {}) => ({ t: 'text', a: { x, y, fill, 'font-size': size, ...a }, c });\n`
const src = fs.readFileSync(regionsPath, 'utf8')
  .replace(/import\s*\{\s*txt\s*\}\s*from\s*'@\/lib\/svgNodes'\s*;?/, TXT_SHIM)
if (/import\s*\{[^}]*\}\s*from\s*'@/.test(src)) {
  console.error('❌ regions.js 里还有未处理的 @/ 别名 import')
  process.exit(1)
}
const shimPath = path.join(TMP_DIR, '_regions_shim.mjs')
fs.writeFileSync(shimPath, src)

/* ② 动态加载两份数据（mapData.js 无 import，可直接加载） */
const regionsMod = await import(pathToFileURL(shimPath).href)
const mapDataMod = await import(pathToFileURL(path.join(ROOT, 'web', 'src', 'data', 'mapData.js')).href)

const mapRegions = (mapDataMod.regions || []).map((r) => ({
  id: r.id, slug: r.slug, num: r.num, name: r.name, en: r.en, dir: r.dir,
  draw: r.draw, tip: r.tip
}))

const out = {
  viewbox: mapDataMod.VIEWBOX,
  defs: mapDataMod.defsNodes,
  base: mapDataMod.baseLayers,
  mapRegions,
  overlays: mapDataMod.overlays,
  legend: mapDataMod.legend || [],
  regions: regionsMod.regions || []
}

const outPath = path.join(TMP_DIR, '_map_data.json')
fs.writeFileSync(outPath, JSON.stringify(out))
console.log(`✅ temp/_map_data.json：${mapRegions.length} 个地图区域 · ${out.regions.length} 个区域详情`)
