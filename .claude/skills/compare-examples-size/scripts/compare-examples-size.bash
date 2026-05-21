#!/usr/bin/env bash
set -euo pipefail

# Compare maxGraph example bundle sizes between two git references.
#
# Usage: compare-examples-size.bash <from-ref> <to-ref>
#   <from-ref> / <to-ref>: commit SHA, branch name, or tag.
#
# Output: a markdown table on stdout with per-example sizes for both refs and the delta.
# Build logs are printed to stderr so stdout stays clean.

usage() {
  echo "Usage: $0 <from-ref> <to-ref>" >&2
  echo "  Each ref can be a commit SHA, branch name, or tag." >&2
}

if [[ $# -ne 2 ]]; then
  usage
  exit 2
fi

FROM_RAW="$1"
TO_RAW="$2"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "Error: not inside a git repository." >&2
  exit 1
fi
cd "$REPO_ROOT"

# 1. Recovery lock check — must run FIRST. If a previous invocation was killed forcibly
# (SIGKILL bypasses the trap), the lock survives and points to the ref the user was on.
# Surface that before any other check so the recovery instructions are the first thing
# the user sees.
LOCK_FILE="$(git rev-parse --git-common-dir)/compare-examples-size.lock"
if [[ -f "$LOCK_FILE" ]]; then
  prev_ref=$(cat "$LOCK_FILE" 2>/dev/null || echo "<unknown>")
  echo "Error: a previous run did not clean up (lock file present)." >&2
  echo "It was started on ref: $prev_ref" >&2
  echo "If you are not on that ref now, run: git checkout $prev_ref" >&2
  echo "Then remove the lock: rm $LOCK_FILE" >&2
  exit 1
fi

# 2. Strict clean working tree (including untracked files in tracked dirs)
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit, stash, or discard changes before running." >&2
  git status --short >&2
  exit 1
fi

# 3. Resolve refs (verify they exist; capture commit SHA + label).
# The `^{commit}` peel forces dereferencing through annotated tags so we end up with the
# underlying commit SHA, not the tag object SHA. Without it, `git rev-parse --verify v0.23.0`
# returns the tag object's SHA, which is unfindable via `git log` and confuses readers of the
# output table.
resolve_ref() {
  local raw="$1"
  local sha
  if ! sha=$(git rev-parse --verify "$raw^{commit}" 2>/dev/null); then
    echo "Error: cannot resolve git ref '$raw' to a commit." >&2
    exit 1
  fi
  echo "$sha"
}

FROM_SHA=$(resolve_ref "$FROM_RAW")
TO_SHA=$(resolve_ref "$TO_RAW")

# Normalize order: older commit first (column 1), newer commit second (column 2),
# regardless of CLI argument order. "Older" is determined by committer timestamp,
# which works even when the two refs are not in an ancestor relationship.
# Δ semantics become "newer minus older" → positive Δ means size grew over time.
FROM_TS=$(git show -s --format=%ct "$FROM_SHA")
TO_TS=$(git show -s --format=%ct "$TO_SHA")
if (( FROM_TS > TO_TS )); then
  echo "Note: swapping args so the older commit is in column 1 (was: '$FROM_RAW' newer than '$TO_RAW')." >&2
  tmp_raw="$FROM_RAW"; FROM_RAW="$TO_RAW"; TO_RAW="$tmp_raw"
  tmp_sha="$FROM_SHA"; FROM_SHA="$TO_SHA"; TO_SHA="$tmp_sha"
fi
FROM_SHORT="${FROM_SHA:0:7}"
TO_SHORT="${TO_SHA:0:7}"

# Decide the label shown in the markdown header: empty unless user provided a branch/tag name.
# A raw 40-char (or shorter) SHA passed in is treated as a SHA-only column.
ref_label() {
  local raw="$1"
  local sha="$2"
  # If raw looks like a SHA (hex, 7-40 chars) AND matches the start of sha, treat as SHA-only.
  if [[ "$raw" =~ ^[0-9a-fA-F]{7,40}$ ]] && [[ "$sha" == "$raw"* ]]; then
    echo ""
  else
    echo "$raw"
  fi
}

FROM_LABEL=$(ref_label "$FROM_RAW" "$FROM_SHA")
TO_LABEL=$(ref_label "$TO_RAW" "$TO_SHA")

# 4. Save current ref so we can restore it on exit (branch name preferred, fallback to SHA),
# then write the lock so a forced kill leaves a recovery breadcrumb (see step 1).
ORIGINAL_REF=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || git rev-parse HEAD)
echo "$ORIGINAL_REF" > "$LOCK_FILE"

# Temp files for CSV captures
TMP_DIR=$(mktemp -d -t maxgraph-sizes-XXXXXX)
FROM_CSV="$TMP_DIR/from.csv"
TO_CSV="$TMP_DIR/to.csv"

cleanup() {
  local status=$?
  echo >&2
  echo "Restoring original ref: $ORIGINAL_REF" >&2
  git checkout --quiet "$ORIGINAL_REF" 2>/dev/null || \
    echo "Warning: failed to restore $ORIGINAL_REF. Run 'git checkout $ORIGINAL_REF' manually." >&2
  rm -rf "$TMP_DIR"
  rm -f "$LOCK_FILE"
  exit $status
}
trap cleanup EXIT INT TERM

PREV_LOCK_HASH=""

# 4. Build at each ref and capture CSV
build_and_capture() {
  local sha="$1"
  local out_csv="$2"
  local raw="$3"

  echo >&2
  echo "=== Checking out $raw ($sha) ===" >&2
  git checkout --quiet "$sha"

  local current_lock_hash=""
  if [[ -f package-lock.json ]]; then
    current_lock_hash=$(git hash-object package-lock.json)
  fi

  if [[ -z "$PREV_LOCK_HASH" || "$PREV_LOCK_HASH" != "$current_lock_hash" ]]; then
    # Use `npm ci` rather than `npm install` so the working tree stays clean:
    # `npm install` can rewrite package-lock.json and contaminate the tree across the checkout.
    echo "--- npm ci (package-lock.json changed or first run) ---" >&2
    npm ci >&2
  else
    echo "--- npm ci skipped (package-lock.json unchanged) ---" >&2
  fi
  PREV_LOCK_HASH="$current_lock_hash"

  echo "--- Building core ---" >&2
  npm run build -w packages/core >&2

  echo "--- Building examples and capturing sizes ---" >&2
  # build-all-examples.bash emits a CSV at the end: a header line and a values line.
  # Stream to stderr for the user while teeing to a tmp file we parse afterwards.
  local raw_out
  raw_out=$(mktemp -t maxgraph-raw-XXXXXX)
  ./scripts/build-all-examples.bash 2>&1 | tee /dev/stderr > "$raw_out"

  # Extract the last two non-empty lines, which are the CSV header and CSV values.
  local last_two
  last_two=$(grep -v '^$' "$raw_out" | tail -n 2)
  echo "$last_two" > "$out_csv"
  rm -f "$raw_out"

  if [[ $(wc -l < "$out_csv") -lt 2 ]]; then
    echo "Error: failed to capture CSV output from build-all-examples.bash." >&2
    exit 1
  fi
}

build_and_capture "$FROM_SHA" "$FROM_CSV" "$FROM_RAW"
build_and_capture "$TO_SHA" "$TO_CSV" "$TO_RAW"

# 5. Parse CSVs and emit markdown table.
#    Each CSV file has exactly 2 lines: header (example names) and values (kB sizes).
python3 - "$FROM_CSV" "$TO_CSV" "$FROM_LABEL" "$FROM_SHORT" "$TO_LABEL" "$TO_SHORT" <<'PY'
import sys

from_csv, to_csv, from_label, from_short, to_label, to_short = sys.argv[1:]

def load(path):
    with open(path) as f:
        lines = [ln.rstrip("\n") for ln in f if ln.strip()]
    header = lines[0].split(",")
    values = lines[1].split(",")
    return dict(zip(header, values))

from_sizes = load(from_csv)
to_sizes = load(to_csv)

def to_float(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None

def col_header(label, short):
    return f"{label} {short}".strip() if label else short

from_col = col_header(from_label, from_short)
to_col = col_header(to_label, to_short)

examples = sorted(set(from_sizes) | set(to_sizes))

print()
print(f"| Example | {from_col} (kB) | {to_col} (kB) | Δ kB | Δ % |")
print("| --- | ---: | ---: | ---: | ---: |")

for name in examples:
    fv = to_float(from_sizes.get(name))
    tv = to_float(to_sizes.get(name))
    fv_s = f"{fv:.2f}" if fv is not None else "N/A"
    tv_s = f"{tv:.2f}" if tv is not None else "N/A"
    if fv is not None and tv is not None:
        delta = tv - fv
        pct = (delta / fv * 100) if fv != 0 else 0.0
        delta_s = f"{delta:+.2f}"
        pct_s = f"{pct:+.2f}%"
    else:
        delta_s = "N/A"
        pct_s = "N/A"
    print(f"| {name} | {fv_s} | {tv_s} | {delta_s} | {pct_s} |")
print()
PY