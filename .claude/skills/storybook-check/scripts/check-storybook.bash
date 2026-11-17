#!/usr/bin/env bash
# Checks that every story of packages/html renders in dev mode (storybook dev) and in prod mode (storybook build served
# statically). Logs go to the work directory, the console only gets the summary of each mode.
# Usage: check-storybook.bash [dev|prod|all] [--skip-build]
# Environment:
#   STORYBOOK_CHECK_DIR  work directory holding playwright-core and the logs, outside the repository
#   CHROMIUM_PATH        browser executable to use instead of the local Google Chrome
#   STORYBOOK_CHECK_DEV_PORT, STORYBOOK_CHECK_PROD_PORT  ports of the servers, 8901 and 8902 by default
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
# A per-user default: a predictable directory under /tmp could be prepared by another user with their own modules
work_dir=${STORYBOOK_CHECK_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/maxgraph-storybook-check}
playwright_version=1.65.1
dev_port=${STORYBOOK_CHECK_DEV_PORT:-8901}
prod_port=${STORYBOOK_CHECK_PROD_PORT:-8902}
mkdir -p "$work_dir" || exit 2
[[ -z "${STORYBOOK_CHECK_DIR:-}" ]] && chmod 700 "$work_dir"
# Resolved before leaving the caller's directory, which a relative STORYBOOK_CHECK_DIR refers to
work_dir=$(cd "$work_dir" && pwd)
cd "$repo_root" || exit 2

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use >/dev/null || { echo "nvm cannot use the Node version of .nvmrc" >&2; exit 2; }
fi
command -v node >/dev/null || { echo "node not found, install the Node version of .nvmrc" >&2; exit 2; }

# playwright-core lives outside the repository, so that the IDE does not index it and the lock file stays untouched
installed_version=$(node -p 'require(process.argv[1]).version' "$work_dir/node_modules/playwright-core/package.json" 2>/dev/null)
if [[ "$installed_version" != "$playwright_version" ]]; then
  (
    cd "$work_dir" &&
      { [[ -f package.json ]] || npm init -y >/dev/null; } &&
      npm install --ignore-scripts --no-audit --no-fund "playwright-core@$playwright_version"
  ) >"$work_dir/playwright-install.log" 2>&1 || {
    echo "playwright-core install failed, see $work_dir/playwright-install.log" >&2
    exit 2
  }
fi
# Node resolves the imports of an ES module from its own location, so the script runs from the work directory
cp "$skill_dir/check-stories.mjs" "$work_dir/"

server_pid=
stop_server() {
  [[ -n "$server_pid" ]] && kill "$server_pid" 2>/dev/null && wait "$server_pid" 2>/dev/null
  server_pid=
}
trap stop_server EXIT

wait_for_server() {
  local url=$1
  for _ in $(seq 1 120); do
    kill -0 "$server_pid" 2>/dev/null || return 1
    curl -sf -o /dev/null --connect-timeout 2 --max-time 5 "$url" && return 0
    sleep 1
  done
  return 1
}

report_log_problems() {
  local label=$1 log=$2
  local problems
  problems=$(grep -iE '\b(error|warn(ing)?)\b' "$log")
  [[ -n "$problems" ]] && echo "$label log ($log):" && echo "$problems" | sed 's/^/  /'
}

failures=0
run_mode() {
  local name=$1 port=$2 log=$3
  shift 3
  echo "== $name mode"
  # Otherwise the check would run against whatever already listens there, such as a running npm run dev. Only a
  # refused connection (curl exit code 7) proves the port free: a listener that never answers times out instead.
  curl -s -o /dev/null --connect-timeout 2 --max-time 5 "http://localhost:$port/"
  if [[ $? -ne 7 ]]; then
    echo "port $port is already in use, stop the server listening on it"
    failures=$((failures + 1))
    return
  fi
  (cd "$repo_root/packages/html" && exec "$@") >"$log" 2>&1 &
  server_pid=$!
  if ! wait_for_server "http://localhost:$port/index.json"; then
    echo "server did not start on port $port, see $log"
    failures=$((failures + 1))
    stop_server
    return
  fi
  node "$work_dir/check-stories.mjs" "http://localhost:$port"
  local check_status=$?
  # The check could not run, for instance without a browser: the other mode would fail the same way
  [[ $check_status -eq 2 ]] && exit 2
  [[ $check_status -ne 0 ]] && failures=$((failures + 1))
  stop_server
  report_log_problems server "$log"
}

storybook_bin="$repo_root/node_modules/.bin/storybook"
vite_bin="$repo_root/node_modules/.bin/vite"

if [[ "$skip_build" == false ]]; then
  echo "== build core"
  npm run build -w packages/core >"$work_dir/core-build.log" 2>&1 || {
    echo "core build failed, see $work_dir/core-build.log"
    exit 1
  }
  report_log_problems "core build" "$work_dir/core-build.log"
fi

if [[ "$mode" != prod ]]; then
  run_mode dev "$dev_port" "$work_dir/dev-server.log" \
    "$storybook_bin" dev --port "$dev_port" --exact-port --ci --no-open
fi

if [[ "$mode" != dev ]]; then
  if [[ "$skip_build" == false ]]; then
    echo "== build storybook"
    npm run build -w packages/html >"$work_dir/storybook-build.log" 2>&1 || {
      echo "storybook build failed, see $work_dir/storybook-build.log"
      exit 1
    }
    report_log_problems "storybook build" "$work_dir/storybook-build.log"
  fi
  run_mode prod "$prod_port" "$work_dir/prod-server.log" \
    "$vite_bin" preview --config "$skill_dir/vite-preview.config.mjs" --outDir dist --port "$prod_port" --strictPort
fi

echo "== result: $([[ "$failures" -eq 0 ]] && echo PASS || echo "FAIL ($failures mode(s))")"
[[ "$failures" -eq 0 ]]
