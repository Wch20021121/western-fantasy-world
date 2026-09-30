#!/usr/bin/env bash
# 静态站点服务管理 —— 长期工具，按 AGENT.md 规矩放在 scripts/ 中，勿删。
#
# 用法：
#   scripts/serve.sh build            构建 Vue 工程（web/ → web/dist/）
#   scripts/serve.sh start [目录]     启动（默认 web/dist → 0.0.0.0:8000）
#   scripts/serve.sh stop             停止
#   scripts/serve.sh restart [目录]   重启
#   scripts/serve.sh rebuild          build + restart（改完内容发布用这个）
#   scripts/serve.sh status           看是否在跑
#   scripts/serve.sh log              看最近 30 行访问日志
#
# 开发热更新（不走本脚本）： cd web && npm run dev   ← 同样占 8000，二者不可同时跑
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# 端口与绑定地址可用环境变量覆盖（run.sh 就是这么改端口的）
PORT="${PORT:-8000}"
BIND="${BIND:-0.0.0.0}"
DIR="${2:-web/dist}"
FORCE="${FORCE:-0}"          # 1 = 端口被占就直接杀（run.sh -f 传进来）
# pid 与日志**按端口分文件**：不同端口可同时跑、互不干扰
PIDFILE="$ROOT/temp/serve-$PORT.pid"
LOG="$ROOT/temp/serve-$PORT.log"

mkdir -p "$ROOT/temp"

running() {
  [ -f "$PIDFILE" ] || return 1
  local pid
  pid="$(cat "$PIDFILE" 2>/dev/null)"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# 占用 $PORT 的进程：输出 "pid|命令行"（找不到则返回非 0）
# 用途：① 启动前预检，避免 Address already in use 报错看得人发慌
#       ② stop 时 pid 文件丢了也能按端口停
port_user() {
  local pids pid cmd
  pids="$(ss -tlnp 2>/dev/null | grep -F ":$PORT " | sed -n 's/.*pid=\([0-9]\{1,\}\).*/\1/p' | sort -u)"
  if [ -z "$pids" ] && command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null)"
  fi
  [ -n "$pids" ] || return 1
  for pid in $pids; do
    cmd="$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null || true)"
    [ -n "$cmd" ] || cmd="(pid $pid)"
    printf '%s|%s\n' "$pid" "$cmd"
    return 0
  done
  return 1
}

case "${1:-}" in
  build)
    if [ ! -d "$ROOT/web/node_modules" ]; then
      echo "▶ 安装 npm 依赖（首次）..."
      ( cd "$ROOT/web" && npm install ) || { echo "❌ npm install 失败"; exit 1; }
    fi
    echo "▶ 构建 Vue 工程…"
    ( cd "$ROOT/web" && npm run build ) || { echo "❌ 构建失败"; exit 1; }
    echo "✅ 构建完成 → $ROOT/web/dist"
    ;;
  start)
    if running; then
      echo "⚠️  已在运行 (PID $(cat "$PIDFILE"))，如需换目录请先 stop 或 restart"
      exit 0
    fi
    # 端口预检：别让 Address already in use 的堆栈吓到人
    local_occ=""
    if local_occ="$(port_user)"; then
      opid="${local_occ%%|*}"; ocmd="${local_occ#*|}"
      if [ "$FORCE" = "1" ]; then
        echo "▶ -f：清掉占用端口 $PORT 的进程 → PID $opid"
        echo "   $ocmd"
        kill "$opid" 2>/dev/null || true
        t=0
        while port_user >/dev/null 2>&1 && [ "$t" -lt 5 ]; do sleep 1; t=$((t+1)); done
        if port_user >/dev/null 2>&1; then kill -9 "$opid" 2>/dev/null || true; sleep 1; fi
        if port_user >/dev/null 2>&1; then
          echo "❌ 杀不掉，端口仍被占用"
          exit 1
        fi
        echo "✅ 端口 $PORT 已清场"
      else
        echo "❌ 端口 $PORT 已被占用 → PID $opid"
        echo "   $ocmd"
        case "$ocmd" in
          *serve.py*) echo "   是本项目的静态服务 → sh run.sh stop -p $PORT（或加 -f 强制接管）" ;;
          *)          echo "   不是本项目的进程 → 加 -f 直接杀：sh run.sh -p $PORT -f （或换个端口）" ;;
        esac
        exit 1
      fi
    fi
    if [ ! -d "$ROOT/$DIR" ]; then
      echo "❌ 目录不存在：$ROOT/$DIR"
      echo "   先执行：scripts/serve.sh build"
      exit 1
    fi
    nohup python3 "$ROOT/scripts/serve.py" --port "$PORT" --bind "$BIND" --dir "$DIR" \
      >> "$LOG" 2>&1 &
    echo $! > "$PIDFILE"
    sleep 1
    if running; then
      echo "✅ 已启动  PID $(cat "$PIDFILE")  端口 $PORT  目录 $DIR"
      echo "   本机访问 : http://127.0.0.1:$PORT/"
      echo "   外部访问 : http://$(curl -s --max-time 3 ifconfig.me 2>/dev/null || echo '<公网IP>'):$PORT/"
      echo "   日志     : $LOG"
    else
      echo "❌ 启动失败，看日志：$LOG"
      tail -20 "$LOG"
      exit 1
    fi
    ;;
  stop)
    stopped=0
    if running; then
      kill "$(cat "$PIDFILE")" 2>/dev/null || true
      rm -f "$PIDFILE"
      echo "✅ 已停止（按 pid 文件）"
      stopped=1
      sleep 1
    fi
    # pid 文件丢了也行：按端口找（只杀本项目的 serve.py）
    local_occ=""
    if local_occ="$(port_user)"; then
      opid="${local_occ%%|*}"; ocmd="${local_occ#*|}"
      case "$ocmd" in
        *serve.py*)
          if kill "$opid" 2>/dev/null; then
            echo "✅ 已停止（按端口找到 PID $opid）"
            stopped=1
            sleep 1
          fi
          ;;
        *)
          [ "$stopped" = "1" ] || echo "⚠️  端口 $PORT 被其他程序占用（PID $opid）：$ocmd"
          ;;
      esac
    fi
    [ "$stopped" = "1" ] || { echo "（未在运行）"; rm -f "$PIDFILE"; }
    ;;
  restart)
    "$0" stop
    sleep 1
    "$0" start "${2:-web/dist}"
    ;;
  rebuild)
    "$0" stop
    sleep 1
    "$0" build
    "$0" start "${2:-web/dist}"
    ;;
  status)
    if running; then
      echo "✅ 运行中  PID $(cat "$PIDFILE")  端口 $PORT"
      ss -tlnp 2>/dev/null | grep ":$PORT" || true
    else
      local_occ=""
      if local_occ="$(port_user)"; then
        echo "⚠️  pid 文件未运行，但端口 $PORT 上有进程："
        echo "   ${local_occ%%|*}  ${local_occ#*|}"
        exit 1
      fi
      echo "⭕ 未运行"
      exit 1
    fi
    ;;
  log)
    tail -n "${2:-30}" "$LOG"
    ;;
  *)
    echo "用法: $0 {build|start|stop|restart|rebuild|status|log} [目录]"
    exit 1
    ;;
esac
