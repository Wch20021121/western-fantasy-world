/**
 * 大陆底图数据 —— 唯一真值（single source of truth）
 *
 * 以前这 144 行 SVG 是硬编码在 GeographyView.vue 里的；
 * 现在拆出来：**改地名 / 改坐标 / 加区域，只改这一个文件**。
 * 渲染见 components/ContinentMap.vue（递归渲染节点树）。
 *
 * ── 节点格式 ──────────────────────────────────────────────
 *   { t:'标签', a:{属性}, c:'文本' | [子节点] }
 *   属性名与 SVG 完全一致（font-size / stroke-width / text-anchor ...）
 * ──────────────────────────────────────────────────────────
 *
 * ⚠️ 这里的**文字内容**与 docs/08_地理与传送.md「§9 大陆九区」一一对应，
 *    改设定请先改 docs，再同步这里（check.py 有 canon 闸门）。
 */

export const VIEWBOX = '0 0 1000 700'

/* ---------- 小工具：让数据写起来短一点 ---------- */
const t = (x, y, fill, size, c, a = {}) => ({ t: 'text', a: { x, y, fill, 'font-size': size, ...a }, c })
const g = (a, c) => ({ t: 'g', a, c })

/* ---------- 渐变 / 滤镜 ---------- */
export const defsNodes = [
  { t: 'radialGradient', a: { id: 'ocean', cx: '50%', cy: '42%', r: '78%' }, c: [
    { t: 'stop', a: { offset: '0%', 'stop-color': '#bfe0f2' } },
    { t: 'stop', a: { offset: '100%', 'stop-color': '#a5ceed' } }
  ] },
  { t: 'radialGradient', a: { id: 'darkHole', cx: '50%', cy: '45%', r: '60%' }, c: [
    { t: 'stop', a: { offset: '0%', 'stop-color': '#b08ad0' } },
    { t: 'stop', a: { offset: '60%', 'stop-color': '#906cc0' } },
    { t: 'stop', a: { offset: '100%', 'stop-color': '#7d5aa0' } }
  ] },
  { t: 'linearGradient', a: { id: 'inlet', x1: '0', y1: '0', x2: '1', y2: '1' }, c: [
    { t: 'stop', a: { offset: '0%', 'stop-color': '#c2e2f4' } },
    { t: 'stop', a: { offset: '100%', 'stop-color': '#a9d4ee' } }
  ] },
  { t: 'filter', a: { id: 'glow' }, c: [
    { t: 'feGaussianBlur', a: { stdDeviation: '7', result: 'b' } },
    { t: 'feMerge', c: [
      { t: 'feMergeNode', a: { in: 'b' } },
      { t: 'feMergeNode', a: { in: 'SourceGraphic' } }
    ] }
  ] }
]

/* ---------- 底层：海洋 + 主大陆 + 内海（不是"区域"，不参与 hover） ---------- */
export const baseLayers = [
  { t: 'rect', a: { x: 0, y: 0, width: 1000, height: 700, fill: 'url(#ocean)' } },
  { t: 'path', a: {
    d: 'M100,140 C150,70 340,50 490,60 C620,70 720,90 750,150 C780,215 760,310 735,390 C710,460 650,530 570,545 C470,563 395,530 330,488 C260,442 215,532 158,525 C98,518 62,448 60,355 C58,265 65,188 100,140 Z',
    fill: '#d5e6c9', stroke: '#8fae7c', 'stroke-width': 2
  } },
  { t: 'path', a: {
    d: 'M730,420 C680,382 595,362 530,395 C480,420 490,465 538,495 C595,532 675,518 735,475 C770,450 765,440 730,420 Z',
    fill: 'url(#inlet)', stroke: '#7fb6d6', 'stroke-width': 1.5
  } },
  t(610, 445, '#2b5f8a', 12, '内海 · 直抵中央', { 'font-family': 'serif' }),
  t(610, 461, '#4a80a8', 9, '唯一深水出海口 · 咽喉', { 'text-anchor': 'middle' })
]

/* ============================================================
 * 11 个区域 —— 数组顺序即图层顺序（后画的压在上面）
 * 每项：
 *   id     唯一标识
 *   slug   URL 段（/geography/:slug）→ 详情页
 *   num    序号（与 docs/08 §9 的 ①~⑩★ 对齐）
 *   name / en / dir  名称、英文、方位
 *   draw   可 hover 的图形 + 标签
 *   tip    悬浮卡内容
 * ============================================================ */
