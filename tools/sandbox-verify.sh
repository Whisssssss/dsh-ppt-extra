#!/usr/bin/env bash
# 在 dsh-sandbox 隔离实例中验证 dsh-ppt（含模板导入）。
# 用法：REUSE=1 bash tools/sandbox-verify.sh [sandbox-home] [port]
# 前置：D:/DSH/Tools/dsh-sandbox 存在；本仓库已 pnpm install 且 pnpm build。
set -euo pipefail
WS="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="/d/DSH/Tools/dsh-sandbox"
HOME_DIR="${1:-/c/Users/wzxle/AppData/Local/Temp/dsh-sandbox-ppt}"
PORT="${2:-3099}"
PLUGIN="$HOME_DIR/profiles/web/node_modules/dsh-ppt"
LOG="$HOME_DIR/../dsh-sandbox-ppt.log"
REUSE="${REUSE:-0}"

if [ "$REUSE" = "1" ] && [ -d "$HOME_DIR/profiles/web" ]; then
  echo "== 1/6 复用已有隔离 home：$HOME_DIR"
else
  echo "== 1/6 创建隔离 home：$HOME_DIR"
  bash "$TOOLS/create-home.sh" "$HOME_DIR"
fi

echo "== 2/6 用工作区代码替换 dsh-ppt"
rm -rf "$PLUGIN"
mkdir -p "$PLUGIN"
for item in package.json lib skills docs cordis.patch.yml README.md README.en.md CHANGELOG.md LICENSE; do
  [ -e "$WS/$item" ] && cp -a "$WS/$item" "$PLUGIN/"
done

echo "== 2.5/6 在隔离 profile 中启用 dsh-ppt bundle"
node "$WS/tools/sandbox-enable.mjs" "$HOME_DIR/profiles/web/package.json"

echo "== 3/6 确保运行时依赖可解析（jpeg-js）"
if [ ! -d "$HOME_DIR/profiles/web/node_modules/jpeg-js" ]; then
  (cd "$HOME_DIR/profiles/web" && pnpm add jpeg-js@0.4.4 --ignore-scripts >/dev/null 2>&1) || echo "warn: pnpm add jpeg-js 失败"
fi

echo "== 4/6 启动隔离实例 :$PORT"
for pid in $(netstat -ano 2>/dev/null | grep ":$PORT " | grep LISTENING | awk '{print $5}' | sort -u); do
  echo "warn: 端口 $PORT 被 PID $pid 占用，结束它"
  taskkill //F //T //PID "$pid" >/dev/null 2>&1 || true
done
: > "$LOG"
bash "$TOOLS/start.sh" "$HOME_DIR" "$PORT" >"$LOG" 2>&1 &
SERVER_PID=$!
cleanup() {
  echo "== 清理：停止隔离实例"
  taskkill //F //T //PID "$SERVER_PID" >/dev/null 2>&1 || true
  for pid in $(netstat -ano 2>/dev/null | grep ":$PORT " | grep LISTENING | awk '{print $5}' | sort -u); do
    taskkill //F //T //PID "$pid" >/dev/null 2>&1 || true
  done
}
trap cleanup EXIT

echo "== 5/6 等待实例就绪并取得访问 token"
TOKEN=""
for i in $(seq 1 120); do
  TOKEN="$(grep -o 'token=[A-Za-z0-9_-]*' "$LOG" 2>/dev/null | head -1 | cut -d= -f2 || true)"
  if [ -n "$TOKEN" ] && curl -s -o /dev/null "http://127.0.0.1:$PORT/?token=$TOKEN" 2>/dev/null; then
    echo "就绪（${i}s）"; break
  fi
  sleep 1
  if [ "$i" = "120" ]; then echo "启动超时，日志：$LOG"; tail -40 "$LOG" || true; exit 1; fi
done
COOKIE="$(curl -s -i "http://127.0.0.1:$PORT/?token=$TOKEN" 2>/dev/null | grep -i '^set-cookie:' | sed 's/^[Ss]et-[Cc]ookie: //' | cut -d';' -f1 | head -1)"
echo "cookie: ${COOKIE:0:24}..."

echo "== 6/6 HTTP 功能验证"
DSH_HOME="$HOME_DIR" DSH_TOKEN="$TOKEN" DSH_COOKIE="$COOKIE" node "$WS/tools/sandbox-http.mjs" "http://127.0.0.1:$PORT" "$WS"
