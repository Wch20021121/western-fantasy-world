#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一次性批量转换：site/*.html  →  web/src/views/*.vue
（按 AGENT.md 规矩：一次性补丁脚本写在 temp/，跑完留在原地、禁止 rm）

转换内容：
  ① 抽出 <main>…</main> 与页脚 <footer>…</footer>  →  <template> 根片段
  ② 链接改写
       <a href="index.html">          → <router-link to="/">
       <a href="page-xxx.html">       → <router-link to="/xxx">
       <a class="disabled">…</a>      → <span class="disabled">…</span>（无 href，不是链接）
       </a>                           → </router-link>
  ③ 断言：转换后不得残留任何 <a href="*.html"

用法：
    python3 temp/patch_html2vue.py --dry-run   # 只打印统计，不写盘（先跑这个）
    python3 temp/patch_html2vue.py --write     # 真正写入 web/src/views/
"""
import argparse
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'site')
DST = os.path.join(ROOT, 'web', 'src', 'views')

# 旧文件名 → (路由路径, 视图文件名)
PAGES = [
    ('index.html',            '/',            'HomeView.vue'),
    ('page-world.html',       '/world',       'WorldView.vue'),
    ('page-power.html',       '/power',       'PowerView.vue'),
    ('page-races.html',       '/races',       'RacesView.vue'),
    ('page-factions.html',    '/factions',    'FactionsView.vue'),
    ('page-geography.html',   '/geography',   'GeographyView.vue'),
    ('page-history.html',     '/history',     'HistoryView.vue'),
    ('page-armaments.html',   '/armaments',   'ArmamentsView.vue'),
    ('page-characters.html',  '/characters',  'CharactersView.vue'),
    ('page-presentation.html','/presentation','PresentationView.vue'),
    ('page-glossary.html',    '/glossary',    'GlossaryView.vue'),
]


def convert(html):
    """把一页的 <main>+<footer> 转成视图模板正文；返回 (模板正文, 问题列表)"""
    probs = []

    m_main = re.search(r'<main>([\s\S]*?)</main>', html)
    if not m_main:
        return '', ['找不到 <main>']
    body = '<main>' + m_main.group(1) + '</main>'

    m_foot = re.search(r'(<footer class="footer">[\s\S]*?</footer>)', html)
    if m_foot:
        body += '\n\n' + m_foot.group(1)
    else:
        probs.append('找不到 <footer>')

    # ① 无 href 的 disabled 链接先摘出来（它不是导航）
    body = re.sub(r'<a class="disabled">([\s\S]*?)</a>',
                  r'<span class="disabled">\1</span>', body)

    # ② 页面内互链 → router-link
    body = re.sub(r'<a href="index\.html">', '<router-link to="/">', body)

    def page_link(m):
        stem = m.group(1)               # page-world.html → page-world
        return '<router-link to="/%s">' % stem[len('page-'):]

    body = re.sub(r'<a href="(page-[a-z]+)\.html">', page_link, body)
    body = body.replace('</a>', '</router-link>')

    # ③ 断言：不该有漏网的旧链接
    for bad in re.findall(r'<a href="[^"]*"', body):
        probs.append('残留旧链接 %s' % bad)
    if '<a ' in body:
        probs.append('残留 <a> 标签')

    return body, probs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true', help='真正写盘（默认 dry-run）')
    ap.add_argument('--dry-run', dest='dry', action='store_true',
                    help='只打印统计不写盘（默认行为，显式写出来更直观）')
    args = ap.parse_args()

    print('模式：%s' % ('WRITE 写盘' if args.write else 'DRY-RUN 只打印'))
    print('=' * 66)

    if args.write:
        os.makedirs(DST, exist_ok=True)

    total_prob = 0
    for fname, path, view in PAGES:
        p = os.path.join(SRC, fname)
        if not os.path.exists(p):
            print('  ✗ %-26s 源文件缺失' % fname)
            total_prob += 1
            continue

        s = io.open(p, encoding='utf-8').read()
        body, probs = convert(s)

        n_a = body.count('<router-link')
        out = '<template>\n%s\n</template>\n' % body
        lines = body.count('\n') + 1

        if probs:
            total_prob += len(probs)
            print('  ✗ %-26s → %-22s' % (fname, view))
            for x in probs:
                print('        - %s' % x)
            continue

        print('  ✓ %-26s → %-22s  路由 %-14s %3d 行 · %2d 个 router-link'
              % (fname, view, path, lines, n_a))

        if args.write:
            io.open(os.path.join(DST, view), 'w', encoding='utf-8').write(out)

    print('=' * 66)
    print('问题数：%d   %s' % (total_prob,
                              '✅ 可以写盘' if total_prob == 0 else '❌ 先修问题'))
    if args.write:
        print('已写入：%s' % DST)
    return 1 if total_prob else 0


if __name__ == '__main__':
    sys.exit(main())
