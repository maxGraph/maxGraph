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

# The command may follow a prefix such as the nvm setup or a cd, so match after any command separator
if ! echo "$COMMAND" | grep -qE '(^|[;&|(][[:space:]]*)npm[[:space:]]+(run[[:space:]]+(build|test|lint|check)|test)([[:space:]:]|$)'; then
  exit 0
fi

if echo "$COMMAND" | grep -qE '(^|[[:space:]])(--help|--version)([[:space:]]|$)'; then
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
