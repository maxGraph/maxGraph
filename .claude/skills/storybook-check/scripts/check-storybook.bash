#!/usr/bin/env bash
# Checks that every story of packages/html renders in dev mode (storybook dev) and in prod mode (storybook build served
# statically). Logs go to the work directory, the console only gets the summary of each mode.
# Usage: check-storybook.bash [dev|prod|all] [--skip-build]
# Environment:
#   STORYBOOK_CHECK_DIR  work directory holding playwright-core and the logs, outside the repository
#   CHROMIUM_PATH        Chromium executable, defaults to the most recent one cached by Playwright
set -uo pipefail

mode=all
skip_build=false
for argument in "$@"; do
  case "$argument" in
    dev | prod | all) mode=$argument ;;
    --skip-build) skip_build=true ;;
    *) echo "Unknown argument: $argument" >&2; exit 2 ;;
  esac
done

repo_root=$(git rev-parse --show-toplevel)
skill_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
work_dir=${STORYBOOK_CHECK_DIR:-${TMPDIR:-/tmp}/maxgraph-storybook-check}
dev_port=8901
prod_port=8902
mkdir -p "$work_dir"

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && (cd "$repo_root" && nvm use >/dev/null)

chromium_path=${CHROMIUM_PATH:-$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null | sort -V | tail -1)}
if [ ! -x "$chromium_path" ]; then
  echo "No Chromium found. Set CHROMIUM_PATH, or run: npx playwright-core install chromium" >&2
  exit 2
fi

# playwright-core lives outside the repository, so that the IDE does not index it and the lock file stays untouched
if [ ! -d "$work_dir/node_modules/playwright-core" ]; then
  (cd "$work_dir" && npm init -y >/dev/null && npm install playwright-core >"$work_dir/playwright-install.log" 2>&1) || {
    echo "playwright-core install failed, see $work_dir/playwright-install.log" >&2
    exit 2
  }
fi
# Node resolves the imports of an ES module from its own location, so the script runs from the work directory
cp "$skill_dir/check-stories.mjs" "$work_dir/"

server_pid=
stop_server() {
  [ -n "$server_pid" ] && kill "$server_pid" 2>/dev/null && wait "$server_pid" 2>/dev/null
  server_pid=
}
trap stop_server EXIT

wait_for_server() {
  local url=$1
  for _ in $(seq 1 120); do
    curl -sf -o /dev/null "$url" && return 0
    sleep 1
  done
  return 1
}

failures=0
run_mode() {
  local name=$1 port=$2 log=$3
  shift 3
  echo "== $name mode"
  (cd "$repo_root/packages/html" && exec "$@") >"$log" 2>&1 &
  server_pid=$!
  if ! wait_for_server "http://localhost:$port/index.json"; then
    echo "server did not start on port $port, see $log"
    failures=$((failures + 1))
    stop_server
    return
  fi
  node "$work_dir/check-stories.mjs" "http://localhost:$port" "$chromium_path" || failures=$((failures + 1))
  stop_server
  local server_problems
  server_problems=$(grep -iE '\b(error|warn(ing)?)\b' "$log")
  [ -n "$server_problems" ] && echo "server log ($log):" && echo "$server_problems" | sed 's/^/  /'
}

storybook_bin="$repo_root/node_modules/.bin/storybook"
vite_bin="$repo_root/node_modules/.bin/vite"

if [ "$skip_build" = false ]; then
  echo "== build core"
  (cd "$repo_root" && npm run build -w packages/core) >"$work_dir/core-build.log" 2>&1 || {
    echo "core build failed, see $work_dir/core-build.log"
    exit 1
  }
fi

if [ "$mode" != prod ]; then
  run_mode dev "$dev_port" "$work_dir/dev-server.log" "$storybook_bin" dev -p "$dev_port" --ci --no-open
fi

if [ "$mode" != dev ]; then
  if [ "$skip_build" = false ]; then
    echo "== build storybook"
    (cd "$repo_root" && npm run build -w packages/html) >"$work_dir/storybook-build.log" 2>&1 || {
      echo "storybook build failed, see $work_dir/storybook-build.log"
      exit 1
    }
    grep -iE '\b(error|warn(ing)?)\b' "$work_dir/storybook-build.log" | sed 's/^/  build log: /'
  fi
  run_mode prod "$prod_port" "$work_dir/prod-server.log" "$vite_bin" preview --config "$skill_dir/vite-preview.config.mjs" --outDir dist --port "$prod_port" --strictPort
fi

echo "== result: $([ "$failures" -eq 0 ] && echo PASS || echo "FAIL ($failures mode(s))")"
[ "$failures" -eq 0 ]
