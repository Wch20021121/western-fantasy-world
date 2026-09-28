#!/bin/sh
# ============================================================================
# run.sh —— 一键挂载服务
#
#   sh run.sh                 # 构建 + 启动（默认 8000，内外网都开）
#   PORT=9000 sh run.sh       # 临时换端口
#   sh run.sh stop            # 停止
#   sh run.sh status          # 查看状态
#   sh run.sh log             # 查看访问日志
#
# 典型流程：  git pull && sh run.sh
# 想让启动前自动拉代码：  AUTO_PULL=1 sh run.sh
#
# ⚠️ 本文件用 POSIX sh 写成（Ubuntu 上 `sh` = dash），不要用 bash 特性。
# ============================================================================
set -u

# ---------------- 配置区：想改端口就改这一行 ----------------
PORT="${PORT:-8000}"          # 服务端口（临时覆盖：PORT=9000 sh run.sh）
BIND="${BIND:-0.0.0.0}"       # 0.0.0.0 = 外网可访问；127.0.0.1 = 仅本机
AUTO_PULL="${AUTO_PULL:-0}"   # 1 = 启动前自动 git pull
# -----------------------------------------------------------

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT" || exit 1

say() { printf '%s\n' "$*"; }
die() { printf '%s\n' "$*" >&2; exit 1; }

# ---- 子命令：stop / status / log 不需要构建，直接转给 serve.sh ----
case "${1:-}" in
  stop|status|log)
    PORT="$PORT" sh "$ROOT/scripts/serve.sh" "$@"
    exit $?
    ;;
esac

say "=========================================================="
say "  埃拉西亚大陆 · 一键挂载"
say "=========================================================="

# ---- 1. 可选：拉代码 ----
if [ "$AUTO_PULL" = "1" ]; then
  say "▶ git pull ..."
  git pull --ff-only || say "⚠️  git pull 失败（可能没配推送凭据），继续用本地代码启动"
fi

# ---- 2. 依赖：首次运行才装（node_modules 不入库，克隆下来是空的）----
if [ ! -d web/node_modules ]; then
  say "▶ 首次运行，安装 npm 依赖（约 1~5 分钟，只此一次）..."
  command -v npm >/dev/null 2>&1 || die "❌ 找不到 npm，请先安装 Node.js"
  ( cd web && npm install ) || die "❌ npm install 失败"
fi

# ---- 3. 构建 ----
say "▶ 构建 web/ ..."
command -v npm >/dev/null 2>&1 || die "❌ 找不到 npm，请先安装 Node.js"
( cd web && npm run build ) || die "❌ 构建失败"

# ---- 4. 启动（restart = 先停旧的再起新的，可反复执行）----
say "▶ 启动服务 ..."
PORT="$PORT" BIND="$BIND" sh "$ROOT/scripts/serve.sh" restart || exit 1

# ---- 5. 打印访问地址 ----
PUB="$(curl -s --max-time 4 ifconfig.me 2>/dev/null || true)"
[ -n "$PUB" ] || PUB="<本机公网IP>"

say ""
say "  本机访问 : http://127.0.0.1:$PORT/"
[ "$BIND" = "0.0.0.0" ] && say "  外网访问 : http://$PUB:$PORT/"
say "  首屏深链 : http://127.0.0.1:$PORT/#/power"
say ""
say "  常用命令 : sh run.sh stop | status | log"
say "  本地自测 : sh test.sh   （8001 端口，测完自动停）"
say "=========================================================="
