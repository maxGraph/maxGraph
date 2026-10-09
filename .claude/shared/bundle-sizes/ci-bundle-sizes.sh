#!/usr/bin/env bash
#
# Copyright 2026-present The maxGraph project Contributors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

set -euo pipefail
export LC_ALL=C

# Reads the bundle sizes of the examples from the CI logs, used by the prepare-release and pr-bundle-size skills.
# Run with "--help" for the list of commands. Requires gh, git and jq.

REPO="maxGraph/maxGraph"
WORKFLOW="build.yml"
EXAMPLES_JOB="build_examples (ubuntu-24.04) / build"
# Bundlers and minifiers whose version changes the sizes on their own
TOOLCHAIN_PACKAGES_REGEX='(^|/)node_modules/(webpack|terser-webpack-plugin|terser|vite|rolldown|esbuild|lightningcss)$'

usage() {
  cat <<EOF
Usage: $0 <command> [arguments]

Commands:
  csv <run> [<repo> [<job>]]  Print the CSV of bundle sizes of a run: the header line, then the values line.
                              Defaults: $REPO, "$EXAMPLES_JOB".
  pr-run <pr>                 Print "<run> <status> <conclusion>" of the latest $WORKFLOW run on the head of the pull
                              request. Print nothing when there is none.
  pr-base <run>               Print "<merge sha> <base sha>" of a pull_request run: the commit it built
                              (refs/pull/<N>/merge) and the first parent of that commit, the main commit it compared to.
  main-run <sha>              Print "<run> <run sha>" of the latest successful push run of main on <sha> or on one of its
                              ancestors. Fail when the commits in between change a file that triggers $WORKFLOW.
  relevant-files <from> <to>  Print the files changed between two commits that trigger $WORKFLOW.
  toolchain <from> <to>       Print the bundlers, minifiers and Node versions that differ between two commits, as
                              "<package-lock key> <from version> -> <to version>".
  table <label> <from csv> <to csv>
                              Print the markdown table comparing two CSV files written by the csv command. <label> is the
                              header of the reference column, for instance "main 173688fcd".
EOF
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

job_log() {
  local run="$1" repo="$2" job_name="$3" job
  job=$(gh run view "$run" -R "$repo" --json jobs -q ".jobs[] | select(.name==\"$job_name\") | .databaseId")
  [[ -n "$job" ]] || fail "no job '$job_name' in run $run"
  # Log lines are "<job>\t<step>\t<timestamp> <content>", keep the content
  gh run view "$run" -R "$repo" --job "$job" --log | sed -E 's/^[^\t]*\t[^\t]*\t[0-9TZ:.-]+ //'
}

cmd_csv() {
  local run="$1" repo="${2:-$REPO}" job_name="${3:-$EXAMPLES_JOB}" csv
  csv=$(job_log "$run" "$repo" "$job_name" | grep -A4 'CSV of bundle sizes' | grep -v -e '^#' -e '^CSV of' -e '^[[:space:]]*$' | head -2)
  [[ $(wc -l <<<"$csv") -eq 2 ]] || fail "no CSV of bundle sizes in run $run, check that the job ran the examples build"
  echo "$csv"
}

cmd_pr_run() {
  local pr="$1" head_sha
  head_sha=$(gh pr view "$pr" -R "$REPO" --json headRefOid -q .headRefOid)
  gh run list -R "$REPO" --workflow "$WORKFLOW" --commit "$head_sha" --limit 20 \
    --json databaseId,event,status,conclusion \
    -q '[.[] | select(.event=="pull_request")][0] // empty | "\(.databaseId) \(.status) \(.conclusion)"'
}

cmd_pr_base() {
  local run="$1" log merge_sha base_sha
  log=$(job_log "$run" "$REPO" "$EXAMPLES_JOB")
  # The checkout step prints "+<merge sha>:refs/remotes/pull/<N>/merge" then "HEAD is now at <short> Merge <head> into <base>"
  merge_sha=$(grep -oE '\+[0-9a-f]{40}:refs/remotes/pull/[0-9]+/merge' <<<"$log" | head -1 | cut -c2-41)
  base_sha=$(grep -oE 'HEAD is now at [0-9a-f]+ Merge [0-9a-f]{40} into [0-9a-f]{40}' <<<"$log" | head -1 | awk '{print $NF}')
  [[ -n "$merge_sha" && -n "$base_sha" ]] || fail "run $run did not build a pull request merge commit"
  echo "$merge_sha $base_sha"
}

cmd_relevant_files() {
  local from="$1" to="$2"
  # Mirrors the "paths" filter of .github/workflows/build.yml, keep both in sync
  git diff --name-only "$from" "$to" |
    grep -E '^(\.github/actions/build-setup/|\.github/workflows/build\.yml$|\.eslint[^/]*$|\.nvmrc$|packages/|scripts/build-all-examples\.bash$|package\.json$|package-lock\.json$|tsconfig\.json$)' |
    grep -v -E '^packages/(website/|.*\.md$)' || true
}

cmd_main_run() {
  local sha="$1" runs run run_sha files
  git cat-file -e "$sha^{commit}" 2>/dev/null || fail "commit $sha is not available locally, run 'git fetch origin main' first"
  # Filter on headBranch with jq: '--branch main' returns old runs whose logs have expired
  runs=$(gh run list -R "$REPO" --workflow "$WORKFLOW" --event push --limit 100 --json databaseId,headBranch,headSha,conclusion \
    -q '.[] | select(.headBranch=="main" and .conclusion=="success") | "\(.databaseId) \(.headSha)"')
  while read -r run run_sha; do
    [[ -n "$run" ]] || continue
    git cat-file -e "$run_sha^{commit}" 2>/dev/null || continue
    if git merge-base --is-ancestor "$run_sha" "$sha"; then
      files=$(cmd_relevant_files "$run_sha" "$sha")
      if [[ -n "$files" ]]; then
        echo "The latest successful run of main before $sha is $run on $run_sha, but these files changed in between:" >&2
        echo "$files" >&2
        fail "the sizes of run $run are not valid for $sha"
      fi
      echo "$run $run_sha"
      return 0
    fi
  done <<<"$runs"
  fail "no successful push run of main found on $sha or its ancestors in the latest 100 runs"
}

toolchain_versions() {
  local sha="$1"
  gh api -H 'Accept: application/vnd.github.raw' "repos/$REPO/contents/package-lock.json?ref=$sha" |
    jq -r --arg regex "$TOOLCHAIN_PACKAGES_REGEX" '.packages | to_entries[] | select(.key | test($regex)) | "\(.key) \(.value.version)"'
  echo ".nvmrc $(gh api -H 'Accept: application/vnd.github.raw' "repos/$REPO/contents/.nvmrc?ref=$sha" | tr -d '[:space:]')"
}

cmd_toolchain() {
  local from="$1" to="$2"
  join -a1 -a2 -e none -o 0,1.2,2.2 <(toolchain_versions "$from" | sort) <(toolchain_versions "$to" | sort) |
    awk '$2 != $3 { print $1, $2, "->", $3 }'
}

cmd_table() {
  local label="$1" from_csv="$2" to_csv="$3"
  awk -F, -v label="$label" '
    FNR == 1 { for (i = 1; i <= NF; i++) names[FILENAME, i] = $i; columns[FILENAME] = NF; next }
    FNR == 2 { for (i = 1; i <= NF; i++) sizes[FILENAME, names[FILENAME, i]] = $i }
    function is_size(value) { return value ~ /^[0-9]+(\.[0-9]+)?$/ }
    END {
      print "| Example | " label " | PR | Δ kB | Δ % |"
      print "|---|---:|---:|---:|---:|"
      for (i = 1; i <= columns[ARGV[2]]; i++) {
        name = names[ARGV[2], i]
        from = (ARGV[1], name) in sizes ? sizes[ARGV[1], name] : "N/A"
        to = sizes[ARGV[2], name]
        if (is_size(from) && is_size(to)) {
          delta = to - from
          printf "| %s | %s | %s | %+.2f | %+.2f %% |\n", name, from, to, delta, from == 0 ? 0 : 100 * delta / from
        } else {
          printf "| %s | %s | %s | N/A | N/A |\n", name, from, to
        }
      }
      for (key in sizes) {
        split(key, parts, SUBSEP)
        if (parts[1] == ARGV[1] && !((ARGV[2], parts[2]) in sizes)) printf "| %s | %s | N/A | N/A | N/A |\n", parts[2], sizes[key]
      }
    }' "$from_csv" "$to_csv"
}

command="${1:-}"
[[ $# -gt 0 ]] && shift
case "$command" in
  csv) [[ $# -ge 1 ]] || fail "usage: csv <run> [<repo> [<job>]]"; cmd_csv "$@" ;;
  pr-run) [[ $# -eq 1 ]] || fail "usage: pr-run <pr>"; cmd_pr_run "$@" ;;
  pr-base) [[ $# -eq 1 ]] || fail "usage: pr-base <run>"; cmd_pr_base "$@" ;;
  main-run) [[ $# -eq 1 ]] || fail "usage: main-run <sha>"; cmd_main_run "$@" ;;
  relevant-files) [[ $# -eq 2 ]] || fail "usage: relevant-files <from> <to>"; cmd_relevant_files "$@" ;;
  toolchain) [[ $# -eq 2 ]] || fail "usage: toolchain <from> <to>"; cmd_toolchain "$@" ;;
  table) [[ $# -eq 3 ]] || fail "usage: table <label> <from csv> <to csv>"; cmd_table "$@" ;;
  --help | -h | "") usage ;;
  *) usage >&2; fail "unknown command '$command'" ;;
esac
