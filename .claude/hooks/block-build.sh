#!/bin/bash
# PreToolUse hook: warns when build commands run in main agent context.
# Suggests dedicated sub-agent skills instead.

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only check Bash commands
[[ "$TOOL_NAME" != "Bash" ]] && exit 0

# Skip if running in a sub-agent (sub-agents ARE the right place for builds)
[[ -n "$CLAUDE_AGENT_NAME" ]] && exit 0

# Skip lightweight commands
if echo "$COMMAND" | grep -qE '(--help|list|ls|outdated|--version|node --version)'; then
  exit 0
fi

# Warn on heavy build/test/lint commands
if echo "$COMMAND" | grep -qE '^\s*npm\s+(run\s+build|test|run\s+lint|run\s+check)'; then
  echo "Build command detected in main agent context." >&2
  echo "Consider using dedicated sub-agent skills instead:" >&2
  echo "  /build  — Build core package" >&2
  echo "  /test   — Run tests" >&2
  echo "  /lint   — Run linting" >&2
  echo "" >&2
  echo "Sub-agents keep verbose build output out of your context window." >&2
fi

exit 0
