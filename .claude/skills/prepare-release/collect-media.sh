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

# Lists the images and videos of a pull request or an issue of maxGraph/maxGraph, with the text around each one, so
# that it can be named. Bot comments are ignored, their badges are not content.
#
# Usage: collect-media.sh pr|issue <number>
#
# One line per media, tab separated: source, media, then the context fields heading, alt, line (the text sharing the
# line of the media) and before (the last non-empty line above it).

set -euo pipefail

kind="${1:?usage: collect-media.sh pr|issue <number>}"
number="${2:?usage: collect-media.sh pr|issue <number>}"

case "$kind" in
  pr) fields='body,comments,reviews'; source="#$number" ;;
  issue) fields='body,comments'; source="issue #$number" ;;
  *) echo "unknown kind '$kind', expected pr or issue" >&2; exit 1 ;;
esac

human='select(.author.login | test("coderabbitai|sonarqubecloud|github-actions|dependabot|\\[bot\\]$") | not)'

gh "$kind" view "$number" -R maxGraph/maxGraph --json "$fields" -q "
  \"$source\" as \$src
  | \"=== \(\$src) description\",
    (.body | gsub(\"(?s)<!-- This is an auto-generated comment.*?<!-- end of auto-generated comment[^>]*-->\"; \"\")),
    (.comments[] | $human | \"=== \(\$src) comment by \(.author.login)\", .body),
    (.reviews[]? | $human | select(.body != \"\") | \"=== \(\$src) review by \(.author.login)\", .body)
" | awk '
  BEGIN {
    badges = "dependabot-badges|sonarsource\\.github\\.io|coderabbit_public_assets|img\\.shields\\.io|codecov\\.io"
    re = "!\\[[^]]*\\]\\([^)]+\\)|<img[^>]*>|<video[^>]*>|https://github\\.com/user-attachments/assets/[A-Za-z0-9-]+|https://github\\.com/[^ )\"]+/assets/[0-9]+/[A-Za-z0-9-]+|https://user-images\\.githubusercontent\\.com/[^ )\"]+"
  }
  { sub(/\r$/, "") }
  /^=== / { source = substr($0, 5); heading = ""; previous = ""; next }
  /^#+ / { heading = $0; previous = ""; next }
  {
    line = $0; found = 0
    while (match(line, re)) {
      media = substr(line, RSTART, RLENGTH)
      if (media ~ badges) { line = substr(line, RSTART + RLENGTH); found = 1; continue }
      rest = $0; gsub(re, "", rest); gsub(/^[ \t>*-]+|[ \t]+$/, "", rest)
      alt = ""
      if (media ~ /^!\[/) { alt = media; sub(/^!\[/, "", alt); sub(/\].*/, "", alt) }
      else if (media ~ /alt="/) { alt = media; sub(/.*alt="/, "", alt); sub(/".*/, "", alt) }
      printf "%s\t%s\theading=%s\talt=%s\tline=%s\tbefore=%s\n", source, media, heading, alt, rest, previous
      line = substr(line, RSTART + RLENGTH); found = 1
    }
    if (!found && $0 ~ /[^ \t]/) previous = $0
  }
'
