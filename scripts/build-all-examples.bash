#!/usr/bin/env bash
set -euo pipefail

# This script builds all examples in the packages directory.
# From the root of the repository, run " ./scripts/build-all-examples.bash"
# Options can be combined, run with "--help" for the list.


usage() {
  echo "Usage: $0 [OPTIONS]"
  echo
  echo "Build all examples and display bundle sizes."
  echo
  echo "Options:"
  echo "  --fail-at-end     Keep building the remaining examples after a failure, and report all the failures at the"
  echo "                    very end, after the size sections. Exit non-zero if any build failed. Without this option,"
  echo "                    the script stops at the first failing build. No effect with --list-size-only, which builds"
  echo "                    nothing."
  echo "  --list-size-only  Skip building, only display bundle sizes from existing dist/ directories"
  echo "  --help            Show this help message"
  return 0
}

LIST_SIZE_ONLY=false
FAIL_AT_END=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help) usage; exit 0 ;;
    --fail-at-end) FAIL_AT_END=true ;;
    --list-size-only) LIST_SIZE_ONLY=true ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

# Names of the examples whose build failed, only filled when FAIL_AT_END is true
FAILED_EXAMPLES=()

if [[ "$LIST_SIZE_ONLY" = true ]]; then
  echo "Skip building examples."
else
  echo "Building all examples..."

  for dir in packages/ts-example* packages/js-example*; do
    if [[ -d "$dir" ]]; then
      echo
      echo "##################################################"
      echo "Building $dir"
      echo "##################################################"
      if [[ "$FAIL_AT_END" = true ]]; then
        # '|| build_exit_code=$?' keeps 'set -e' from aborting here, and only here, so the remaining examples are still
        # built and the size sections are still printed
        build_exit_code=0
        (cd "$dir" && npm run build) || build_exit_code=$?
        if [[ "$build_exit_code" -ne 0 ]]; then
          echo "Build of $dir FAILED with exit code $build_exit_code"
          FAILED_EXAMPLES+=("$(basename "$dir") (exit code $build_exit_code)")
        fi
      else
        (cd "$dir" && npm run build)
      fi
    fi
  done

  if [[ ${#FAILED_EXAMPLES[@]} -eq 0 ]]; then
    echo "All examples built successfully."
  else
    echo "${#FAILED_EXAMPLES[@]} example(s) failed to build, see the summary at the end."
  fi
fi


# Infer examples that produce JS bundles (frontend applications only)
EXAMPLES_FOR_TABLE=()
for dir in packages/js-example* packages/ts-example*; do
  if [[ -d "$dir/dist" ]] && find "$dir/dist" -name "*.js" -type f -print -quit | grep -q .; then
    EXAMPLES_FOR_TABLE+=("$(basename "$dir")")
  fi
done

for dir in packages/ts-example* packages/js-example*; do
  if [[ -d "$dir" ]]; then
    echo
    echo "##################################################"
    echo "Files in $dir/dist directory:"
    echo "##################################################"

    if [[ -d "$dir/dist" ]]; then
      # Find all JS files and display sizes with 2 decimal places
      # Use 1000 to match Vite's size display
      find "$dir/dist" -name "*.js" -type f -exec ls -l {} \; | LC_NUMERIC=C awk '{
        # Convert bytes to KB with 2 decimal places
        size_kb = $5 / 1000
        printf "%.2f kB %s\n", size_kb, $9
      }'
    else
      echo "No dist directory found in $dir"
    fi
  fi
done

# Collect bundle sizes (largest JS file per example = the one containing maxGraph)
# Use indexed array instead of associative array for bash 3.x compatibility (macOS). For the same reason, the loops
# below are counted rather than iterating over '${!EXAMPLES_FOR_TABLE[@]}', which aborts under 'set -u' in bash 3.x
# when the array is empty. --fail-at-end makes that case reachable, since every build failing leaves no dist at all.
BUNDLE_SIZES=()
for ((i = 0; i < ${#EXAMPLES_FOR_TABLE[@]}; i++)); do
  dir="packages/${EXAMPLES_FOR_TABLE[$i]}"
  if [[ -d "$dir/dist" ]]; then
    BUNDLE_SIZES[$i]=$(find "$dir/dist" -name "*.js" -type f -exec ls -l {} \; | LC_NUMERIC=C awk '
      { if ($5 > max) max = $5 }
      END { printf "%.2f", max / 1000 }
    ')
  else
    BUNDLE_SIZES[$i]=""
  fi
done

# Display markdown table
echo
echo "##################################################"
echo "Markdown table of bundle sizes"
echo "##################################################"
echo
echo "| Example | before | now |"
echo "| --- | --- | --- |"
for ((i = 0; i < ${#EXAMPLES_FOR_TABLE[@]}; i++)); do
  size="${BUNDLE_SIZES[$i]}"
  if [[ -n "$size" ]]; then
    echo "| ${EXAMPLES_FOR_TABLE[$i]} | kB | $size kB |"
  else
    echo "| ${EXAMPLES_FOR_TABLE[$i]} | kB | N/A |"
  fi
done

# Display CSV format (header = example names, second line = sizes)
echo
echo "##################################################"
echo "CSV of bundle sizes (kB)"
echo "##################################################"
echo
csv_header=""
csv_values=""
for ((i = 0; i < ${#EXAMPLES_FOR_TABLE[@]}; i++)); do
  size="${BUNDLE_SIZES[$i]:-N/A}"
  csv_header="${csv_header:+$csv_header,}${EXAMPLES_FOR_TABLE[$i]}"
  csv_values="${csv_values:+$csv_values,}$size"
done
echo "$csv_header"
echo "$csv_values"

# Report the failed builds last, so that the sizes above stay readable in the CI log, and fail the script
if [[ ${#FAILED_EXAMPLES[@]} -gt 0 ]]; then
  echo
  echo "##################################################"
  echo "Failed builds"
  echo "##################################################"
  echo
  for failed_example in "${FAILED_EXAMPLES[@]}"; do
    echo "- $failed_example"
  done
  echo
  echo "${#FAILED_EXAMPLES[@]} example(s) failed to build."
  exit 1
fi

