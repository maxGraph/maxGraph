#!/usr/bin/env bash
set -euo pipefail

# This script builds all examples in the packages directory.
# From the root of the repository, run " ./scripts/build-all-examples.bash"


usage() {
  echo "Usage: $0 [OPTIONS]"
  echo
  echo "Build all examples and display bundle sizes."
  echo
  echo "Options:"
  echo "  --list-size-only  Skip building, only display bundle sizes from existing dist/ directories"
  echo "  --help            Show this help message"
  return 0
}

LIST_SIZE_ONLY=false
if [[ $# -gt 0 ]]; then
  case "$1" in
    --help) usage; exit 0 ;;
    --list-size-only) LIST_SIZE_ONLY=true ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
fi

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
      (cd "$dir" && npm run build)
    fi
  done

  echo "All examples built successfully."
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
# Use indexed array instead of associative array for bash 3.x compatibility (macOS)
BUNDLE_SIZES=()
for i in "${!EXAMPLES_FOR_TABLE[@]}"; do
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
for i in "${!EXAMPLES_FOR_TABLE[@]}"; do
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
for i in "${!EXAMPLES_FOR_TABLE[@]}"; do
  size="${BUNDLE_SIZES[$i]:-N/A}"
  csv_header="${csv_header:+$csv_header,}${EXAMPLES_FOR_TABLE[$i]}"
  csv_values="${csv_values:+$csv_values,}$size"
done
echo "$csv_header"
echo "$csv_values"

