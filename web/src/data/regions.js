/**
 * 11 个区域的详情数据 —— 唯一真值
 *
 * 每个区域一个页面：/geography/<slug>
 * 页面模板见 views/RegionView.vue，子地图渲染见 components/RegionMap.vue
 *
 * ⚠️ canon 来源：docs/08_地理与传送.md §9「大陆九区」（①~⑩ ＋ ★誓约之地），
 *    势力细节来自 docs/09_势力与政体.md，徽记/神位细节来自 docs/03_神位与徽记.md。
 *    **改设定先改 docs，再同步这里** —— scripts/check.py 有 canon 闸门。
 */
import { txt } from '@/lib/svgNodes'

/* ---------- 子地图小工具 ---------- */
const dot = (x, y, color = '#b08a3e') => ({
  t: 'circle', a: { cx: x, cy: y, r: 6.5, fill: color, stroke: '#fffdf7', 'stroke-width': 2 }
})

const starPath = (cx, cy, r) => {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5
    const rad = i % 2 ? r * 0.45 : r
    d += (i ? 'L' : 'M') + (cx + rad * Math.cos(ang)).toFixed(1) + ',' + (cy + rad * Math.sin(ang)).toFixed(1) + ' '
  }
  return d + 'Z'
}
const star = (x, y, color = '#b08a3e') => ({
  t: 'path', a: { d: starPath(x, y, 12), fill: color, stroke: '#7a5c20', 'stroke-width': 1 }
})

