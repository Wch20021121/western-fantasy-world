#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
项目校验脚本 —— 改动后必跑：python3 scripts/check.py
检查 markdown 结构/断链 + HTML 标签平衡/嵌套/断链。
0 问题才算完成。（本脚本由 AI 创建，按 AGENT.md 规矩保留在 scripts/ 中，勿删）
"""
import io
import os
import re
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MD_TAGS = ['div', 'section', 'table', 'tr', 'td', 'th', 'p', 'b', 'a', 'ul', 'li',
           'h1', 'h2', 'h3', 'h4', 'span', 'nav', 'main', 'header', 'footer']


def scan_md(path):
    """返回问题列表"""
    probs = []
    s = io.open(path, encoding='utf-8').read()

    # 标题（豁免英文副标题行；剔除围栏代码块，避免把 shell 注释 # 当标题）
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

    # 仅要求 docs/ 下的「专题文件」带返回链接（枢纽本身与根目录 README/AGENT 豁免）
    in_docs = os.sep + 'docs' + os.sep in path
    if in_docs and os.path.basename(path) != '大纲.md' and '返回 `大纲.md`' not in s:
        probs.append('缺少「返回大纲」链接')

    # 相对链接断链
    base = os.path.dirname(path)
    for t in sorted(set(re.findall(r'\]\((\./[^)#]+)\)', s))):
        tgt = os.path.normpath(os.path.join(base, t[2:]))
        if not os.path.exists(tgt):
            probs.append('断链 %s' % t)

    return probs


def scan_html(path):
    probs = []
    s = io.open(path, encoding='utf-8').read()

    # 标签开闭平衡
    for t in MD_TAGS:
        o = len(re.findall(r'<%s(?=[\s>])' % t, s))
        c = len(re.findall(r'</%s>' % t, s))
        if o != c:
            probs.append('<%s> 开=%d 闭=%d' % (t, o, c))

    # 嵌套深度
    for t in ('div', 'section'):
        depth, minimum = 0, 0
        for m in re.finditer(r'</?%s(?=[\s>])' % t, s):
            depth += -1 if m.group(0).startswith('</') else 1
            minimum = min(minimum, depth)
        if depth != 0:
            probs.append('<%s> 最终深度=%d（应为 0）' % (t, depth))
        if minimum < 0:
            probs.append('<%s> 嵌套深度为负（多余闭合）' % t)

    # href 断链
    base = os.path.dirname(path)
    for h in sorted(set(re.findall(r'href="([^"#][^"]*)"', s))):
        if h.startswith(('http://', 'https://', 'mailto:')):
            continue
        if not os.path.exists(os.path.join(base, h)):
            probs.append('断链 %s' % h)

    # 导航一致性（每个分页都应有完整导航且唯一 active）
    nav = s.split('<nav>')[1].split('</nav>')[0] if '<nav>' in s else ''
    if nav:
        n = len(re.findall(r'<a href=', nav))
        act = len(re.findall(r'class="active"', nav))
        if n != 11:
            probs.append('导航项=%d（应为 11）' % n)
        if act != 1:
            probs.append('active 数=%d（应为 1）' % act)

    return probs


def main():
    md_files = sorted(glob.glob(os.path.join(ROOT, '*.md')) +
                      glob.glob(os.path.join(ROOT, 'docs', '*.md')))
    html_files = sorted(glob.glob(os.path.join(ROOT, 'site', '*.html')))

    total_bad = 0

    print('=' * 62)
    print('Markdown 校验（%d 个）' % len(md_files))
    print('=' * 62)
    for f in md_files:
        p = scan_md(f)
        rel = os.path.relpath(f, ROOT)
        if p:
            total_bad += len(p)
            print('  FAIL %-34s' % rel)
            for x in p:
                print('        - %s' % x)
        else:
            print('  OK   %s' % rel)

    print('=' * 62)
    print('HTML 校验（%d 个）' % len(html_files))
    print('=' * 62)
    for f in html_files:
        p = scan_html(f)
        rel = os.path.relpath(f, ROOT)
        if p:
            total_bad += len(p)
            print('  FAIL %-34s' % rel)
            for x in p:
                print('        - %s' % x)
        else:
            print('  OK   %s' % rel)

    print('=' * 62)
    print('总问题数：%d   %s' % (total_bad, '✅ 全部通过' if total_bad == 0 else '❌ 需修复'))
    print('=' * 62)
    return 1 if total_bad else 0


if __name__ == '__main__':
    raise SystemExit(main())
