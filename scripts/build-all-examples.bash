#!/usr/bin/env bash
set -euo pipefail

# This script builds all examples in the packages directory.
# From the root of the repository, run " ./scripts/build-all-examples.bash"


# Check for command line arguments
LIST_SIZE_ONLY=false
if [[ $# -gt 0 && "$1" == "--list-size-only" ]]; then
  LIST_SIZE_ONLY=true
fi

if [ "$LIST_SIZE_ONLY" = true ]; then
  echo "Skip building examples..."
else
  echo "Building all examples..."

  for dir in packages/ts-example* packages/js-example*; do
    if [ -d "$dir" ]; then
      echo
      echo "##################################################"
      echo "Building $dir"
      echo "##################################################"
      (cd "$dir" && npm run build)
    fi
  done

  echo "All examples built successfully."
fi


for dir in packages/ts-example* packages/js-example*; do
  if [ -d "$dir" ]; then
    echo
    echo "##################################################"
    echo "Files in $dir/dist directory:"
    echo "##################################################"

    if [ -d "$dir/dist" ]; then
      # Find all JS files and display sizes with 2 decimal places
      # Use 1000 to match Vite's size display
      find "$dir/dist" -name "*.js" -type f -exec ls -l {} \; | LC_NUMERIC=C awk '{
        # Convert bytes to KB with 2 decimal places
        size_kb = $5 / 1000
        printf "%.2f KB %s\n", size_kb, $9
      }'

      # Calculate total size with 2 decimal places
      total_bytes=$(find "$dir/dist" -name "*.js" -type f -exec du -b {} \; | awk '{sum += $1} END {print sum}')
      total_kb=$(echo "scale=2; $total_bytes/1000" | bc)
      echo "Total JS size: ${total_kb} KB"
    else
      echo "No dist directory found in $dir"
    fi
  fi
done