/* 站点：标记 + 名称（上）+ 注释（下） */
const site = (x, y, name, note, opt = {}) => {
  const out = [
    opt.star ? star(x, y, opt.color) : dot(x, y, opt.color),
    txt(x, y - 15, opt.dark || '#3a3428', 11.5, name,
        { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' })
  ]
  if (note) out.push(txt(x, y + 22, '#77736b', 9.5, note, { 'text-anchor': 'middle' }))
  return out
}

const zoneLabel = (x, y, text, sub, color) => [
  txt(x, y, color, 12.5, text, { 'font-weight': 'bold', 'text-anchor': 'middle', 'font-family': 'serif' }),
  ...(sub ? [txt(x, y + 16, color, 9.5, sub, { 'text-anchor': 'middle', opacity: '.85' })] : [])
]

const frame = (fill = '#f3f1e8') => [
  { t: 'rect', a: { x: 0, y: 0, width: 640, height: 400, fill } },
  { t: 'rect', a: { x: 0.5, y: 0.5, width: 639, height: 399, fill: 'none', stroke: '#e3ddd0', 'stroke-width': 1 } }
]

const SUB_VIEWBOX = '0 0 640 400'

export const regions = [
  /* ══════════ ① 人类中央平原 ══════════ */
  {
    slug: 'central-plain', num: '①', name: '人类中央平原', en: 'THE CENTRAL PLAIN',
    dir: '大陆中央 · 三面接壤诸族、一面朝内海',
    ruler: '人类城邦联盟（47 邦）', hazard: '中', waygate: '接入 · 主干与支线最密',
    tagline: '文明发源地、传送网的施工方与图纸持有者——「枢纽种族」的第三根支柱就在这里。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#f6f7e6'),
        { t: 'ellipse', a: { cx: 320, cy: 200, rx: 268, ry: 158, fill: '#eef2c8', stroke: '#aab45f', 'stroke-width': 2 } },
        { t: 'ellipse', a: { cx: 320, cy: 200, rx: 196, ry: 112, fill: '#e6ecc0', stroke: '#aab45f', 'stroke-width': 1.5, 'stroke-dasharray': '7 5' } },
        { t: 'ellipse', a: { cx: 320, cy: 200, rx: 112, ry: 64, fill: '#dde6ae', stroke: '#9aa64f', 'stroke-width': 1.5 } },
        ...zoneLabel(320, 350, '外环 · 27 邦', '边陲自治、各养各兵', '#7a8048'),
        ...zoneLabel(320, 300, '中环 · 17 邦', '商路与征召的中段', '#6a7038'),
        ...zoneLabel(320, 205, '内圈 · 3 邦', '文明发源地', '#4a4a2a'),
        /* 传送网主干（从誓约之地向外辐射） */
        { t: 'g', a: { stroke: '#2b5f8a', 'stroke-width': 2, 'stroke-dasharray': '6 5', fill: 'none', opacity: '.75' }, c: [
          { t: 'path', a: { d: 'M470,148 L320,200 L150,150' } },
          { t: 'path', a: { d: 'M320,200 L150,300' } },
          { t: 'path', a: { d: 'M320,200 L520,280' } }
        ] },
        ...site(470, 148, '誓约之地（中立飞地）', '公会总部 · 见 ★ 专页', { star: true, color: '#b08a3e' }),
        ...site(320, 200, '中央枢纽节点', '半神原始节点 · 载荷最高', { color: '#4f6fb8' }),
        ...site(150, 300, '南境口岸', '通往荒原与半岛的唯一正门', { color: '#9a7f4a' }),
        ...site(540, 292, '内海出海口', '咽喉在上古战场手里', { color: '#4a80a8' })
      ]
    },
    factions: [
      { name: '人类城邦联盟', color: '#b08a3e', note: '47 邦（内圈 3 / 中环 17 / 外环 27），**各邦各养各兵**，真出事时指望不上别人' },
      { name: '冒险者公会', color: '#4f6fb8', note: '总部在誓约之地（中立飞地），握四重命脉与整个大陆的交通命脉' },
      { name: '各行会与商会', color: '#4a9150', note: '工匠行会是传送网的原始施工方；阵图与口诀**至今在人类手里**' }
    ],
    facts: [
      { h: '三面接壤、一面朝内海', p: '这是「枢纽种族」的地理前提：与精灵、兽人、矮人都直接相邻，独占中央平原并直抵内海。' },
      { h: '传信不传兵的受害者，也是受益者', p: '节点之间文书数日可抵大陆另一端，**节点之外仍以月计**。所以 47 邦必须自治、各自养兵——「援军还有三个月」是这个世界最普通的绝望。' },
      { h: '工程垄断', p: '图纸、口诀、阵图全在人类手里；精灵不接、龙族不接、海裔无法建、兽人不服管，矮人只有符文底座。' }
    ],
    hooks: ['内鬼名单在四阶里有数万人', '城邦自治 → 层层设卡的理由', '黑市与奴隶贸易借乱做大'],
    links: [
      { label: '势力与政体 · 人类 47 邦', to: '/factions' },
      { label: '传送网五道闸', to: '/geography' }
    ]
  },

  /* ══════════ ② 灰铁群山 ══════════ */
  {
    slug: 'iron-mountains', num: '②', name: '灰铁群山', en: 'THE IRON MOUNTAINS',
    dir: '正北 · 矮人九炉所在',
    ruler: '矮人九炉联合体', hazard: '低', waygate: '接入（符文底座提供方）',
    tagline: '以太赋形的圣地——矮人能「固化」，却造不出会运转的回路；这道分界决定了大陆的技术版图。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#f4f0e4'),
        /* 山脉 */
        { t: 'g', a: { fill: '#c8b78e', stroke: '#9c8a5e', 'stroke-width': 1.6 }, c: [
          { t: 'polygon', a: { points: '40,150 130,60 220,150' } },
          { t: 'polygon', a: { points: '160,170 260,70 360,170' } },
          { t: 'polygon', a: { points: '300,160 400,55 505,160' } },
          { t: 'polygon', a: { points: '440,180 540,95 620,180' } }
        ] },
        { t: 'g', a: { fill: '#e8e2d2', opacity: '.85' }, c: [
          { t: 'polygon', a: { points: '240,95 260,70 280,95 270,90 260,98 250,90' } },
          { t: 'polygon', a: { points: '380,80 400,55 420,80 410,75 400,83 390,75' } }
        ] },
        ...zoneLabel(320, 300, '九炉联合体', '符文底座 · 以太赋形（只能固化）', '#6a5a38'),
        ...zoneLabel(320, 356, '外缘 · 边陲废弃型野灵地', '各族都不要的群山缝隙', '#8a7a4a'),
        /* 九座炉（示意） */
        { t: 'g', a: { fill: '#a8763e', stroke: '#7a5220', 'stroke-width': 1.4 }, c: [
          { t: 'polygon', a: { points: '120,180 132,160 144,180' } },
          { t: 'polygon', a: { points: '180,196 192,176 204,196' } },
          { t: 'polygon', a: { points: '240,182 252,162 264,182' } },
          { t: 'polygon', a: { points: '300,200 312,180 324,200' } },
          { t: 'polygon', a: { points: '360,186 372,166 384,186' } },
          { t: 'polygon', a: { points: '420,198 432,178 444,198' } },
          { t: 'polygon', a: { points: '480,184 492,164 504,184' } },
          { t: 'polygon', a: { points: '150,212 162,192 174,212' } },
          { t: 'polygon', a: { points: '450,214 462,194 474,214' } }
        ] },
        txt(320, 236, '#7a5220', 10.5, '九炉 · 九座主炉环山而列', { 'text-anchor': 'middle', 'font-family': 'serif' }),
        ...site(320, 128, '地心殿堂', '现任土神 ＋ 大地磐石玺', { color: '#8a6a2a' }),
        ...site(140, 262, '符文底座产线', '底座归矮人，阵法不在他们手里', { color: '#a8763e' })
      ]
    },
    factions: [
      { name: '九炉联合体', color: '#a8763e', note: '九座主炉的联合政体——**九炉立国**，建炉纪年即立国之年' },
      { name: '地心殿堂', color: '#8a6a2a', note: '圣地，外人根本见不到；现任土神与**大地磐石玺**都在这里' }
    ],
    facts: [
      { h: '能固化，不能运转', p: '矮人的「以太赋形」能把以太固化进物质，却造不出会运转的**回路**——可运转的法阵是人类的天才造的。这道分界＝人类掌阵法的起点。' },
      { h: '五道世界级防线之一', p: '灰铁地心是当代五位在位神分居的圣地之一；**上古共约禁止他们直接出手**——神就在那里，却不能下场。' },
      { h: '质量分层的源头', p: '传送网的**符文底座**来自这里，但图纸与口诀在人类手里——技术分工直接变成了权力分工。' }
    ],
    hooks: ['地心殿堂为何外人见不到', '九炉联合体的扩张与灵地归属之争', '符文底座断供的那一天'],
    links: [
      { label: '军械与魔物 · 三大工艺', to: '/armaments' },
      { label: '种族与社会 · 矮人', to: '/races' }
    ]
  },

  /* ══════════ ③ 精灵圣林 ══════════ */
  {
    slug: 'elven-forest', num: '③', name: '精灵圣林', en: 'THE SYLVAN GROVE',
    dir: '东部 · 闭林一万三千年',
    ruler: '精灵（闭林，不接入传送网）', hazard: '高（擅入者死）', waygate: '不接入 —— 这就是「闭林」的物理保证',
    tagline: '世界树之枝与生命徽记同在树根之下；树冠之上是永远不让外人进来的边界。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#eef5e8'),
        { t: 'ellipse', a: { cx: 320, cy: 200, rx: 262, ry: 152, fill: '#c2e0b2', 'fill-opacity': '.5', stroke: '#7db36a', 'stroke-width': 2.5, 'stroke-dasharray': '10 7' } },
        { t: 'ellipse', a: { cx: 320, cy: 200, rx: 196, ry: 112, fill: '#a8d192', 'fill-opacity': '.55', stroke: '#5f9e52', 'stroke-width': 1.6 } },
        /* 树冠 */
        { t: 'g', a: { fill: '#4f9046', opacity: '.9' }, c: [
          { t: 'circle', a: { cx: 320, cy: 170, r: 66 } },
          { t: 'circle', a: { cx: 264, cy: 196, r: 46 } },
          { t: 'circle', a: { cx: 376, cy: 196, r: 46 } },
          { t: 'circle', a: { cx: 320, cy: 232, r: 52 } }
        ] },
        { t: 'path', a: { d: 'M320,232 L320,306', stroke: '#7a5a30', 'stroke-width': 12, 'stroke-linecap': 'round' } },
        { t: 'g', a: { stroke: '#7a5a30', 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, c: [
          { t: 'path', a: { d: 'M320,262 L268,296' } },
          { t: 'path', a: { d: 'M320,262 L374,296' } },
          { t: 'path', a: { d: 'M320,286 L300,330' } }
        ] },
        ...zoneLabel(320, 366, '闭林边界 · 不接入传送网', '「树不点头，你就进不来」', '#3f7a38'),
        ...zoneLabel(320, 60, '圣林核心', '世界树之枝所在', '#225a2a'),
        ...site(320, 168, '世界树之枝', '全大陆只此一株', { color: '#2e8f46' }),
        ...site(320, 300, '树根之下', '现任生命神与**生命徽记**', { color: '#b08a3e' }),
        ...site(140, 240, '现任生命神', '约 3000 年前由印认可的精灵强者继任', { color: '#4a9150' }),
        ...site(516, 148, '边界哨', '外人到此为止', { color: '#6f6c66' })
      ]
    },
    factions: [
      { name: '精灵王庭', color: '#4a9150', note: '闭林一万三千年——**不接入传送网**就是闭林的物理保证' },
      { name: '生命神座', color: '#2e8f46', note: '现任生命神居此；上古生命神「常青者」为救风神本源耗尽而亡' }
    ],
    facts: [
      { h: '两套治愈体系的另一半', p: '生命魔法**修「形」**，无法清除体内的黑暗以太；圣光魔法**净「质」**，不修复肉身。**两者必须同时进行**——于是教义不可调和的两家，现实中只能通过公会间接交换。' },
      { h: '为什么不接入传送网', p: '精灵不接（闭林）——技术不接，就是最彻底的边境管控。' },
      { h: '灵地不对外开放', p: '精灵圣林是「生命」属性的灵地，凡俗**否**——全大陆最浓的以太都被占着，能抢的只有无主野灵地。' }
    ],
    hooks: ['生命魔法与圣光魔法的教义之争', '世界树记录的三万年', '若教会要强行借道'],
    links: [
      { label: '世界本源 · 两套治愈体系', to: '/world' },
      { label: '势力 · 教义与异端', to: '/factions' }
    ]
  },

  /* ══════════ ④ 兽人诸部荒原 ══════════ */
  {
    slug: 'orc-wastes', num: '④', name: '兽人诸部荒原', en: 'THE ORCISH WASTES',
    dir: '内海西南岸 · 蛮荒部落林立',
    ruler: '诸部各自为政（无王）', hazard: '高', waygate: '不接入（部落不服管）',
    tagline: '无统一政权的尚武之地；西侧的焚天活火山是一座埋着神格的坟。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#f5efe0'),
        { t: 'path', a: { d: 'M40,120 C120,60 300,70 420,95 C540,120 610,170 604,250 C596,340 470,372 320,368 C170,364 54,318 40,240 Z', fill: '#e6dcc0', stroke: '#c2ad82', 'stroke-width': 2 } },
        ...zoneLabel(400, 130, '诸部营地', '尚武 · 无统一政权', '#4a3a24'),
        ...zoneLabel(430, 320, '北部边陲', '边陲废弃型野灵地 · 黑市', '#8a7a4a'),
        /* 西侧绝地 */
        { t: 'ellipse', a: { cx: 140, cy: 226, rx: 92, ry: 82, fill: '#f0d4c2', stroke: '#c97d55', 'stroke-width': 2, 'stroke-dasharray': '8 6' } },
        ...zoneLabel(140, 330, '绝地 · 不可接近', '物理不可达', '#9a4a30'),
        { t: 'polygon', a: { points: '104,248 140,166 176,248', fill: '#c97d55', stroke: '#9a4a30', 'stroke-width': 2 } },
        { t: 'polygon', a: { points: '126,214 140,182 154,214', fill: '#b0392e', opacity: '.75' } },
        ...site(140, 150, '焚天活火山', '万炉之主战死之地 · 他的坟', { color: '#b0392e', dark: '#6a301a' }),
        ...site(140, 272, '熔火宝珠残骸', '沉于地脉 · **火徽记下落不明**', { color: '#9a4a30' }),
        ...site(430, 210, '诸部帐群', '各部自立、互不统属', { color: '#8a6a4a' }),
        ...site(516, 300, '奴隶贸易线', '与野灵地、魔物潮重叠', { color: '#6f4a3a' })
      ]
    },
    factions: [
      { name: '诸部（无王）', color: '#8a6a4a', note: '**不服管**是这里的政治常态——所以传送网永远进不来' },
      { name: '焚天活火山（无人）', color: '#b0392e', note: '绝地，凡俗**否**；万炉之主的坟，火徽记传闻埋在这一带' },
      { name: '黑市与奴隶贸易', color: '#6f4a3a', note: '边陲废弃型野灵地的伴生物——**抢的从来不是宝物，是无主的散灵地**' }
    ],
    facts: [
      { h: '火印失踪', p: '矮人只出过两位半神：土与火。火神「万炉之主」战死于荒原，熔火宝珠随他崩碎，那一带烧成焚天活火山——**火徽记就此下落不明**，传闻埋在这一带。' },
      { h: '正在消失的口传寻宝图', p: '少数部落仍握着火印方位的口传记忆，**而知道的人每一代都在少**——寻宝与赛跑同时发生。' },
      { h: '为什么兽潮总能攻城掠地', p: '不是打不过，是**主力永远在路上**：传送网只送信使、军官、死士小队、补给，大军以「月」为节奏。' }
    ],
    hooks: ['火印寻宝线', '口传地图还能传几代', '奴隶贸易趁乱做大'],
    links: [
      { label: '神位与徽记 · 火印失踪', to: '/world' },
      { label: '遗存与真相 · 三种遗存', to: '/presentation' }
    ]
  },

  /* ══════════ ⑤ 圣山 ══════════ */
  {
    slug: 'holy-mountain', num: '⑤', name: '圣山 · 圣光圣庭国', en: 'THE HOLY MOUNTAIN',
    dir: '南方 · 正对堕落半岛（隔海峡相望）',
    ruler: '圣光圣庭国（教会）', hazard: '中（政治高压）', waygate: '接入',
    tagline: '对外宣称「锁了三万年的印」在圣山宝库——真相：圣山只有破晓圣盾与一座空印座，真印在异次元里压着黑暗。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#f6f3ea'),
        { t: 'path', a: { d: 'M40,340 L200,150 L300,240 L400,90 L520,250 L600,180 L600,340 Z', fill: '#dcd8c4', stroke: '#a8a87e', 'stroke-width': 2 } },
        { t: 'path', a: { d: 'M340,165 L400,90 L460,165 L436,158 L460,205 L340,205 L364,158 Z', fill: '#cfcab2', stroke: '#8a8a6a', 'stroke-width': 1.6 } },
        ...zoneLabel(150, 300, '教廷所在', '教义三基 · 异端四级', '#6a6a3a'),
        ...zoneLabel(520, 316, '东麓', '封印渗漏型野灵地 · 邪教与畸变', '#7a6a4a'),
        { t: 'ellipse', a: { cx: 520, cy: 258, rx: 74, ry: 46, fill: '#efe6c8', stroke: '#b08a3e', 'stroke-width': 1.6, 'stroke-dasharray': '7 5' } },
        ...site(400, 130, '圣山宝库', '破晓圣盾 · **完整**', { star: true, color: '#b08a3e', dark: '#5a5a3a' }),
        ...site(400, 214, '空印座（对外宣称锁印之地）', '真印在异次元 · 三万年无法回应认可', { color: '#c9a227', dark: '#5a5a3a' }),
        ...site(150, 230, '教廷档案馆', '两处对不上的记载', { color: '#8a8a5a' }),
        ...site(520, 258, '东麓渗漏点', '靠近封印，以太被「漏」出来', { color: '#7d3fb0' })
      ]
    },
    factions: [
      { name: '圣光圣庭国', color: '#8a8a4a', note: '立于「守候徽记复苏」的教义之上——而这句话的真意是**印会自己选人**' },
      { name: '圣山宝库', color: '#b08a3e', note: '破晓圣盾 + **空印座**（光明徽记对外宣称在此；真印在异次元当锁）' },
      { name: '异端与地下教团', color: '#7d3fb0', note: '异端四级的判定权之争——**谁来宣布「壁神崩溃」？**' }
    ],
    facts: [
      { h: '光明为何三万年选不到', p: '是印睡着了，还是**教会没让它选**？——这是当代最诡异的事实，也是教会最深的恐惧。' },
      { h: '教会的圣地是假的', p: '对外：印自选顶尖强者、议会只见证。<br>真相：**圣山没有印**——真印与黑暗同封于异次元，**不是选不中，是不能**；这句谎言三万年只口传。' },
      { h: '两大治愈体系在这里交汇', p: '教会要求受治者归信、献纳，并贬精灵魔法为「巫术」；精灵认为圣光「只是替世界打扫尘土」。**教义不可调和，现实中却只能通过公会间接交换**——这就是公会握住的命门。' }
    ],
    hooks: ['验印师一句判词', '教会档案里两处对不上的记载', '锁印三万年的守卫已断代'],
    links: [
      { label: '神位与徽记 · 徽记法则', to: '/world' },
      { label: '半神与人物 · 破晓者', to: '/characters' }
    ]
  },

  /* ══════════ ⑥ 东境 · 风眼 ══════════ */
  {
    slug: 'wind-eye', num: '⑥', name: '东境 · 风眼', en: 'THE WIND EYE',
    dir: '大陆东海岸外 · 三万年不散的风暴',
    ruler: '原班风神「凯瑞尔 · 无系者」（沉睡）', hazard: '绝地', waygate: '无法布设',
    tagline: '一片三万年不散的风暴——里面睡着一个被同族用命换回来的人。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#eaf1f8'),
        /* 海 */
        { t: 'rect', a: { x: 0, y: 0, width: 640, height: 400, fill: '#cfe4f2' } },
        { t: 'path', a: { d: 'M0,60 C60,80 90,140 70,210 C52,280 80,340 60,400 L0,400 Z', fill: '#d5e6c9', stroke: '#8fae7c', 'stroke-width': 2 } },
        txt(40, 210, '#4a6a3a', 12, '东海岸', { 'text-anchor': 'middle', 'font-family': 'serif' }),
        ...zoneLabel(330, 372, '禁航圈', '航线一律绕行', '#2b5f8a'),
        /* 风暴圈层 */
        { t: 'circle', a: { cx: 330, cy: 200, r: 152, fill: '#dceaf6', 'fill-opacity': '.55', stroke: '#5a90b8', 'stroke-width': 2.4, 'stroke-dasharray': '12 9' } },
        { t: 'circle', a: { cx: 330, cy: 200, r: 112, fill: '#cfe3f4', 'fill-opacity': '.65', stroke: '#6fa2c8', 'stroke-width': 2 } },
        { t: 'circle', a: { cx: 330, cy: 200, r: 72, fill: '#c2daf0', 'fill-opacity': '.8', stroke: '#8ab4d4', 'stroke-width': 2 } },
        { t: 'g', a: { stroke: '#3a78a8', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', opacity: '.7' }, c: [
          { t: 'path', a: { d: 'M210,150 C260,120 330,132 380,110' } },
          { t: 'path', a: { d: 'M230,262 C290,290 360,272 430,246' } },
          { t: 'path', a: { d: 'M244,196 C300,176 366,206 420,182' } }
        ] },
        ...site(330, 200, '风眼中心', '无系者重伤沉睡 · 风徽记', { star: true, color: '#4f6fb8', dark: '#2b5f8a' }),
        ...site(330, 330, '三万年风暴', '本源创伤不可逆，只能长眠压着', { color: '#5a90b8' }),
        ...site(96, 120, '东境海岸防线', '第一道预警线', { color: '#4a9150' })
      ]
    },
    factions: [
      { name: '无人（绝地）', color: '#5a90b8', note: '凡俗**否**——风暴本身就是最好的防线' },
      { name: '原班风神', color: '#4f6fb8', note: '三万年未醒；他的命是**生命神**用最后的生命换来的' }
    ],
    facts: [
      { h: '五道世界级防线之一', p: '当代五位在位神分居的圣地（龙岛雪峰 / 东境风眼 / 精灵圣林 / 深海宫殿 / 灰铁地心）就是五道防线——**而上古共约禁止他们直接出手**。' },
      { h: '本源创伤', p: '黑暗以太侵入本源所致的**不可逆创伤**，只能以长眠压制——**龙神与风神皆为此伤**。这不是清高，是残废。' },
      { h: '人活着，兵器碎了', p: '终战时逐风羽衣碎裂为漫天风丝（**风徽记碎屑**混入其中）——他本已濒死，被生命神以命相救。' }
    ],
    hooks: ['风眼里的风暴何时会散', '风丝能否被收集', '两枚沉睡三万年的印正在赛跑'],
    links: [
      { label: '战争与堕落 · 伤害类型', to: '/power' },
      { label: '半神与人物 · 无系者', to: '/characters' }
    ]
  },

  /* ══════════ ⑦ 堕落半岛 ══════════ */
  {
    slug: 'fallen-peninsula', num: '⑦', name: '堕落半岛 · 黑暗巨洞', en: 'THE FALLEN PENINSULA',
    dir: '西南外海 · 符文禁区',
    ruler: '蚀使与黑暗侧（禁区）', hazard: '极高', waygate: '**没有传送阵** —— 打进去永远只能走海路',
    tagline: '外围是符文禁区，唯一通行路径由公会发证；而巨洞之下，就是那枚毁不掉的黑暗徽记。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#f0ecf6'),
        { t: 'rect', a: { x: 0, y: 0, width: 640, height: 400, fill: '#cfe4f2' } },
        { t: 'path', a: { d: 'M60,110 C30,170 60,270 170,310 C280,348 430,318 470,238 C500,176 430,104 330,96 C220,88 96,66 60,110 Z', fill: 'url(#darkHole)', stroke: '#7d5bb8', 'stroke-width': 3 } },
        { t: 'ellipse', a: { cx: 264, cy: 204, rx: 236, ry: 150, fill: 'none', stroke: '#7d3fb0', 'stroke-width': 2.6, 'stroke-dasharray': '12 9', opacity: '.75' } },
        ...zoneLabel(300, 372, '符文禁区（外环）', '唯一通行路径由公会发证', '#6a3a8a'),
        ...zoneLabel(470, 130, '走私海路', '禁运名单 → 走私永远走海路', '#2b5f8a'),
        { t: 'ellipse', a: { cx: 200, cy: 236, rx: 96, ry: 76, fill: '#3a1a55', 'fill-opacity': '.35', stroke: '#3a1a55', 'stroke-width': 2.4 } },
        { t: 'circle', a: { cx: 200, cy: 236, r: 34, fill: 'none', stroke: '#2a0f42', 'stroke-width': 4, 'stroke-dasharray': '7 5' } },
        ...site(200, 236, '黑暗巨洞', '封印就在正上方 · 黑暗徽记', { star: true, color: '#7d3fb0', dark: '#3a1a55' }),
        ...site(466, 262, '公会发证卡口', '半岛发证权 = 公会命脉之一', { color: '#4f6fb8' }),
        ...site(546, 96, '三处无名礁', '封印渗漏型野灵地 · 邪教聚集', { color: '#7d3fb0' }),
        ...site(96, 348, '海路', '补给与走私的唯一入口', { color: '#4a80a8' })
      ]
    },
    factions: [
      { name: '黑暗侧 / 蚀使', color: '#7d3fb0', note: '当代蚀使与渗透网络——**反派不在半岛，他们在大陆的名单上**' },
      { name: '冒险者公会', color: '#4f6fb8', note: '握着**半岛发证权**：不发证，谁也进不去——这是公会四重命脉里最敏感的一条' },
      { name: '符文禁区', color: '#6a3a8a', note: '外围禁区——**所以半岛没有传送阵**，打进去永远只能走海路' }
    ],
    facts: [
      { h: '封印的到底是什么', p: '**封在异次元里的，只是一枚没有主人的徽记。** 他三万年前就死在一个无名人类士兵手里。而三万年来所有人都以为他被封着。' },
      { h: '以太潮汐 ＝ 被封徽记的心跳', p: '约 2100 年一次、已 14 次；**第 15 次提前约 1800 年**——徽记在呼吸，潮汐在逼近。' },
      { h: '新蚀主有时间窗', p: '印选人苛刻（光明三万年没选中也是这个原因），**印一出世 ≠ 立即灭世**——新神需要成长，这就是抢时间的全部意义。' }
    ],
    hooks: ['内鬼名单', '蚀主若开口，每个阵营都得重新选边', '两枚印赛跑'],
    links: [
      { label: '战争与堕落 · 卢西恩六步', to: '/history' },
      { label: '世界本源 · 徽记法则', to: '/world' }
    ]
  },

  /* ══════════ ⑧ 上古战场 ══════════ */
  {
    slug: 'ancient-battlefield', num: '⑧', name: '上古战场', en: 'THE ANCIENT BATTLEFIELD',
    dir: '内海西侧 ＋ 东段群岛链',
    ruler: '公会发证（半开放）', hazard: '高', waygate: '接入 · 战略要冲就在路线上',
    tagline: '主岛与残岛链扼住内海咽喉；万千战魂铠碎片与斗神印碎片，就散落在这一带。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#eaf1f8'),
        { t: 'rect', a: { x: 0, y: 0, width: 640, height: 400, fill: '#cfe4f2' } },
        /* 主岛 */
        { t: 'ellipse', a: { cx: 180, cy: 214, rx: 130, ry: 96, fill: '#d8bca0', stroke: '#a98058', 'stroke-width': 2.5 } },
        /* 群岛链（东段咽喉） */
        { t: 'g', a: { fill: '#c8ae8a', stroke: '#a98058', 'stroke-width': 2 }, c: [
          { t: 'ellipse', a: { cx: 340, cy: 176, rx: 34, ry: 21 } },
          { t: 'ellipse', a: { cx: 410, cy: 146, rx: 30, ry: 18 } },
          { t: 'ellipse', a: { cx: 478, cy: 120, rx: 28, ry: 17 } },
          { t: 'ellipse', a: { cx: 546, cy: 98, rx: 26, ry: 16 } },
          { t: 'ellipse', a: { cx: 400, cy: 236, rx: 32, ry: 19 } },
          { t: 'ellipse', a: { cx: 474, cy: 214, rx: 30, ry: 18 } },
          { t: 'ellipse', a: { cx: 548, cy: 192, rx: 28, ry: 17 } }
        ] },
        ...zoneLabel(180, 336, '主岛', '战魂铠碎片散落区', '#5a3018'),
        ...zoneLabel(470, 316, '东段残岛链 · 咽喉', '扼住内海唯一深水出海口', '#7a4a2a'),
        { t: 'path', a: { d: 'M300,330 C400,346 520,342 610,300', stroke: '#2b5f8a', 'stroke-width': 3, 'stroke-dasharray': '9 7', fill: 'none', opacity: '.8' } },
        txt(470, 368, '#2b5f8a', 10.5, '内海航道 · 一切货运的咽喉', { 'text-anchor': 'middle', 'font-family': 'serif' }),
        ...site(180, 170, '百战战魂铠碎片', '与斗神印万千碎片混在一起', { color: '#a98058' }),
        ...site(180, 254, '斗神印碎片', '可恢复 · 不可复原 · 不可封神', { star: true, color: '#b08a3e' }),
        ...site(410, 146, '公会检查站', '发证 / 凭证才可进入', { color: '#4f6fb8' }),
        ...site(548, 192, '咽喉水道', '半（付费 / 凭证）', { color: '#4a80a8' })
      ]
    },
    factions: [
      { name: '冒险者公会', color: '#4f6fb8', note: '发证开放——**半**（付费 / 凭证），是灵地里少数凡俗能用的' },
      { name: '各方寻宝者', color: '#a98058', note: '斗神印碎片、战魂铠碎片——**终局级收集线**' },
      { name: '灾变遗址型野灵地', color: '#7d3fb0', note: '大战打散了原本的灵脉：**魔物 · 遗存**重叠区' }
    ],
    facts: [
      { h: '海峡即命门', p: '内海从东南直抵中央，**东段残岛链扼住咽喉**——谁拿着这条水道，谁就掐着海运。' },
      { h: '斗神印永不可复原', p: '集齐碎片可「**恢复**」且打折、**不能封神**；而集齐所有碎片在物理上接近不可能。' },
      { h: '这个产业是被碎掉的神格喂出来的', p: '战后工匠把以太结晶与碎屑铸成「仿印」量产——**仿印佩戴＝五阶，四阶以下反噬**，真假连半神都分不清。' }
    ],
    hooks: ['验印师与黑市假印', '重铸战斗徽记 · 斗神之位三万年空缺', '潮涨年魔物整体上跳一级'],
    links: [
      { label: '军械与魔物 · E~S 分级', to: '/armaments' },
      { label: '上升路径 · 五条路', to: '/presentation' }
    ]
  },

  /* ══════════ ⑨ 龙族龙岛 ══════════ */
  {
    slug: 'dragon-isle', num: '⑨', name: '龙族龙岛', en: 'DRAGON ISLE',
    dir: '东北 · 孤悬海外',
    ruler: '龙族（高傲 · 互不统属 · 无王）', hazard: '高', waygate: '不接入（龙族拒绝）',
    tagline: '龙脊雪峰上的龙祖神殿没有祭司、没有仪轨、没有议事——有信仰，无组织。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#eaf1f8'),
        { t: 'rect', a: { x: 0, y: 0, width: 640, height: 400, fill: '#cfe4f2' } },
        { t: 'ellipse', a: { cx: 320, cy: 208, rx: 226, ry: 150, fill: '#ded0da', stroke: '#9a7f8d', 'stroke-width': 3 } },
        { t: 'path', a: { d: 'M170,236 L250,110 L320,196 L390,86 L470,236 Z', fill: '#cbb6c4', stroke: '#9a7f8d', 'stroke-width': 2 } },
        { t: 'path', a: { d: 'M232,134 L250,110 L268,134 L258,129 L250,137 L242,129 Z M374,110 L390,86 L406,110 L396,105 L390,113 L384,105 Z', fill: '#f2eef4' } },
        ...zoneLabel(320, 342, '高傲独居 · 拒绝接入传送网', '「龙族不接」', '#4a3140'),
        ...zoneLabel(320, 66, '龙脊雪峰', '龙岛主岛 + 雪峰离岛', '#4a3140'),
        { t: 'ellipse', a: { cx: 320, cy: 236, rx: 62, ry: 40, fill: '#e8dce6', stroke: '#7a5a6a', 'stroke-width': 2 } },
        ...site(320, 152, '龙祖神殿', '**无人主持**：无祭司、无仪轨、无议事', { star: true, color: '#b08a3e', dark: '#4a3140' }),
        ...site(320, 236, '殿下沉睡的龙神', '三万年最老的两位神之一', { color: '#7a5a6a', dark: '#4a3140' }),
        ...site(470, 300, '断折的万龙皇牙', '唯一能刺穿以太护体的长枪 · 枪头在此', { color: '#9a7f8d' }),
        ...site(150, 300, '外围拒止区', '互不统属，没有谁能号令全岛', { color: '#6f4a5a' })
      ]
    },
    factions: [
      { name: '诸龙各自为政', color: '#9a7f8d', note: '**高傲、互不统属、无王**——所以既无外交也无条约可签' },
      { name: '龙祖神殿', color: '#7a5a6a', note: '圣地，外人根本见不到；殿下沉睡着原班龙神' }
    ],
    facts: [
      { h: '记得那场战争的只有两位', p: '全大陆**只有龙神和风神**记得大寂灭之战——一个睡在龙岛雪峰之下，一个睡在东境的风暴里。' },
      { h: '五道世界级防线之一', p: '龙岛雪峰是当代五位在位神分居的圣地之一，而**上古共约禁止他们出手**。' },
      { h: '唯一「神位全空」与「唯一出过灭世者」', p: '那是**人类**——而兽人的神位也全空（斗神自碎）。两个「失去神的种族」，是种族猜忌与赎罪叙事的源头。' }
    ],
    hooks: ['龙族为何拒绝一切', '若龙神醒转，谁先知道', '断枪与皇牙的下落'],
    links: [
      { label: '种族与社会 · 六族天赋寿命', to: '/races' },
      { label: '军械与魔物 · S 级七件', to: '/armaments' }
    ]
  },

  /* ══════════ ⑩ 深海宫殿 ══════════ */
  {
    slug: 'deep-sea-palace', num: '⑩', name: '深海宫殿', en: 'THE DEEP PALACE',
    dir: '南部深海 · 海水之下',
    ruler: '海裔', hazard: '高', waygate: '无法布设（技术上做不到）',
    tagline: '现任水神与沧澜潮音珠都在这里——而它凭什么三万年不被发现，是它自己最大的秘密。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#e9f2f7'),
        { t: 'rect', a: { x: 0, y: 0, width: 640, height: 400, fill: '#bcdbea' } },
        { t: 'g', a: { stroke: '#ffffff', 'stroke-width': 2, fill: 'none', opacity: '.55' }, c: [
          { t: 'path', a: { d: 'M0,70 C160,54 320,90 480,70 C560,60 610,66 640,60' } },
          { t: 'path', a: { d: 'M0,130 C160,114 320,150 480,130 C560,120 610,126 640,120' } }
        ] },
        { t: 'path', a: { d: 'M60,400 L60,300 C140,258 220,330 300,300 C380,270 460,338 540,300 L580,400 Z', fill: '#1f5d7a', opacity: '.55' } },
        ...zoneLabel(320, 372, '洋流迷宫', '深层海沟 · 天然屏障', '#1f5d7a'),
        ...zoneLabel(320, 56, '海水之下', '凡俗「否」 · 灵地（水）', '#2b5f8a'),
        /* 水晶宫殿 */
        { t: 'g', a: { fill: '#dfeaf6', stroke: '#6fa2c8', 'stroke-width': 2 }, c: [
          { t: 'polygon', a: { points: '250,268 250,206 288,166 326,206 326,268' } },
          { t: 'polygon', a: { points: '326,268 326,220 356,190 386,220 386,268' } },
          { t: 'polygon', a: { points: '210,268 210,228 232,204 254,228 254,268' } }
        ] },
        { t: 'rect', a: { x: 196, y: 266, width: 204, height: 10, fill: '#6fa2c8' } },
        ...site(288, 130, '水晶宫殿', '海裔守护 · 深层海沟之上', { star: true, color: '#4f6fb8', dark: '#1f5d7a' }),
        ...site(288, 306, '沧澜潮音珠', 'S 级 · 封锁 · 完整', { color: '#2b5f8a' }),
        ...site(470, 200, '现任水神', '由海裔原种族继任 · 居此', { color: '#4a80a8', dark: '#1f5d7a' }),
        ...site(132, 176, '洋流迷宫入口', '千年无人找到的那条路', { color: '#6fa2c8' })
      ]
    },
    factions: [
      { name: '海裔', color: '#4a80a8', note: '「与世无争」却守着**现任水神 + 沧澜潮音珠**这种世界级秘密' },
      { name: '深海宫殿（圣地）', color: '#2b5f8a', note: '五道世界级防线之一；**无法布设传送阵**，所以没有后门' }
    ],
    facts: [
      { h: '凭什么守得住', p: '**深层海沟 ＋ 洋流迷宫 ＋ 水神本身**——这是「海裔守秘能力过低」这条审计项的补法：不是没人想找，是找不到路。' },
      { h: '潮汐系是深海以太的独有运作', p: '魔法六系之一，**主宰者只有海裔**——所以这里的技术既不可复制，也不可替代。' },
      { h: '寿元与人口', p: '海裔寿命 **800–1500**，比人类长一个数量级——三万年对他们不是「无人记得」，而是「几代人」。' }
    ],
    hooks: ['水神为何不回大陆', '洋流迷宫的航图', '潮音珠若离位会怎样'],
    links: [
      { label: '地理与传送 · 大陆尺度', to: '/geography' },
      { label: '种族与社会 · 海裔', to: '/races' }
    ]
  },

  /* ══════════ ★ 誓约之地 ══════════ */
  {
    slug: 'pact-land', num: '★', name: '誓约之地', en: 'THE PACTLAND',
    dir: '大陆正中 · 中立缓冲带',
    ruler: '冒险者公会（自治领）', hazard: '低', waygate: '接入 · 中央枢纽，向全大陆辐射',
    tagline: '全大陆的线都从这里出发——公会不需要养军队，它只需要决定谁的信今天能到。',
    sub: {
      viewBox: SUB_VIEWBOX,
      nodes: [
        ...frame('#f7f3e8'),
        { t: 'ellipse', a: { cx: 320, cy: 200, rx: 250, ry: 154, fill: '#f0e8d2', stroke: '#b08a3e', 'stroke-width': 2.5, 'stroke-dasharray': '10 7' } },
        /* 四方通路 */
        { t: 'g', a: { stroke: '#2b5f8a', 'stroke-width': 3.4, 'stroke-dasharray': '10 7', fill: 'none', opacity: '.85' }, c: [
          { t: 'path', a: { d: 'M320,120 L320,46' } },
          { t: 'path', a: { d: 'M320,280 L320,354' } },
          { t: 'path', a: { d: 'M244,200 L70,200' } },
          { t: 'path', a: { d: 'M396,200 L570,200' } }
        ] },
        txt(320, 36, '#2b5f8a', 10.5, '北 · 圣山', { 'text-anchor': 'middle', 'font-family': 'serif' }),
        txt(320, 374, '#2b5f8a', 10.5, '南 · 内海与群岛链', { 'text-anchor': 'middle', 'font-family': 'serif' }),
        txt(56, 204, '#2b5f8a', 10.5, '西 · 荒原', { 'text-anchor': 'end', 'font-family': 'serif' }),
        txt(584, 204, '#2b5f8a', 10.5, '东 · 圣林', { 'text-anchor': 'start', 'font-family': 'serif' }),
        ...zoneLabel(320, 316, '中立缓冲带', '各方在此放下武器', '#7a5c20'),
        { t: 'rect', a: { x: 236, y: 140, width: 168, height: 74, rx: 10, fill: '#e6d8b4', stroke: '#8a6a2a', 'stroke-width': 2 } },
        { t: 'path', a: { d: 'M236,140 L320,96 L404,140 Z', fill: '#d6c49a', stroke: '#8a6a2a', 'stroke-width': 2 } },
        ...site(320, 258, '中央枢纽节点', '半神原始节点 · 全网最值钱的一站', { color: '#4f6fb8' }),
        ...site(320, 178, '誓约议事厅', '公会总部 · 四重命脉', { star: true, color: '#b08a3e' }),
        ...site(178, 132, '各族使馆区', '中立的代价：谁都不能动手', { color: '#8a6a2a' }),
        ...site(462, 268, '灵地（混合）', '凡俗「半」——付费即可用', { color: '#4a9150' })
      ]
    },
    factions: [
      { name: '冒险者公会', color: '#4f6fb8', note: '自治领；**四重命脉**＝悬赏 / 任务 / 治疗 / 传送网调度（**不是五重**）' },
      { name: '各方使馆与商团', color: '#8a6a2a', note: '中立不是没有力量，是**它选择不把线拔掉**' },
      { name: '混合灵地', color: '#4a9150', note: '凡俗「半」（付费）——与野灵地不同，这里能用但要花钱' }
    ],
    facts: [
      { h: '五道闸的总开关', p: '**票价 ＋ 三证 ＋ 黑名单 ＋ 禁运 ＋ 备案 ＝ 五道闸。** 公会不需要养军队——它只需要决定谁的信今天能到。' },
      { h: '切断一座城，只要三天', p: '切断三天，那座城就变成孤岛：商路断、援军断、消息断、药材断。**「中立」的真正含义是——它选择不把线拔掉。**' },
      { h: '这张网三面受敌', p: '① 垄断被稀释（各城邦自建线越来越多）② **潮汐会让全网失灵**（无论谁的线一起过载）③ 邪教在切断它——切线、毁节点，不需要攻城。' }
    ],
    hooks: ['公会从「唯一」退化成「最大」', '第 15 次潮涨时全网过载', '谁来宣布「壁神崩溃」'],
    links: [
      { label: '势力与政体 · 九大势力', to: '/factions' },
      { label: '地理与传送 · 五道闸', to: '/geography' }
    ]
  }
]

export const bySlug = Object.fromEntries(regions.map((r) => [r.slug, r]))
