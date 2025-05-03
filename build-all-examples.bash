#!/usr/bin/env bash
set -euo pipefail

# This script builds all examples in the packages directory.
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
