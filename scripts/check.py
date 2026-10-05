#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
项目校验脚本 —— 改动后必跑：python3 scripts/check.py
0 问题才算完成。（本脚本由 AI 创建，按 AGENTS.md 规矩保留在 scripts/ 中，勿删）

校验四块：
  A. Markdown（根目录 + docs/）
       H1 唯一 · 标题层级不跳跃 · 专题页含「返回大纲」 · 相对链接不断链
  B. Vue 工程（web/）
       路由表 ↔ 视图文件一一对应（无孤儿、无缺件）
       路由字段完整（path/name/meta.nav/meta.title，且路径与名字唯一）
       导航项数与路由一致、标签文字唯一
       入口文件 / App / main.js 结构完整
       无残留的旧静态站链接（page-*.html、index.html、style.css）
       .gitignore 确实挡住了 node_modules 与 dist
  C. 构建产物（web/dist 若存在）
       index.html 引用的 js / css 真实存在
  D. 全文静态站（site/）
       每篇 docs/*.md 都有同名页面 · 页面不得比文档旧（漏同步即报错）
       金丝雀内容必须在（本轮新增设定的关键词）· 站内链接与锚点不断
"""
import io
import os
import re
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'web')
VIEWS = os.path.join(WEB, 'src', 'views')
ROUTES = os.path.join(WEB, 'src', 'router', 'routes.js')

MD_TAGS = ['div', 'section', 'table', 'tr', 'td', 'th', 'p', 'b', 'a', 'ul', 'li',
           'h1', 'h2', 'h3', 'h4', 'span', 'nav', 'main', 'header', 'footer']


# ─────────────────────────── A. Markdown ───────────────────────────
def scan_md(path):
    probs = []
    s = io.open(path, encoding='utf-8').read()

    s_nocode = re.sub(r'```.*?```', '', s, flags=re.S)
    heads = [(len(m.group(1)), m.group(2))
             for m in re.finditer(r'^(#{1,6})\s+(.+)$', s_nocode, re.M)]
    heads = [h for h in heads if not h[1].startswith('ERATHIA')]

    h1 = [h for h in heads if h[0] == 1]
    if len(h1) != 1:
        probs.append('H1 数量=%d（应为 1）' % len(h1))

    prev = 0
    for lv, _ in heads:
        if prev and lv > prev + 1:
            probs.append('标题层级跳跃 %d→%d' % (prev, lv))
        prev = lv

    in_docs = os.sep + 'docs' + os.sep in path
    if in_docs and os.path.basename(path) != '大纲.md' and '返回 `大纲.md`' not in s:
        probs.append('缺少「返回大纲」链接')

    base = os.path.dirname(path)
    for t in sorted(set(re.findall(r'\]\((\./[^)#]+)\)', s))):
        tgt = os.path.normpath(os.path.join(base, t[2:]))
        if not os.path.exists(tgt):
            probs.append('断链 %s' % t)

    return probs


# ─────────────────────────── B. Vue 工程 ───────────────────────────
def _need(probs, path, why):
    if not os.path.exists(path):
        probs.append('缺少 %s（%s）' % (os.path.relpath(path, ROOT), why))
        return False
    return True


def scan_vue_structure():
    """必备文件是否齐全、入口是否接线正确"""
    probs = []
    for rel, why in [
        ('web/package.json', '依赖与脚本定义'),
        ('web/vite.config.js', '构建配置'),
        ('web/index.html', 'Vite 入口 HTML'),
        ('web/src/main.js', '应用挂载入口'),
        ('web/src/App.vue', '根组件'),
        ('web/src/router/index.js', '路由实例'),
        (os.path.relpath(ROUTES, ROOT), '路由表（唯一真值）'),
        ('web/src/components/SiteNav.vue', '共享导航'),
        ('web/src/assets/style.css', '全站样式'),
    ]:
        _need(probs, os.path.join(ROOT, rel), why)

    idx = os.path.join(WEB, 'index.html')
    if os.path.exists(idx):
        s = io.open(idx, encoding='utf-8').read()
        if 'id="app"' not in s:
            probs.append('web/index.html 缺少挂载点 #app')
        if 'src/main.js' not in s:
            probs.append('web/index.html 未引用 /src/main.js')

    main = os.path.join(WEB, 'src', 'main.js')
    if os.path.exists(main):
        s = io.open(main, encoding='utf-8').read()
        if 'createApp' not in s or '.mount(' not in s:
            probs.append('main.js 未调用 createApp(...).mount()')
        if 'style.css' not in s:
            probs.append('main.js 未引入全局样式 style.css')
        if 'router' not in s:
            probs.append('main.js 未安装 router')

    app = os.path.join(WEB, 'src', 'App.vue')
    if os.path.exists(app):
        s = io.open(app, encoding='utf-8').read()
        if '<router-view' not in s:
            probs.append('App.vue 缺少 <router-view>（页面无出口）')
        if 'SiteNav' not in s:
            probs.append('App.vue 未引入 SiteNav（各页会缺导航）')

    return probs


def parse_routes():
    """从 routes.js 抽出 path / name / nav / title / 组件文件"""
    s = io.open(ROUTES, encoding='utf-8').read()
    return {
        'src': s,
        'paths': re.findall(r"\bpath:\s*'([^']+)'", s),
        'names': re.findall(r"\bname:\s*'([^']+)'", s),
        'navs': re.findall(r"\bnav:\s*'([^']+)'", s),
        'titles': re.findall(r"\btitle:\s*'([^']+)'", s),
        'comps': re.findall(r"import\('(@/views/[^']+)'\)", s),
    }


def scan_routes():
    probs = []
    if not os.path.exists(ROUTES):
        return ['无法读取路由表']

    r = parse_routes()
    n = len(r['paths'])

    if n == 0:
        return ['路由表为空']

    # 静态路由（path 不含 ':'）必须进导航；动态路由（如 /geography/:slug）是子页，不进顶栏
    static_n = len([p for p in r['paths'] if ':' not in p])

    # 字段完整性
    for key, label, expect in [('names', 'name', n),
                               ('titles', 'meta.title', n),
                               ('comps', 'component', n),
                               ('navs', 'meta.nav', static_n)]:
        if len(r[key]) != expect:
            probs.append(
                '路由 %d 条（静态 %d）但只有 %d 个 %s —— '
                '静态路由都要进导航，动态子路由（:slug）不进导航'
                % (n, static_n, len(r[key]), label)
            )

    # 唯一性
    for key, label in [('paths', 'path'), ('names', 'name')]:
        dup = sorted({x for x in r[key] if r[key].count(x) > 1})
        if dup:
            probs.append('重复的 %s：%s' % (label, '、'.join(dup)))
    dupnav = sorted({x for x in r['navs'] if r['navs'].count(x) > 1})
    if dupnav:
        probs.append('重复的导航文字：%s' % '、'.join(dupnav))

    # 首个路由必须是首页
    if r['paths'][0] != '/':
        probs.append('首个路由应为 /（当前是 %s）' % r['paths'][0])
    if not all(p.startswith('/') for p in r['paths']):
        probs.append('存在不以 / 开头的路由')

    # meta 化：nav/title 若写在顶层会被 vue-router 静默丢弃
    if re.search(r"\n\s+nav:\s*'", r['src']):
        probs.append('nav 写在了路由顶层（vue-router 只认 meta，会被丢弃）')
    if re.search(r"\n\s+title:\s*'", r['src']):
        probs.append('title 写在了路由顶层（vue-router 只认 meta，会被丢弃）')

    # 组件路径必须都在 @/views 下
    for c in r['comps']:
        if not c.startswith('@/views/'):
            probs.append('组件不在 views 下：%s' % c)

    return probs


def scan_views():
    """路由表 ↔ 视图文件 一一对应"""
    probs = []
    if not os.path.exists(ROUTES) or not os.path.isdir(VIEWS):
        return ['路由表或 views 目录缺失']

    comps = {c.split('/')[-1] for c in parse_routes()['comps']}
    on_disk = {os.path.basename(p) for p in glob.glob(os.path.join(VIEWS, '*.vue'))}

    missing = sorted(comps - on_disk)
    if missing:
        probs.append('路由引用了但文件不存在：%s' % '、'.join(missing))

    orphan = sorted(on_disk - comps)
    if orphan:
        probs.append('视图文件没被任何路由引用（孤儿）：%s' % '、'.join(orphan))

    if not on_disk:
        probs.append('views/ 下没有视图文件')

    return probs


def scan_nav():
    """导航组件必须由路由表生成，且条数一致"""
    probs = []
    nav = os.path.join(WEB, 'src', 'components', 'SiteNav.vue')
    if not os.path.exists(nav):
        return ['SiteNav.vue 缺失']
    s = io.open(nav, encoding='utf-8').read()

    if 'routes' not in s:
        probs.append('SiteNav 未从 routes.js 取导航项（会与路由脱节）')
    if 'router-link' not in s:
        probs.append('SiteNav 未使用 <router-link>（点击会整页刷新）')
    if 'meta.nav' not in s:
        probs.append('SiteNav 未读取 meta.nav')
    if 'route.path' not in s:
        probs.append('SiteNav 未用 route.path 判定激活态')

    return probs


def scan_legacy_links():
    """web/src 里不该残留任何旧静态站的链接方式"""
    probs = []
    for p in glob.glob(os.path.join(WEB, 'src', '**', '*'), recursive=True):
        if not os.path.isfile(p) or not p.endswith(('.vue', '.js', '.html')):
            continue
        s = io.open(p, encoding='utf-8').read()
        rel = os.path.relpath(p, ROOT)
        for bad in re.findall(r'href="(page-[\w-]+\.html)"', s):
            probs.append('%s 残留旧链接 %s' % (rel, bad))
        if re.search(r'href="index\.html"', s):
            probs.append('%s 残留 href="index.html"（应改为 router-link to="/"）' % rel)
        if re.search(r'href="style\.css"', s):
            probs.append('%s 残留 <link href="style.css">（样式应由 main.js 引入）' % rel)
    return probs


def scan_gitignore():
    probs = []
    gi = os.path.join(ROOT, '.gitignore')
    if not os.path.exists(gi):
        return ['.gitignore 缺失']
    s = io.open(gi, encoding='utf-8').read()
    if not re.search(r'(?m)^node_modules/$', s):
        probs.append('.gitignore 未忽略 node_modules/')
    if not re.search(r'(?m)^dist/$', s):
        probs.append('.gitignore 未忽略 dist/（构建产物不该入库）')
    return probs


def scan_dist():
    """如果构建过，产物必须自洽"""
    probs = []
    idx = os.path.join(WEB, 'dist', 'index.html')
    if not os.path.exists(idx):
        return None  # 未构建 → 跳过
    s = io.open(idx, encoding='utf-8').read()
    if 'id="app"' not in s:
        probs.append('dist/index.html 缺少 #app')
    base = os.path.dirname(idx)
    for ref in re.findall(r'(?:src|href)="\./([^"]+)"', s):
        if not os.path.exists(os.path.join(base, ref)):
            probs.append('dist/index.html 引用的资源不存在：%s' % ref)
    if not glob.glob(os.path.join(WEB, 'dist', 'assets', '*.js')):
        probs.append('dist/assets 下没有 JS（构建未完成）')
    return probs


# ───────────────── D. Canon 一致性（已否决的旧口径不得重现）─────────────────
# 每一条都是 docs/03_神位与徽记.md 已定死的事实，修掉过一次就不许再写回来。
def scan_site():
    """site/ 全文静态站：覆盖度 · 新鲜度 · 金丝雀 · 站内链接与锚点

    HTML 由 AI 按 AGENTS.md §7 直接维护（禁止脚本覆盖）——本检查负责“漏同步当场卡住”。
    """
    site = os.path.join(ROOT, 'site')
    probs = []
    if not os.path.isdir(site):
        return ['缺少 site/（全文静态站）——按 AGENTS.md §7 流程补齐']

    # ① 覆盖度 + 新鲜度：每篇 docs 都要有页面，且页面不得比文档旧
    for d in sorted(glob.glob(os.path.join(ROOT, 'docs', '*.md'))):
        stem = os.path.splitext(os.path.basename(d))[0]
        page = os.path.join(site, stem + '.html')
        rel = os.path.relpath(d, ROOT)
        if not os.path.exists(page):
            probs.append('site/ 缺少 %s.html（docs 有此文）——按 AGENTS.md §7 新增页面' % stem)
        elif os.path.getmtime(d) > os.path.getmtime(page):
            probs.append('%s 比 site/%s.html 新 → 文档已改但页面没同步（AGENTS.md §7：AI 直接改 HTML）'
                         % (rel, stem))

    for must in ('index.html', 'map.html'):
        if not os.path.exists(os.path.join(site, must)):
            probs.append('site/ 缺少 ' + must)

    # ② 金丝雀：近期新增的关键设定必须出现在对应页面（防“同步了但漏了重点”）
    CANARY = [
        ('index.html', '四层冲突'),
        ('index.html', '叙事钩子'),
        ('大纲.html', '全文静态站'),
        ('02_力量体系.html', '斗气的神门'),
        ('03_神位与徽记.html', '权柄的属性倾向'),
        ('05_战争与堕落.html', '圣光教会的圣所'),
        ('07_种族与社会.html', '三层结构'),
        ('07_种族与社会.html', '龙人'),
        ('08_地理与传送.html', '内海交互区'),
        ('09_势力与政体.html', '次级势力'),
        ('09_势力与政体.html', '圣山没有印'),
        ('16_修订记录.html', 'v16'),
        ('17_世界厚度.html', '验印师'),
        ('02_力量体系.html', '伤害模型'),
        ('02_力量体系.html', '第七阶在此之前根本不存在'),
        ('03_神位与徽记.html', '不按配额'),
        ('05_战争与堕落.html', '设计过这一刻'),
        ('06_军械与魔物.html', 'S 级不必然要半神'),
        ('08_地理与传送.html', '三支专属团队'),
        ('16_修订记录.html', 'v17'),
    ]
    for page, kw in CANARY:
        p = os.path.join(site, page)
        if not os.path.exists(p):
            continue
        try:
            s = io.open(p, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        if kw not in s:
            probs.append('site/%s 缺少金丝雀内容「%s」——页面与当前大纲脱节' % (page, kw))

    # ③ 站内链接（含锚点）不断
    ids_cache = {}

    def ids_of(path):
        if path not in ids_cache:
            try:
                s = io.open(path, encoding='utf-8').read()
            except (UnicodeDecodeError, OSError):
                s = ''
            ids_cache[path] = set(re.findall(r'id="([^"]+)"', s))
        return ids_cache[path]

    for p in sorted(glob.glob(os.path.join(site, '*.html'))):
        try:
            s = io.open(p, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        for href in re.findall(r'href="([^"]+)"', s):
            if re.match(r'^(https?:|mailto:|javascript:)', href) or href.startswith('#'):
                continue
            tgt, _, anchor = href.partition('#')
            if tgt and not os.path.exists(os.path.join(site, tgt)):
                probs.append('%s 断链 → %s' % (os.path.relpath(p, ROOT), href))
            elif anchor:
                tp = os.path.join(site, tgt) if tgt else p
                if anchor not in ids_of(tp):
                    probs.append('%s 锚点不存在 → %s' % (os.path.relpath(p, ROOT), href))
    return probs


CANON_FORBIDDEN = [
    ('三死',            '九神结局旧口径 → 应为：战死4（水土火黑暗）· 牺牲1（生命）· 归寂1（光明）· 自碎1（战斗）'),
    ('五位沉睡',        '沉睡的只有龙神、风神两位（canon #2：那一代只活两个）'),
    ('五位被他的伤',    '同上，只有两位沉睡'),
    ('五位被蚀主',      '同上，只有两位沉睡'),
    ('5 战死',          '生命是「牺牲」不是战死（docs/03 明写“不是战死”）'),
    ('九件传世兵器',    '应为「七件」；S 级本源七件、仅三件完整（docs/06 §7.3）'),
    ('九件兵器',        '同上，“联军九器”已被 docs/06 §7.5 否决'),
    ('一封印',          '封印的是徽记不是神；结局表里没有“封印”这一项（canon #1）'),
    # ── v15 新增（修完就许再写回来）──
    ('五位半神',        '终局/封印时仅存三位半神：龙神 · 风神 · 尚未归寂的破晓者（canon #2：那一代只活两个）'),
    ('五位幸存',        '立约的是「五位在位半神」（两位原班 ＋ 三位新任），新神是重建期才选定的'),
    ('五位战死',        '战死 4（水/土/火/黑暗）＋ 牺牲 1（生命），不是五位战死'),
    ('锁入圣山',        '光明印实际与黑暗印同封于异次元当锁，对外只宣称「锁于圣山」（canon #24）'),
    ('封入圣山',        '同上——破晓者把光明印封进了异次元，不是圣山'),
    ('光明印在圣山',    '同上；对信徒的公开教义写法是「光明印**安奉**于圣山」，真相只教宗口传'),
    ('中央平原古武院',  '卢西恩与艾德里安同为教会圣所出身（canon #27）'),
    ('被蚀主一击打出裂缝', '战斗印碎于「主动献祭 ＋ 黑暗以太灌入」，不是被打出裂缝后自碎（canon #25）'),
    ('圣山北境',        '圣山已南迁，正对堕落半岛；教会主场在南方'),
    ('西北邦',          '灰铁群山在正北，称号改为「北邦」'),
    # ── v17 新增（修完就不许再写回来）──
    ('黑暗以太武器能打出', 'v17：异属性极限合招也能伤本源，黑暗只是最狠的一档（且被全属性特攻）'),
    ('只为创造',        'v17：击杀是「诸神皆重伤时，士兵的勇气」，没人设计过那一刻'),
    ('本就会诞生在那一带', 'v17：神位迭代是命运，不按地域/血统配额'),
    ('把斗气整理成',    'v17：阶梯是各族后人逐步整理的，不是戈拉赫创造的'),
    ('本源创伤」不可逆',  'v17：长眠万年养回七七八八，暗伤伴随一生'),
    ('不可逆的本源创伤', 'v17：同上'),
    ('原种族继',        'v17：继任是同源使然、非血统规定；印落某族只是命运'),
    ('落回原种族',      'v17：同上'),
    ('被尊为「斗气之祖」', 'v17：戈拉赫是第一个登顶者；「斗气之祖」是误传'),
]


def scan_canon():
    probs = []
    # 豁免：这两份是**历史存档**，职责就是原文引用“曾经的错误表述”
    #   16_修订记录  = 变更日志（记录改了什么，必须引旧文才能说清）
    #   Setting_Audit = 漏洞审计（问题清单，引用的就是漏洞原文）
    # 其余 docs、README、web/src 都是**面向读者的现行正文**，不许出现旧口径。
    EXEMPT = {'16_修订记录.md', 'Erathia_Setting_Audit.md'}
    targets = [p for p in glob.glob(os.path.join(ROOT, 'docs', '*.md'))
               if os.path.basename(p) not in EXEMPT]
    targets += [os.path.join(ROOT, 'README.md')]
    for ext in ('*.vue', '*.js'):
        targets += glob.glob(os.path.join(WEB, 'src', '**', ext), recursive=True)
    # v17：site 全文站同样受 canon 闸门约束（页面必须与当前大纲一致）
    # 豁免：变更日志与漏洞审计——职责就是引用「曾经的错误表述」
    targets += [p for p in glob.glob(os.path.join(ROOT, 'site', '*.html'))
                if os.path.basename(p) not in ('16_修订记录.html', 'Erathia_Setting_Audit.html')]

    for path in targets:
        if 'node_modules' in path:
            continue
        try:
            s = io.open(path, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        for bad, why in CANON_FORBIDDEN:
            if bad in s:
                probs.append('%s 出现已否决口径「%s」—— %s'
                             % (os.path.relpath(path, ROOT), bad, why))
    return probs


def scan_map_data():
    """大陆地图 ↔ 区域详情页 交叉校验：点进去不能 404，版式字段不能缺"""
    probs = []
    map_js = os.path.join(WEB, 'src', 'data', 'mapData.js')
    reg_js = os.path.join(WEB, 'src', 'data', 'regions.js')
    for p in (map_js, reg_js):
        if not os.path.exists(p):
            return ['缺少 %s' % os.path.relpath(p, ROOT)]

    ms = io.open(map_js, encoding='utf-8').read()
    rs = io.open(reg_js, encoding='utf-8').read()

    map_slugs = set(re.findall(r"slug:\s*'([^']+)'", ms))
    reg_slugs = set(re.findall(r"slug:\s*'([^']+)'", rs))

    missing = sorted(map_slugs - reg_slugs)
    if missing:
        probs.append('地图上的区域没有详情页，点击会 404：%s' % '、'.join(missing))
    orphan = sorted(reg_slugs - map_slugs)
    if orphan:
        probs.append('详情页未在地图上出现，无法从地图点入：%s' % '、'.join(orphan))
    if not reg_slugs:
        probs.append('regions.js 里没有任何 slug')

    # RegionView 版式必需的字段，每个区域各一份
    n = len(reg_slugs)
    for field in ('slug', 'num', 'en', 'dir', 'ruler', 'waygate', 'tagline',
                  'sub', 'facts', 'factions', 'hooks'):
        c = len(re.findall(r'\b%s:' % field, rs))
        if c != n:
            probs.append('regions.js 里「%s」出现 %d 次，但有 %d 个区域（字段缺失或重复）'
                         % (field, c, n))
    return probs


# ─────────────────────────── 输出 ───────────────────────────
def main():
    total_bad = 0

    print('=' * 64)
    print('A · Markdown 校验（%d 个）'
          % len(glob.glob(os.path.join(ROOT, '*.md')) +
                glob.glob(os.path.join(ROOT, 'docs', '*.md'))))
    print('=' * 64)
    for f in sorted(glob.glob(os.path.join(ROOT, '*.md')) +
                    glob.glob(os.path.join(ROOT, 'docs', '*.md'))):
        p = scan_md(f)
        rel = os.path.relpath(f, ROOT)
        if p:
            total_bad += len(p)
            print('  FAIL %-34s' % rel)
            for x in p:
                print('        - %s' % x)
        else:
            print('  OK   %s' % rel)

    print('=' * 64)
    print('B · Vue 工程校验（web/）')
    print('=' * 64)
    vue_checks = [
        ('工程结构与入口', scan_vue_structure),
        ('路由表 routes.js', scan_routes),
        ('路由 ↔ 视图一一对应', scan_views),
        ('导航组件 SiteNav', scan_nav),
        ('残留旧静态站链接', scan_legacy_links),
        ('.gitignore', scan_gitignore),
        ('地图 ↔ 区域详情交叉', scan_map_data),
        ('canon 一致性（docs + web）', scan_canon),
        ('site 全文站（覆盖·新鲜·金丝雀·链接）', scan_site),
    ]
    for label, fn in vue_checks:
        p = fn()
        if p:
            total_bad += len(p)
            print('  FAIL %s' % label)
            for x in p:
                print('        - %s' % x)
        else:
            print('  OK   %s' % label)

    print('=' * 64)
    print('C · 构建产物 web/dist')
    print('=' * 64)
    p = scan_dist()
    if p is None:
        print('  SKIP 未构建（跑 scripts/serve.sh build 后再校验）')
    elif p:
        total_bad += len(p)
        print('  FAIL 构建产物')
        for x in p:
            print('        - %s' % x)
    else:
        print('  OK   构建产物自洽')

    print('=' * 64)
    print('总问题数：%d   %s' % (total_bad, '✅ 全部通过' if total_bad == 0 else '❌ 需修复'))
    print('=' * 64)
    return 1 if total_bad else 0


if __name__ == '__main__':
    raise SystemExit(main())
