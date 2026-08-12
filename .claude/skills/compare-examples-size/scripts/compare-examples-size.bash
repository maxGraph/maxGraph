#!/usr/bin/env bash
set -euo pipefail

# Compare maxGraph example bundle sizes between two git references.
#
# Usage: compare-examples-size.bash [--from-sizes <file> | --to-sizes <file>]
#                                   [--sizes-column <name|index>] <from-ref> <to-ref>
#   <from-ref> / <to-ref>: commit SHA, branch name, or tag.
#
# Passing already-measured sizes for one side skips its checkout and build, which halves the
# runtime. The other side is still built from source.
#
# Output: a markdown table on stdout with per-example sizes for both refs and the delta,
# followed by a blockquote note stating the ancestry relationship of the two refs and the
# provenance of any reused sizes. Build logs are printed to stderr so stdout stays parseable.

usage() {
  cat >&2 <<'USAGE'
Usage:
  compare-examples-size.bash <from-ref> <to-ref>
  compare-examples-size.bash --from-sizes <file> [--sizes-column <col>] <from-ref> <to-ref>
  compare-examples-size.bash --to-sizes <file> [--sizes-column <col>] <from-ref> <to-ref>

Each ref can be a commit SHA, branch name, or tag.

Options:
  --from-sizes <file>   Reuse already-measured sizes for <from-ref>; do not build it.
  --to-sizes <file>     Reuse already-measured sizes for <to-ref>; do not build it.
  --sizes-column <col>  Which size column of <file> to read, given as a header substring or as
                        a 1-based index among the file's size columns. Required only when the
                        file holds more than one size column, which is the case for a table
                        produced by a previous run of this script.

<file> may be any of:
  - the markdown table printed by a previous run of this script;
  - the markdown table printed by scripts/build-all-examples.bash;
  - the 2-line CSV printed by scripts/build-all-examples.bash (names line, then values line).
USAGE
}

FROM_SIZES_FILE=""
TO_SIZES_FILE=""
SIZES_COLUMN=""
POSITIONAL=()

require_value() {
  # $1 = option name, $2 = number of args left including the option itself
  if (( $2 < 2 )); then
    echo "Error: $1 requires a value." >&2
    usage
    exit 2
  fi
}

while (( $# > 0 )); do
  case "$1" in
    --from-sizes) require_value "$1" $#; FROM_SIZES_FILE="$2"; shift 2 ;;
    --to-sizes)   require_value "$1" $#; TO_SIZES_FILE="$2";   shift 2 ;;
    --sizes-column) require_value "$1" $#; SIZES_COLUMN="$2";  shift 2 ;;
    -h|--help) usage; exit 0 ;;
    --) shift; while (( $# > 0 )); do POSITIONAL+=("$1"); shift; done ;;
    -*) echo "Error: unknown option '$1'." >&2; usage; exit 2 ;;
    *) POSITIONAL+=("$1"); shift ;;
  esac
done