export const regions = [
  /* ② 灰铁群山（西北） */
  {
    id: 'iron', slug: 'iron-mountains', num: '②', name: '灰铁群山', en: 'IRON MOUNTAINS', dir: '西北',
    draw: [
      g({ fill: '#b9a97e' }, [
        { t: 'polygon', a: { points: '200,175 245,145 288,178' } },
        { t: 'polygon', a: { points: '250,205 290,175 335,212' } },
        { t: 'polygon', a: { points: '170,220 200,195 235,228' } }
      ]),
      t(275, 165, '#4a3f2a', 14, '灰铁群山', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(275, 183, '#6a5a38', 9, '矮人九炉 · 以太赋形圣地', { 'text-anchor': 'middle' }),
      { t: 'circle', a: { cx: 275, cy: 230, r: 5, fill: '#b08a3e', stroke: '#7a5c20', 'stroke-width': 1 } },
      t(275, 248, '#7a5c20', 9, '地心殿堂 · 不动者沉眠', { 'text-anchor': 'middle' }),
      { t: 'ellipse', a: { cx: 255, cy: 195, rx: 105, ry: 78, fill: 'transparent', stroke: 'transparent' } }
    ],
    tip: { ruler: '矮人九炉联合体', hazard: '低', key: '以太赋形圣地；地心殿堂里睡着现任土神与大地磐石玺', tag: '灵地 · 灰铁地心' }
  },

  /* ③ 精灵圣林（东部） */
  {
    id: 'sylvan', slug: 'elven-forest', num: '③', name: '精灵圣林', en: 'SYLVAN GROVE', dir: '东部',
    draw: [
      { t: 'ellipse', a: { cx: 620, cy: 242, rx: 72, ry: 52, fill: '#c2e0b2', stroke: '#7db36a', 'stroke-width': 1.5 } },
      t(620, 232, '#225a2a', 14, '精灵圣林', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(620, 250, '#48753a', 9, '世界树之枝 · 闭林一万三千年', { 'text-anchor': 'middle' }),
      t(620, 264, '#5a8a4a', 8, '树根之下：常青者与生命徽记', { 'text-anchor': 'middle' })
    ],
    tip: { ruler: '精灵（闭林，不接入传送网）', hazard: '高（擅入者死）', key: '现任生命神居此；世界树之枝与生命徽记同在树根之下', tag: '灵地 · 生命' }
  },

  /* ⑥ 东境 · 风眼 */
  {
    id: 'wind', slug: 'wind-eye', num: '⑥', name: '东境 · 风眼', en: 'THE WIND EYE', dir: '东海岸外',
    draw: [
      { t: 'circle', a: { cx: 836, cy: 332, r: 44, fill: 'none', stroke: '#5a90b8', 'stroke-width': 1.6, 'stroke-dasharray': '6 5', opacity: '.7' } },
      { t: 'circle', a: { cx: 836, cy: 332, r: 29, fill: 'none', stroke: '#6fa2c8', 'stroke-width': 1.6, opacity: '.78' } },
      { t: 'circle', a: { cx: 836, cy: 332, r: 15, fill: 'none', stroke: '#8ab4d4', 'stroke-width': 1.6, opacity: '.85' } },
      { t: 'circle', a: { cx: 836, cy: 332, r: 4, fill: '#4a80a8' } },
      { t: 'circle', a: { cx: 836, cy: 332, r: 50, fill: 'transparent', stroke: 'transparent' } },
      t(836, 396, '#2b5f8a', 12, '东境 · 风眼', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(836, 411, '#4a80a8', 8, '一片三万年不散的风暴', { 'text-anchor': 'middle' }),
      t(836, 423, '#5a90b8', 8, '无系者重伤沉睡 · 风徽记', { 'text-anchor': 'middle' })
    ],
    tip: { ruler: '原班风神（凯瑞尔 · 无系者）', hazard: '绝地', key: '三万年不散的风暴——里面睡着一个被同族用命换回来的人', tag: '灵地 · 风' }
  },

  /* ④ 兽人诸部荒原（西南）—— 原图没有轮廓，补一个命中区 */
  {
    id: 'wastes', slug: 'orc-wastes', num: '④', name: '兽人诸部荒原', en: 'ORCISH WASTES', dir: '西南',
    draw: [
      { t: 'ellipse', a: { cx: 268, cy: 448, rx: 132, ry: 78, fill: '#e6dcc0', 'fill-opacity': '.55', stroke: '#c2ad82', 'stroke-width': 1.4, 'stroke-dasharray': '5 4' } },
      t(278, 430, '#4a3a24', 13, '兽人诸部荒原', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(278, 448, '#6a5533', 9, '蛮荒尚武 · 无统一政权', { 'text-anchor': 'middle' })
    ],
    tip: { ruler: '诸部各自为政（无王）', hazard: '高', key: '火徽记传闻埋在这一带；野灵地与奴隶贸易的重叠区', tag: '边陲废弃型野灵地' }
  },

  /* ④ 附 · 焚天活火山（在荒原之内，必须画在它后面） */
  {
    id: 'ember', slug: 'orc-wastes', num: '④', name: '焚天活火山', en: 'EMBERWAKE', dir: '荒原西侧',
    nested: true,
    draw: [
      { t: 'polygon', a: { points: '148,472 176,436 204,472', fill: '#c97d55', stroke: '#9a4a30', 'stroke-width': 1.2 } },
      t(176, 428, '#6a301a', 11, '焚天活火山', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(176, 488, '#8a4a2a', 8, '万炉之主战死之地 · 他的坟', { 'text-anchor': 'middle' }),
      t(176, 500, '#9a5a3a', 8, '火徽记 · 下落不明', { 'text-anchor': 'middle' }),
      { t: 'ellipse', a: { cx: 176, cy: 462, rx: 52, ry: 44, fill: 'transparent', stroke: 'transparent' } }
    ],
    tip: { ruler: '无人（绝地）', hazard: '物理不可达', key: '万炉之主的坟；熔火宝珠残骸沉于地脉，火徽记下落不明', tag: '灵地 · 火' }
  },

  /* ⑤ 圣山（北部） */
  {
    id: 'holy', slug: 'holy-mountain', num: '⑤', name: '圣山 · 圣光圣庭国', en: 'HOLY MOUNTAIN', dir: '北部',
    draw: [
      { t: 'path', a: { d: 'M450,110 L480,78 L510,110 L495,108 L510,132 L450,132 L465,108 Z', fill: '#a8a87e', stroke: '#8a8a6a', 'stroke-width': 1 } },
      t(480, 70, '#5a5a3a', 11, '圣山 · 圣光圣庭国', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(480, 152, '#7a7a4a', 8, '破晓圣盾 · 光明徽记（无主）', { 'text-anchor': 'middle' }),
      { t: 'ellipse', a: { cx: 480, cy: 112, rx: 62, ry: 52, fill: 'transparent', stroke: 'transparent' } }
    ],
    tip: { ruler: '圣光圣庭国（教会）', hazard: '中（政治高压）', key: '一把锁了三万年的锁——世上唯一无主且完整的光明徽记就在这里', tag: '四座空位之一' }
  },

  /* ① 人类中央平原 */
  {
    id: 'plain', slug: 'central-plain', num: '①', name: '人类中央平原', en: 'CENTRAL PLAIN', dir: '大陆中央',
    draw: [
      { t: 'ellipse', a: { cx: 445, cy: 320, rx: 76, ry: 52, fill: '#eef2c8', stroke: '#aab45f', 'stroke-width': 1.5 } },
      t(445, 314, '#4a4a2a', 16, '人类中央平原', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(445, 332, '#6a7038', 10, '文明发源地 · 大陆枢纽', { 'text-anchor': 'middle' }),
      t(445, 346, '#7a8048', 8, '三面接壤诸族 · 一面朝内海', { 'text-anchor': 'middle' })
    ],
    tip: { ruler: '人类城邦联盟（47 邦）', hazard: '中', key: '文明发源地、传送网施工方、阵图口诀的持有者', tag: '枢纽种族 · 三面接壤' }
  },

  /* ★ 誓约之地（大陆中央 · 中立） */
  {
    id: 'pact', slug: 'pact-land', num: '★', name: '誓约之地', en: 'THE PACTLAND', dir: '大陆正中',
    draw: [
      { t: 'circle', a: { cx: 520, cy: 290, r: 16, fill: 'none', stroke: '#b08a3e', 'stroke-width': 2, 'stroke-dasharray': '4 3' } },
      { t: 'circle', a: { cx: 520, cy: 290, r: 5, fill: '#b08a3e' } },
      t(540, 293, '#7a5c20', 9, '★誓约之地（中立 · 公会总部）', { 'font-family': 'serif' }),
      { t: 'circle', a: { cx: 528, cy: 291, r: 46, fill: 'transparent', stroke: 'transparent' } }
    ],
    tip: { ruler: '冒险者公会（自治领）', hazard: '低', key: '中立缓冲带；传送网的中央枢纽，从这里向全大陆辐射', tag: '公会总部 · 灵地（混合）' }
  },

  /* ⑦ 堕落半岛 · 黑暗巨洞（西南外海） */
  {
    id: 'fallen', slug: 'fallen-peninsula', num: '⑦', name: '堕落半岛', en: 'THE FALLEN PENINSULA', dir: '西南外海',
    draw: [
      { t: 'ellipse', a: { cx: 225, cy: 604, rx: 152, ry: 92, fill: 'none', stroke: '#7d3fb0', 'stroke-width': 1.6, 'stroke-dasharray': '8 7', opacity: '.55' } },
      { t: 'path', a: {
        d: 'M100,562 C76,598 110,652 182,664 C265,678 332,645 348,588 C358,540 310,530 258,548 C198,568 132,542 100,562 Z',
        fill: 'url(#darkHole)', stroke: '#7d5bb8', 'stroke-width': 2.5, filter: 'url(#glow)'
      } },
      t(238, 598, '#4a2a6b', 14, '堕落半岛', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(238, 616, '#5a3a7a', 9, '蚀主三万年根据地 · 黑暗回潮', { 'text-anchor': 'middle' }),
      { t: 'circle', a: { cx: 152, cy: 632, r: 17, fill: 'none', stroke: '#3a1a55', 'stroke-width': 3, 'stroke-dasharray': '5 3' } },
      t(152, 628, '#3a1a55', 7, '黑暗', { 'text-anchor': 'middle' }),
      t(152, 639, '#3a1a55', 7, '巨洞', { 'text-anchor': 'middle' }),
      t(356, 520, '#6a3a8a', 9, '符文禁区', { 'text-anchor': 'middle', 'font-family': 'serif' })
    ],
    tip: { ruler: '蚀使与黑暗侧（禁区）', hazard: '极高', key: '外围是符文禁区，唯一通行路径由公会发证；巨洞之下就是黑暗徽记', tag: '没有传送阵' }
  },

  /* ⑧ 上古战场 · 群岛链（扼内海咽喉） */
  {
    id: 'battle', slug: 'ancient-battlefield', num: '⑧', name: '上古战场', en: 'THE ANCIENT BATTLEFIELD', dir: '内海西侧 + 群岛链',
    draw: [
      { t: 'ellipse', a: { cx: 372, cy: 572, rx: 68, ry: 44, fill: '#d8bca0', stroke: '#a98058', 'stroke-width': 2 } },
      { t: 'path', a: { d: 'M348,560 L370,542 L392,560 M380,590 L402,575 L418,592', stroke: '#7a4a2a', 'stroke-width': 2, fill: 'none', opacity: '.6' } },
      t(372, 566, '#5a3018', 13, '上古战场', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(372, 583, '#7a4a2a', 9, '百战战魂铠碎片散落', { 'text-anchor': 'middle' }),
      g({ fill: '#c8ae8a', stroke: '#a98058', 'stroke-width': 1.4 }, [
        { t: 'ellipse', a: { cx: 452, cy: 566, rx: 17, ry: 10 } },
        { t: 'ellipse', a: { cx: 524, cy: 548, rx: 15, ry: 9 } },
        { t: 'ellipse', a: { cx: 592, cy: 530, rx: 14, ry: 8.5 } },
        { t: 'ellipse', a: { cx: 652, cy: 512, rx: 13, ry: 8 } },
        { t: 'ellipse', a: { cx: 706, cy: 492, rx: 12, ry: 7.5 } },
        { t: 'ellipse', a: { cx: 742, cy: 468, rx: 11, ry: 7 } }
      ]),
      t(596, 512, '#7a4a2a', 9.5, '上古群岛链 · 扼内海咽喉', { 'text-anchor': 'middle', 'font-family': 'serif' })
    ],
    tip: { ruler: '公会发证（半开放）', hazard: '高', key: '东段残岛链扼住内海咽喉；战魂铠碎片与斗神印的万千碎片散落于此', tag: '灵地 · 战斗残留' }
  },

  /* ⑨ 龙族龙岛（东北） */
  {
    id: 'dragon', slug: 'dragon-isle', num: '⑨', name: '龙族龙岛', en: 'DRAGON ISLE', dir: '东北',
    draw: [
      { t: 'ellipse', a: { cx: 868, cy: 132, rx: 66, ry: 54, fill: '#ded0da', stroke: '#9a7f8d', 'stroke-width': 2 } },
      { t: 'path', a: { d: 'M840,120 L868,98 L898,122 L886,150 L852,150 Z', fill: '#cbb6c4' } },
      t(868, 118, '#4a3140', 14, '龙族龙岛', { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
      t(868, 135, '#6a4a5a', 9, '高傲独居 · 互不统属', { 'text-anchor': 'middle' }),
      t(868, 152, '#7a5a6a', 8, '龙祖神殿（无人主持）', { 'text-anchor': 'middle' }),
      t(868, 165, '#8a6a7a', 8, '殿上：断折的万龙皇牙', { 'text-anchor': 'middle' })
    ],
    tip: { ruler: '龙族（拒绝接入传送网）', hazard: '高', key: '原班龙神沉睡于龙祖神殿之下——三万年最老的两位神之一', tag: '灵地 · 龙岛雪峰' }
  },

  /* ⑩ 深海宫殿（南部深海）—— 原图只有文字，补一个命中区 */
  {
    id: 'deep', slug: 'deep-sea-palace', num: '⑩', name: '深海宫殿', en: 'THE DEEP PALACE', dir: '南部深海',
    draw: [
      { t: 'ellipse', a: { cx: 600, cy: 660, rx: 118, ry: 34, fill: '#8fbcd8', 'fill-opacity': '.35', stroke: '#5a90b8', 'stroke-width': 1.4, 'stroke-dasharray': '6 5' } },
      t(600, 655, '#3a6a8a', 10, '◈ 深海宫殿 · 沧澜潮音珠 ◈', { 'font-family': 'serif', 'text-anchor': 'middle' }),
      t(600, 672, '#5a80a0', 8, '海裔守护 · 潮音之主与水晶徽记沉眠（海水之下）', { 'text-anchor': 'middle' })
    ],
    tip: { ruler: '海裔（无法布设传送阵）', hazard: '高', key: '现任水神与沧澜潮音珠都在这里——深海沟与洋流迷宫是它的天然屏障', tag: '灵地 · 水' }
  }
]

/* ---------- 上层装饰：航路 + 罗盘（不参与 hover，压在最上） ---------- */
export const overlays = [
  g({ stroke: '#2b5f8a', 'stroke-width': 1.8, 'stroke-dasharray': '7 6', fill: 'none', opacity: '.8' }, [
    { t: 'path', a: { d: 'M440,70 C380,120 480,110 480,190' } },
    { t: 'path', a: { d: 'M340,140 C425,200 460,220 445,274' } },
    { t: 'path', a: { d: 'M640,290 C570,290 530,280 520,290' } },
    { t: 'path', a: { d: 'M345,420 C390,390 440,360 480,330' } },
    { t: 'path', a: { d: 'M330,290 C710,220 770,190 810,170' } },
    { t: 'path', a: { d: 'M360,550 C355,590 300,600 250,602' } }
  ]),
  { t: 'g', a: { transform: 'translate(103,50)', 'font-size': 11, fill: '#2b5f8a', 'font-family': 'serif', 'text-anchor': 'middle' }, c: [
    { t: 'circle', a: { r: 28, fill: 'rgba(255,255,255,.5)', stroke: '#2b5f8a', 'stroke-width': 2 } },
    { t: 'path', a: { d: 'M0,-22 L4,0 L0,22 L-4,0 Z', fill: '#b0392e' } },
    { t: 'path', a: { d: 'M22,0 L0,4 L-22,0 L0,-4 Z', fill: '#2b5f8a' } },
    t(0, -31, '#2b5f8a', 11, 'N'), t(0, 42, '#2b5f8a', 11, 'S'),
    t(36, 3, '#2b5f8a', 11, 'E'), t(-36, 3, '#2b5f8a', 11, 'W')
  ] }
]

/* ---------- 图例 ---------- */
export const legend = [
  { color: '#d5e6c9', label: '主大陆（人 / 精 / 兽 / 矮）' },
  { color: '#eef2c8', label: '人类中央平原' },
  { color: '#9672b8', label: '堕落半岛（黑暗）' },
  { color: '#d8bca0', label: '上古战场 · 群岛链' },
  { color: '#ded0da', label: '龙族龙岛（孤岛）' },
  { color: '#c2e2f4', label: '内海（深入陆地）' },
  { color: '#c97d55', label: '焚天活火山（万炉之主之墓）' },
  { color: '#8ab4d4', label: '东境风眼（无系者沉眠）' },
  { color: '#b08a3e', label: '誓约之地（中立）' },
  { color: '#7d3fb0', label: '半岛符文禁区' },
  { color: '#2b5f8a', label: '主要航路' }
]
