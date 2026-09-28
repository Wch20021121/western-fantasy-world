#!/bin/sh
# ============================================================================
# test.sh —— 本地冒烟测试
#
#   sh test.sh                # 在 127.0.0.1:8001 起服务 → 跑一组检查 → 自动停
#   TEST_PORT=8002 sh test.sh # 换个端口测
#
# 只做「本地能不能跑起来」的验证，**只绑 127.0.0.1**，且**不碰正式服务**
#（正式服务在 8000，用的是另一个 pid 文件，互不干扰）。
#
# 检查项：
#   ① 构建产物存在
#   ② GET / 返回 200 且含挂载点 #app
#   ③ index.html 引用的每个 js/css 都能取到（200）
#   ④ 首屏只加载 1 个入口 JS（证明 11 个页面是按需分包的，没有全量塞进去）
#   ⑤ 首页内容确实进了产物
#   ⑥ hash 深链 /#/power 同样返回 200
# ============================================================================
set -u

PORT="${TEST_PORT:-8001}"
HOST="127.0.0.1"
BASE="http://$HOST:$PORT"
ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/web/dist"
PIDFILE="$ROOT/temp/test-$PORT.pid"
LOG="$ROOT/temp/test-$PORT.log"

PASS=0
FAIL=0
ok()   { PASS=$((PASS + 1)); printf '  ✅ %s\n' "$*"; }
bad()  { FAIL=$((FAIL + 1)); printf '  ❌ %s\n' "$*"; }
say()  { printf '%s\n' "$*"; }

cleanup() {
  if [ -f "$PIDFILE" ]; then
    kill "$(cat "$PIDFILE")" 2>/dev/null
    rm -f "$PIDFILE"
  fi
}
trap cleanup EXIT INT TERM

command -v curl >/dev/null 2>&1 || { echo "❌ 找不到 curl"; exit 1; }

# ---- 0. 构建 ----
if [ ! -d web/node_modules ]; then
  say "▶ 安装 npm 依赖（首次）..."
  ( cd web && npm install ) || { echo "❌ npm install 失败"; exit 1; }
fi
say "▶ 构建 ..."
( cd web && npm run build ) >"$LOG" 2>&1 || { echo "❌ 构建失败，见 $LOG"; exit 1; }

# ---- 1. 产物存在 ----
say ""
say "=========================================================="
say "  本地冒烟测试 · $BASE （仅本机）"
say "=========================================================="
if [ -f "$DIST/index.html" ]; then
  ok "① 构建产物存在 web/dist/index.html"
else
  bad "① 构建产物缺失"
  exit 1
fi

# ---- 2. 起测试服务（独立 pid 文件，不动正式服务）----
cleanup
mkdir -p "$ROOT/temp"
nohup python3 "$ROOT/scripts/serve.py" --port "$PORT" --bind 127.0.0.1 --dir web/dist \
  >>"$LOG" 2>&1 &
echo $! > "$PIDFILE"

# 等端口就绪（最多 10 秒）
i=0
while [ "$i" -lt 20 ]; do
  if curl -s --max-time 2 -o /dev/null "$BASE/"; then break; fi
  i=$((i + 1))
  sleep 0.5
done

# ---- 3. 首页 ----
BODY="$(curl -s --max-time 5 "$BASE/")"
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$BASE/")"
if [ "$CODE" = "200" ]; then ok "② GET / → HTTP 200"; else bad "② GET / → HTTP $CODE"; fi
case "$BODY" in
  *'id="app"'*) ok "② 页面含挂载点 #app（SPA 入口正确）" ;;
  *)             bad "② 页面缺 #app，可能构建产物不对" ;;
esac

# ---- 4. 被引用的资源全部可达 ----
REFS="$(printf '%s' "$BODY" | grep -oE '\./(assets/[^"]+)' | sed 's|^\./||' | sort -u)"
if [ -n "$REFS" ]; then
  allok=1
  for r in $REFS; do
    c="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$BASE/$r")"
    if [ "$c" != "200" ]; then bad "③ $r → HTTP $c"; allok=0; fi
  done
  [ "$allok" = "1" ] && ok "③ 入口引用的资源全部 200（$(printf '%s\n' "$REFS" | grep -c .) 个）"
else
  bad "③ 没在 index.html 里找到任何 assets 引用"
fi

# ---- 5. 分包验证 ----
JSN="$(find "$DIST/assets" -name '*.js' 2>/dev/null | wc -l | tr -d ' ')"
ENTRY="$(printf '%s' "$BODY" | grep -oE 'assets/index[^"]+\.js' | head -1)"
if [ -n "$ENTRY" ] && [ "$JSN" -gt 2 ]; then
  ok "④ 分包正常：入口 1 个 + 视图按需加载，共 $JSN 个 JS"
else
  bad "④ 分包异常（JS 总数=$JSN，入口=$ENTRY）"
fi

# ---- 6. 内容真的进了产物 ----
if grep -rq "埃拉西亚大陆" "$DIST/assets/"*.js 2>/dev/null; then
  ok "⑤ 首页内容已进产物（含「埃拉西亚大陆」）"
else
  bad "⑤ 产物里找不到正文，可能是内容没打包进去"
fi

# ---- 7. hash 深链 ----
C2="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$BASE/#/power")"
if [ "$C2" = "200" ]; then ok "⑥ 深链 /#/power → HTTP 200"; else bad "⑥ 深链 → HTTP $C2"; fi

# ---- 汇总 ----
say "----------------------------------------------------------"
if [ "$FAIL" -eq 0 ]; then
  say "  通过 $PASS · 失败 0      ✅ 本地可以运行"
else
  say "  通过 $PASS · 失败 $FAIL      ❌ 有问题（日志：$LOG）"
fi
say "=========================================================="
say "  测试服务已停止（正式服务不受影响；它用 8000 + 另一个 pid）"
exit "$FAIL"
