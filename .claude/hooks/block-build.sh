#!/bin/bash
# PreToolUse hook: when a heavy build, test or lint command runs in the main agent context, tells the model to
# delegate it to the build-runner agent instead. Never blocks the command.

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // empty')

[[ "$TOOL_NAME" != "Bash" ]] && exit 0

# Sub-agents, build-runner included, are the right place for builds. Hooks firing in a sub-agent receive its agent_id.
[[ -n "$AGENT_ID" ]] && exit 0

# The command may follow a prefix such as the nvm setup or a cd, so match after any command separator. npm options
# such as -w may come before the subcommand, and the run scripts have variants such as test-check or lint:fix.
NPM_HEAVY='(^|[;&|(][[:space:]]*)npm([[:space:]]+[^;&|[:space:]]+)*[[:space:]]+(run[[:space:]]+(build|test|lint|check)[[:alnum:]:-]*|test|t)([[:space:]]|$)'
EXAMPLES_BUILD='(^|[;&|(/[:space:]])build-all-examples\.bash([[:space:]]|$)'
if ! echo "$COMMAND" | grep -qE "$NPM_HEAVY|$EXAMPLES_BUILD"; then
  exit 0
fi

# A lone command asking for help or a version runs nothing heavy. In a chain, the other commands still may.
if ! echo "$COMMAND" | grep -qE '[;&|]' && echo "$COMMAND" | grep -qE '(^|[[:space:]])(--help|--version)([[:space:]]|$)'; then
  exit 0
fi

# Claude never sees the stderr of a hook exiting 0, additionalContext is what reaches the model
jq -n '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: "A build, test or lint command ran in the main agent context. Delegate such commands to the build-runner agent, which reports only the verdict and the first error and keeps the log out of this context."
  }
}'
exit 0
