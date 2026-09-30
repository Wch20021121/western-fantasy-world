#!/bin/sh
# ============================================================================
# run.sh —— 一个命令起站
#
#   sh run.sh -p 8000            # 【默认】起全文站 site/（秒起，不构建、不装依赖）
#   sh run.sh -p 8000 -f         # 端口被占就直接杀掉再起（默认只提示、不杀）
#   sh run.sh -p 8000 --web      # 起 Vue 交互站 web/dist（首跑自动装依赖并构建）
#   sh run.sh -p 8000 -d 目录     # 起任意静态目录（例：-d web/dist）
#   sh run.sh stop  -p 8000      # 停止（pid 文件丢了也能按端口停）
#   sh run.sh status -p 8000     # 查看状态
#   sh run.sh log                # 查看最近访问日志
#   sh run.sh -h                 # 本帮助
#
#   PORT=9000 sh run.sh          # 旧写法仍支持（等价 -p 9000）
#   AUTO_PULL=1 sh run.sh        # 启动前自动 git pull
#
# 典型流程：  git pull && sh run.sh -p 8000
#
# ⚠️ 本文件用 POSIX sh 写成（Ubuntu 上 `sh` = dash），不要用 bash 特性。
# ============================================================================
set -u

# ---------------- 配置区：想改默认端口就改这一行 ----------------
PORT="${PORT:-8000}"          # 服务端口（临时覆盖：-p 9000 或 PORT=9000）
BIND="${BIND:-0.0.0.0}"       # 0.0.0.0 = 外网可访问；127.0.0.1 = 仅本机
AUTO_PULL="${AUTO_PULL:-0}"   # 1 = 启动前自动 git pull
# -------------------------------------------------------------

usage() {
  cat <<'EOF'
用法：
  sh run.sh -p <端口>            起全文站 site/（默认目录；端口默认 8000）
  sh run.sh -p <端口> -f         强制：端口被占就直接杀掉占用者再起
                                  （默认不杀，只提示谁占着、该怎么办）
  sh run.sh -p <端口> --web      起 Vue 交互站 web/dist（首跑自动装依赖并构建）
  sh run.sh -p <端口> -d <目录>   起任意静态目录
  sh run.sh stop  -p <端口>      停止（pid 文件缺失也能按端口停；只会停本项目的服务）
  sh run.sh status -p <端口>     查看状态
  sh run.sh log    -p <端口>     查看该端口的访问日志
  sh run.sh -h                   本帮助
一键启动：  sh run.sh -p 8000 -f
兼容写法：PORT=9000 sh run.sh   等价于   sh run.sh -p 9000
EOF
}

DIR="site"
DO_WEB=0
CMD="start"
FORCE="${FORCE:-0}"          # 1 = 端口被占直接杀（-f 传入）

while [ $# -gt 0 ]; do
  case "$1" in
    -p|--port) [ $# -ge 2 ] || { echo "❌ -p 需要端口号" >&2; exit 1; }; PORT="$2"; shift 2 ;;
    --port=*)  PORT="${1#*=}"; shift ;;
    -d|--dir)  [ $# -ge 2 ] || { echo "❌ -d 需要目录" >&2; exit 1; }; DIR="$2"; shift 2 ;;
    -f|--force) FORCE=1; shift ;;
    --web)     DO_WEB=1; DIR="web/dist"; shift ;;
    .|./)      shift ;;                 # 你写 -f . 时的点号：忽略
    stop|status|log|restart) CMD="$1"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "❌ 未知参数：$1（sh run.sh -h 看用法）" >&2; exit 1 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT" || exit 1

say() { printf '%s\n' "$*"; }
die() { printf '%s\n' "$*" >&2; exit 1; }

# ---- 运维子命令：不需要构建，直接转给 serve.sh ----
case "$CMD" in
  stop|status|log)
    PORT="$PORT" BIND="$BIND" FORCE="$FORCE" sh "$ROOT/scripts/serve.sh" "$CMD"
    exit $?
    ;;
esac

say "=========================================================="
say "  埃拉西亚大陆 · 一键挂载   端口 $PORT   目录 $DIR"
say "=========================================================="

# ---- 1. 可选：拉代码 ----
if [ "$AUTO_PULL" = "1" ]; then
  say "▶ git pull ..."
  git pull --ff-only || say "⚠️  git pull 失败（可能没配推送凭据），继续用本地代码启动"
fi

# ---- 2. 目标：--web 才需要构建；site/ 是纯静态、免构建 ----
if [ "$DO_WEB" = "1" ]; then
  if [ ! -d web/node_modules ]; then
    say "▶ 首次运行，安装 npm 依赖（约 1~5 分钟，只此一次）..."
    command -v npm >/dev/null 2>&1 || die "❌ 找不到 npm，请先安装 Node.js"
    ( cd web && npm install ) || die "❌ npm install 失败"
  fi
  say "▶ 构建 web/ ..."
  command -v npm >/dev/null 2>&1 || die "❌ 找不到 npm，请先安装 Node.js"
  ( cd web && npm run build ) || die "❌ 构建失败"
else
  [ -d "$ROOT/$DIR" ] || die "❌ 目录不存在：$ROOT/$DIR"
fi

# ---- 3. 启动（restart = 先停旧的再起新的，可反复执行）----
say "▶ 启动服务 ..."
PORT="$PORT" BIND="$BIND" FORCE="$FORCE" sh "$ROOT/scripts/serve.sh" restart "$DIR" || exit 1

# ---- 4. 打印访问地址 ----
PUB="$(curl -s --max-time 4 ifconfig.me 2>/dev/null || true)"
[ -n "$PUB" ] || PUB="<本机公网IP>"

say ""
say "  本机访问 : http://127.0.0.1:$PORT/"
[ "$BIND" = "0.0.0.0" ] && say "  外网访问 : http://$PUB:$PORT/"
if [ "$DO_WEB" = "1" ]; then
  say "  首屏深链 : http://127.0.0.1:$PORT/#/power"
else
  say "  首页导读 : http://127.0.0.1:$PORT/index.html"
  say "  大陆地图 : http://127.0.0.1:$PORT/map.html"
  say "  （要 Vue 交互站：sh run.sh -p $PORT --web）"
fi
say ""
say "  常用命令 : sh run.sh stop -p $PORT | status -p $PORT | log -p $PORT"
say "  本地自测 : sh test.sh   （8001 端口，测完自动停）"
say "=========================================================="
