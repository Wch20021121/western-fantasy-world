#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
静态站点服务器 —— 长期工具，按 AGENTS.md 规矩放在 scripts/ 中，勿删。

用法：
    python3 scripts/serve.py                    # 默认：site/ 目录 · 0.0.0.0:8000
    python3 scripts/serve.py --port 8000        # 指定端口
    python3 scripts/serve.py --dir dist         # 换成 Vue 构建产物目录（升级后用这个）
    python3 scripts/serve.py --bind 127.0.0.1   # 只允许本机访问

设计要点：
  · 0.0.0.0 绑定 —— 必须，绑 127.0.0.1 外部无法访问
  · ThreadingHTTPServer —— 浏览器会并行请求 11 个页面 + css，
                            默认单线程的 `python3 -m http.server` 会串行卡顿
  · --dir 可切换 —— 以后 Vue 打包出 dist/ 后，只改这一个参数即可
"""
import argparse
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(SimpleHTTPRequestHandler):
    """只做两件事：日志打到 stdout；给 html 外壳与带哈希的资源加缓存策略。"""

    def log_message(self, fmt, *args):
        sys.stdout.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))
        sys.stdout.flush()

    def send_head(self):
        # 容错：部分客户端（如 curl 直接写中文 URL）不百分号编码，直接发原始 UTF-8 字节；
        # http.server 会按 latin-1 解成乱码 → 404。先把乱码还原成真 UTF-8 再走原逻辑。
        # 已百分号编码的路径是纯 ASCII，往返转换是无操作，不受影响。
        try:
            fixed = self.path.encode('latin-1').decode('utf-8')
            if fixed != self.path:
                self.path = fixed
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
        return super().send_head()

    def end_headers(self):
        # v15：不加缓存头时，浏览器会启发式缓存 index.html ——
        # 旧外壳引用旧的 hash 文件名，而重建后旧 hash 已不存在 → 表现为“内容没更新 / 白屏”。
        #   · html 外壳 → no-cache（每次回源校验，永远拿到新 hash）
        #   · /assets/  → 文件名自带内容哈希，改内容必改名，可长缓存
        try:
            path = self.path.split('?', 1)[0]
            if path.endswith('.html') or path in ('', '/'):
                self.send_header('Cache-Control', 'no-cache')
            elif '/assets/' in path:
                self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        except Exception:
            pass
        super().end_headers()


def main():
    ap = argparse.ArgumentParser(description='静态站点服务器')
    ap.add_argument('--port', type=int, default=8000, help='端口，默认 8000')
    ap.add_argument('--bind', default='0.0.0.0', help='监听地址，默认 0.0.0.0（外部可访问）')
    ap.add_argument('--dir', default='site',
                    help='要服务的目录，默认 site；Vue 升级后改填 dist')
    args = ap.parse_args()

    directory = args.dir if os.path.isabs(args.dir) else os.path.join(ROOT, args.dir)
    if not os.path.isdir(directory):
        print('❌ 目录不存在：%s' % directory)
        return 1

    handler = partial(Handler, directory=directory)
    httpd = ThreadingHTTPServer((args.bind, args.port), handler)

    print('=' * 62)
    print('✅ 服务已启动')
    print('   目录   : %s' % directory)
    print('   监听   : %s:%d' % (args.bind, args.port))
    print('   本机   : http://127.0.0.1:%d/' % args.port)
    print('   外部   : http://<本机公网IP>:%d/' % args.port)
    print('=' * 62)
    sys.stdout.flush()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n已停止')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
