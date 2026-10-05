#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一次性补丁：按 site/*.html 现状重建全文搜索索引 search-data.js（工作痕迹，按规矩留在 temp/ 不删）。

为什么要它：search-data.js 是从各页正文抽出的**索引数据**（不是 html 内容页）。
页面由 AI 手工改了之后，索引里还是旧文案——搜索会命中旧词、点开是旧摘录。
本脚本只重写 `site/assets/search-data.js` 这一个数据文件，**不碰任何页面**。
"""
import glob, html, io, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')


def strip_tags(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def main():
    order = ['大纲'] + ['%02d' % n for n in range(1, 18)] + ['Erathia_Setting_Audit', 'index', 'map']
    def rank(stem):
        for i, k in enumerate(order):
            if stem == k or stem.startswith(k + '_'):
                return i
        return 99

    idx = []
    for p in sorted(glob.glob(os.path.join(SITE, '*.html')), key=lambda x: rank(os.path.splitext(os.path.basename(x))[0])):
        stem = os.path.splitext(os.path.basename(p))[0]
        s = io.open(p, encoding='utf-8').read()
        title = re.search(r'<title>(.*?)</title>', s, re.S)
        art = re.search(r'<article class="doc">(.*?)</article>', s, re.S)
        body_html = art.group(1) if art else s
        heads = []
        for m in re.finditer(r'<h([23]) id="([^"]+)"[^>]*>(.*?)</h\1>', body_html, re.S):
            hid, htext = m.group(2), strip_tags(m.group(3))
            if htext:
                heads.append([hid, htext])
        idx.append({
            'p': stem + '.html',
            't': strip_tags(title.group(1)) if title else stem,
            'hs': heads,
            'body': strip_tags(body_html)[:6000],
        })

    out = os.path.join(SITE, 'assets', 'search-data.js')
    io.open(out, 'w', encoding='utf-8').write(
        'window.__ERATHIA_IDX=' + json.dumps(idx, ensure_ascii=False) + ';')
    print('✅ search-data.js 重建：%d 页 · %.0f KB'
          % (len(idx), os.path.getsize(out) / 1024))
    for it in idx:
        print('   · %-30s 标题 %d · 目录 %d 条' % (it['p'], len(it['t']), len(it['hs'])))


if __name__ == '__main__':
    raise SystemExit(main())
