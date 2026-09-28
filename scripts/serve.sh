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
PORT=8000
DIR="${2:-web/dist}"
LOG="$ROOT/temp/serve.log"
PIDFILE="$ROOT/temp/serve.pid"

mkdir -p "$ROOT/temp"

running() {
  [ -f "$PIDFILE" ] || return 1
  local pid
  pid="$(cat "$PIDFILE" 2>/dev/null)"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

case "${1:-}" in
  build)
    echo "▶ 构建 Vue 工程…"
    ( cd "$ROOT/web" && npm run build ) || { echo "❌ 构建失败"; exit 1; }
    echo "✅ 构建完成 → $ROOT/web/dist"
    ;;
  start)
    if running; then
      echo "⚠️  已在运行 (PID $(cat "$PIDFILE"))，如需换目录请先 stop 或 restart"
      exit 0
    fi
    if [ ! -d "$ROOT/$DIR" ]; then
      echo "❌ 目录不存在：$ROOT/$DIR"
      echo "   先执行：scripts/serve.sh build"
      exit 1
    fi
    nohup python3 "$ROOT/scripts/serve.py" --port "$PORT" --dir "$DIR" \
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
    if running; then
      kill "$(cat "$PIDFILE")" 2>/dev/null
      rm -f "$PIDFILE"
      echo "✅ 已停止"
    else
      echo "（未在运行）"
      rm -f "$PIDFILE"
    fi
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
