#!/usr/bin/env bash
# Self-check for hc-skill-context.sh. Run it after any edit to the hook.
set -uo pipefail

H="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/hc-skill-context.sh"
T=$(mktemp -d)
trap 'trash "$T"' EXIT
fail=0
printf 'sol guidance\n' >"$T/sol-loop.md"
printf 'work guidance\n' >"$T/work.md"

check() { # check <want|SILENT> <terminal-id> <json>
  local out
  out=$(HC_TERMINAL_ID="$2" HC_SKILL_CONTEXT_DIR="$T" bash "$H" <<<"$3")
  if [ "$1" = SILENT ]; then
    [ -z "$out" ] && r=ok || r=FAIL
  else
    jq -e --arg w "$1" '.hookSpecificOutput.additionalContext | contains($w)' <<<"$out" >/dev/null && r=ok || r=FAIL
  fi
  [ "$r" = ok ] || fail=1
  printf '%-4s %-14s %s\n' "$r" "$1" "$3"
}

check 'sol guidance' t1 '{"hook_event_name":"PostToolUse","tool_input":{"skill":"sol-loop"}}'
check 'sol guidance' t1 '{"hook_event_name":"PostToolUse","tool_input":{"skill":"barrydobson-skills:sol-loop"}}'
check 'work guidance' t1 '{"hook_event_name":"UserPromptExpansion","command_name":"tote-issue-tracker:work"}'
check SILENT t1 '{"hook_event_name":"PostToolUse","tool_input":{"skill":"file-pr"}}'
check SILENT '' '{"hook_event_name":"PostToolUse","tool_input":{"skill":"sol-loop"}}'
check SILENT t1 '{"hook_event_name":"PostToolUse","tool_input":{}}'

exit $fail
