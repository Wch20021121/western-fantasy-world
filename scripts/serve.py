#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
静态站点服务器 —— 长期工具，按 AGENT.md 规矩放在 scripts/ 中，勿删。

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
    """只做一件事：把日志打到 stdout（便于重定向进 temp/*.log），其余走默认实现。"""

    def log_message(self, fmt, *args):
        sys.stdout.write("%s - %s\n" % (self.log_date_time_string(), fmt % args))
        sys.stdout.flush()


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