if (( ${#POSITIONAL[@]} != 2 )); then
  echo "Error: expected exactly 2 refs, got ${#POSITIONAL[@]}." >&2
  usage
  exit 2
fi
FROM_RAW="${POSITIONAL[0]}"
TO_RAW="${POSITIONAL[1]}"

if [[ -n "$FROM_SIZES_FILE" && -n "$TO_SIZES_FILE" ]]; then
  echo "Error: --from-sizes and --to-sizes cannot be combined; at least one ref must be built." >&2
  exit 2
fi
if [[ -n "$SIZES_COLUMN" && -z "$FROM_SIZES_FILE$TO_SIZES_FILE" ]]; then
  echo "Error: --sizes-column applies only together with --from-sizes or --to-sizes." >&2
  exit 2
fi

# Sizes files are resolved to absolute paths *before* the cd below, because a relative path
# given on the command line is relative to the caller's directory, not to the repository root.
abs_path() {
  local path="$1"
  [[ "$path" == /* ]] && { echo "$path"; return; }
  echo "$PWD/$path"
}

for sizes_file in "$FROM_SIZES_FILE" "$TO_SIZES_FILE"; do
  if [[ -n "$sizes_file" && ! -r "$sizes_file" ]]; then
    echo "Error: cannot read sizes file '$sizes_file'." >&2
    exit 1
  fi
done
if [[ -n "$FROM_SIZES_FILE" ]]; then FROM_SIZES_FILE=$(abs_path "$FROM_SIZES_FILE"); fi
if [[ -n "$TO_SIZES_FILE" ]]; then TO_SIZES_FILE=$(abs_path "$TO_SIZES_FILE"); fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$REPO_ROOT" ]]; then
  echo "Error: not inside a git repository." >&2
  exit 1
fi
cd "$REPO_ROOT"

# 1. Recovery lock check: must run FIRST. If a previous invocation was killed forcibly
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

# Normalize order: earlier commit first (column 1), later commit second (column 2), regardless of
# CLI argument order. "Earlier" is determined by committer timestamp, which is always defined, even
# when the two refs are not in an ancestor relationship. Δ semantics become "column 2 minus column 1".
#
# The timestamp only implies a chronological before/after when one ref is an ancestor of the other.
# For diverged refs a positive Δ does NOT mean the size grew over time: a branch based on an old main
# reports a large positive Δ against a newer main simply because it lacks main's later size
# reductions. See "Reading the sign of Δ" in SKILL.md.
FROM_TS=$(git show -s --format=%ct "$FROM_SHA")
TO_TS=$(git show -s --format=%ct "$TO_SHA")
if (( FROM_TS > TO_TS )); then
  echo "Note: swapping args so the earlier commit is in column 1 (was: '$FROM_RAW' later than '$TO_RAW')." >&2
  tmp_raw="$FROM_RAW"; FROM_RAW="$TO_RAW"; TO_RAW="$tmp_raw"
  tmp_sha="$FROM_SHA"; FROM_SHA="$TO_SHA"; TO_SHA="$tmp_sha"
  # The supplied sizes belong to a ref, not to a column, so they follow their ref across the swap.
  tmp_sizes="$FROM_SIZES_FILE"; FROM_SIZES_FILE="$TO_SIZES_FILE"; TO_SIZES_FILE="$tmp_sizes"
fi
FROM_SHORT="${FROM_SHA:0:7}"
TO_SHORT="${TO_SHA:0:7}"

# Classify the relationship between the two refs. This decides whether the sign of Δ carries any
# chronological meaning at all, so it is reported alongside the table rather than left to the reader.
# It is computed before the builds so the caller learns about a diverged pair immediately, not after
# waiting several minutes.
if [[ "$FROM_SHA" == "$TO_SHA" ]]; then
  ANCESTRY="identical"
elif git merge-base --is-ancestor "$FROM_SHA" "$TO_SHA"; then
  ANCESTRY="ancestor"
elif git merge-base --is-ancestor "$TO_SHA" "$FROM_SHA"; then
  ANCESTRY="descendant"
else
  ANCESTRY="diverged"
fi
echo "Ancestry of the two refs: $ANCESTRY" >&2

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

# 4. Save current ref so we can restore it on exit (branch name preferred, fallback to SHA).
ORIGINAL_REF=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || git rev-parse HEAD)
TMP_DIR=""

cleanup() {
  local status=$?
  # Disarm the traps so a nested exit cannot re-enter cleanup.
  trap - EXIT INT TERM
  echo >&2
  echo "Restoring original ref: $ORIGINAL_REF" >&2
  git checkout --quiet "$ORIGINAL_REF" 2>/dev/null || \
    echo "Warning: failed to restore $ORIGINAL_REF. Run 'git checkout $ORIGINAL_REF' manually." >&2
  [[ -n "$TMP_DIR" ]] && rm -rf "$TMP_DIR"
  rm -f "$LOCK_FILE"
  exit $status
}
# cleanup is bound to EXIT only, and the signal handlers just `exit`. Binding it to
# EXIT INT TERM instead would run it twice on a signal (the handler's own `exit` fires
# the EXIT trap) and would report status 0 for an interrupted run, because `$?` inside a
# signal handler is the status of the last completed command, not the signal.
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# The traps are armed, so from here on any exit path removes the lock and the temp dir.
echo "$ORIGINAL_REF" > "$LOCK_FILE"

# Temp files for CSV captures
TMP_DIR=$(mktemp -d -t maxgraph-sizes-XXXXXX)
FROM_CSV="$TMP_DIR/from.csv"
TO_CSV="$TMP_DIR/to.csv"

PREV_LOCK_HASH=""

# 5. Build at each ref and capture CSV
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

  # Extract the last two non-blank lines, which are the CSV header and CSV values.
  # Whitespace-only lines must be filtered too, otherwise they would displace a real CSV
  # line out of the `tail -n 2` window.
  local last_two
  last_two=$(grep -vE '^[[:space:]]*$' "$raw_out" | tail -n 2)
  echo "$last_two" > "$out_csv"
  rm -f "$raw_out"

  if [[ $(wc -l < "$out_csv") -lt 2 ]]; then
    echo "Error: failed to capture CSV output from build-all-examples.bash." >&2
    exit 1
  fi
}

# A side backed by a supplied sizes file is neither checked out nor built. Its file is handed to the
# parser as-is, so the parser is what tolerates the several accepted input formats.
if [[ -n "$FROM_SIZES_FILE" ]]; then
  echo >&2
  echo "=== Reusing supplied sizes for $FROM_RAW ($FROM_SHA): $FROM_SIZES_FILE ===" >&2
  FROM_DATA="$FROM_SIZES_FILE"
else
  build_and_capture "$FROM_SHA" "$FROM_CSV" "$FROM_RAW"
  FROM_DATA="$FROM_CSV"
fi

if [[ -n "$TO_SIZES_FILE" ]]; then
  echo >&2
  echo "=== Reusing supplied sizes for $TO_RAW ($TO_SHA): $TO_SIZES_FILE ===" >&2
  TO_DATA="$TO_SIZES_FILE"
else
  build_and_capture "$TO_SHA" "$TO_CSV" "$TO_RAW"
  TO_DATA="$TO_CSV"
fi

# 6. Parse both sides and emit the markdown table.
#    Values are passed through the environment rather than as positional arguments: refs and
#    labels are arbitrary user input, and named variables keep the contract readable as it grows.
export CES_FROM_DATA="$FROM_DATA" CES_TO_DATA="$TO_DATA"
export CES_FROM_LABEL="$FROM_LABEL" CES_FROM_SHORT="$FROM_SHORT" CES_FROM_SHA="$FROM_SHA"
export CES_TO_LABEL="$TO_LABEL" CES_TO_SHORT="$TO_SHORT" CES_TO_SHA="$TO_SHA"
export CES_FROM_SUPPLIED="$FROM_SIZES_FILE" CES_TO_SUPPLIED="$TO_SIZES_FILE"
export CES_SIZES_COLUMN="$SIZES_COLUMN" CES_ANCESTRY="$ANCESTRY"
python3 - <<'PY'
import os
import re
import sys

FROM_DATA = os.environ["CES_FROM_DATA"]
TO_DATA = os.environ["CES_TO_DATA"]
FROM_SUPPLIED = os.environ["CES_FROM_SUPPLIED"]
TO_SUPPLIED = os.environ["CES_TO_SUPPLIED"]
SIZES_COLUMN = os.environ["CES_SIZES_COLUMN"]
ANCESTRY = os.environ["CES_ANCESTRY"]

SEPARATOR_CELL = re.compile(r"^:?-{3,}:?$")
TRAILING_UNIT = re.compile(r"\s*kB\s*$", re.IGNORECASE)
SHA_TOKEN = re.compile(r"\b[0-9a-fA-F]{7,40}\b")


def die(message):
    sys.exit(f"Error: {message}")


def parse_size(cell):
    """Return a float, or None for a missing value. Accepts '303.69', '303.69 kB' and 'N/A'."""
    text = TRAILING_UNIT.sub("", cell.strip()).lstrip("+")
    if not text or text.upper() == "N/A":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def is_delta_header(header):
    """Delta columns of a previous run's table hold numbers but are not sizes."""
    return header.startswith("Δ") or "%" in header


def load_csv(path, lines):
    """2-line CSV as emitted by build-all-examples.bash: names line, then values line."""
    if len(lines) < 2:
        die(f"{path}: expected 2 CSV lines (names then values), found {len(lines)}.")
    names = [c.strip() for c in lines[0].split(",")]
    values = [c.strip() for c in lines[1].split(",")]
    # zip() would silently truncate to the shorter list, producing a partial table that
    # still looks trustworthy. Fail loudly instead.
    if len(names) != len(values):
        die(
            f"CSV header/values column count mismatch in {path} "
            f"({len(names)} vs {len(values)})."
        )
    return {name: parse_size(value) for name, value in zip(names, values)}, None


def load_markdown(path, lines):
    """A markdown table from a previous run of this script or from build-all-examples.bash."""
    rows = []
    for line in lines:
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        filled = [cell for cell in cells if cell]
        if filled and all(SEPARATOR_CELL.match(cell) for cell in filled):
            continue
        rows.append(cells)
    if len(rows) < 2:
        die(f"{path}: found a markdown table with no data rows.")

    header, data = rows[0], rows[1:]
    # A size column is any non-leading column that is not a delta column and holds at least one
    # parseable number. This is what distinguishes the populated 'now' column of
    # build-all-examples.bash from its deliberately empty 'before' column.
    candidates = []
    for index in range(1, len(header)):
        if is_delta_header(header[index]):
            continue
        parsed = sum(
            1 for row in data if index < len(row) and parse_size(row[index]) is not None
        )
        if parsed:
            candidates.append((index, header[index]))

    if not candidates:
        die(f"{path}: no column holds parseable sizes. Headers: {header}.")

    if SIZES_COLUMN:
        chosen = select_column(path, candidates, SIZES_COLUMN)
    elif len(candidates) == 1:
        chosen = candidates[0]
    else:
        listed = ", ".join(f"[{n}] '{name}'" for n, (_, name) in enumerate(candidates, 1))
        die(
            f"{path} holds {len(candidates)} size columns, so the intended one is ambiguous. "
            f"Re-run with --sizes-column <name-or-index>, choosing from: {listed}."
        )

    index, chosen_header = chosen
    sizes = {}
    for row in data:
        name = row[0].strip() if row else ""
        if not name:
            continue
        sizes[name] = parse_size(row[index]) if index < len(row) else None
    return sizes, chosen_header


def select_column(path, candidates, spec):
    spec = spec.strip()
    listed = ", ".join(f"[{n}] '{name}'" for n, (_, name) in enumerate(candidates, 1))
    if re.fullmatch(r"\d+", spec):
        position = int(spec)
        if not 1 <= position <= len(candidates):
            die(
                f"--sizes-column {position} is out of range for {path}, which has "
                f"{len(candidates)} size columns: {listed}."
            )
        return candidates[position - 1]
    matches = [c for c in candidates if spec.lower() in c[1].lower()]
    if len(matches) == 1:
        return matches[0]
    if not matches:
        die(f"--sizes-column '{spec}' matches no size column of {path}. Available: {listed}.")
    die(f"--sizes-column '{spec}' matches several size columns of {path}: {listed}.")


def load(path):
    with open(path) as f:
        lines = [line.rstrip("\n") for line in f if line.strip()]
    if not lines:
        die(f"{path} is empty.")
    if any(line.strip().startswith("|") for line in lines):
        return load_markdown(path, lines)
    return load_csv(path, lines)


def check_sha(path, chosen_header, expected_sha, side):
    """Guard against pairing a supplied table with the wrong ref.

    A table produced by this script carries the short SHA in its column header, so a mismatch
    with the ref named on the command line means the reused numbers describe a different commit.
    Silently trusting them would yield a table that looks authoritative and is wrong.
    """
    if not chosen_header:
        return
    tokens = SHA_TOKEN.findall(chosen_header)
    if not tokens:
        return
    embedded = tokens[-1].lower()
    if not expected_sha.lower().startswith(embedded):
        die(
            f"the column '{chosen_header}' of {path} refers to commit {embedded}, but the "
            f"{side} ref resolves to {expected_sha[:7]}. Pass the ref those sizes were measured "
            f"at, or select a different column with --sizes-column."
        )


from_sizes, from_chosen = load(FROM_DATA)
to_sizes, to_chosen = load(TO_DATA)
if FROM_SUPPLIED:
    check_sha(FROM_DATA, from_chosen, os.environ["CES_FROM_SHA"], "from")
if TO_SUPPLIED:
    check_sha(TO_DATA, to_chosen, os.environ["CES_TO_SHA"], "to")

# Silently ignoring a column selection would hide a misunderstanding about the file's shape.
if SIZES_COLUMN and (from_chosen if FROM_SUPPLIED else to_chosen) is None:
    die(
        "--sizes-column was given, but the supplied file is a 2-line CSV: it holds a single set "
        "of sizes and offers no column to choose from."
    )


def col_header(label, short):
    return f"{label} {short}".strip() if label else short


from_col = col_header(os.environ["CES_FROM_LABEL"], os.environ["CES_FROM_SHORT"])
to_col = col_header(os.environ["CES_TO_LABEL"], os.environ["CES_TO_SHORT"])

examples = sorted(set(from_sizes) | set(to_sizes))
if not examples:
    die("no examples found in either side; nothing to compare.")

print()
print(f"| Example | {from_col} (kB) | {to_col} (kB) | Δ kB | Δ % |")
print("| --- | ---: | ---: | ---: | ---: |")

for name in examples:
    fv = from_sizes.get(name)
    tv = to_sizes.get(name)
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

notes = []
reused = []
if FROM_SUPPLIED:
    reused.append(f"column 1 (`{from_col}`) was supplied from `{FROM_SUPPLIED}`, not rebuilt")
if TO_SUPPLIED:
    reused.append(f"column 2 (`{to_col}`) was supplied from `{TO_SUPPLIED}`, not rebuilt")
if reused:
    notes.append(
        "Reused sizes: " + "; ".join(reused) + ". They are comparable only if they were "
        "measured with the same toolchain and dependencies as the rebuilt side."
    )

if ANCESTRY == "identical":
    notes.append("Both columns are the same commit, so every Δ is expected to be 0.")
elif ANCESTRY == "ancestor":
    notes.append(
        f"`{from_col}` is an ancestor of `{to_col}`, so Δ is chronological: a positive Δ means "
        "the bundle grew as history advanced."
    )
elif ANCESTRY == "descendant":
    notes.append(
        f"`{to_col}` is an ancestor of `{from_col}` despite carrying the later committer "
        "timestamp, which happens after a rebase or an amended date. Δ therefore runs against "
        "history: a positive Δ means the bundle shrank as history advanced."
    )
else:
    notes.append(
        f"`{from_col}` and `{to_col}` have diverged, so Δ is not chronological: it is the "
        "difference between two independent states, not growth. A branch that is behind its "
        "base shows a positive Δ merely for lacking the base's later reductions."
    )

for note in notes:
    print(f"> {note}")
print()
PY