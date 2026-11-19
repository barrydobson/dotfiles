#!/usr/bin/env bash
# PostToolUse (Skill) and UserPromptExpansion hook: inside herdr-core, add the herdr-specific
# guidance for a skill from ~/.config/herdr-core/skill-context/<skill>.md, so public skills
# stay generic. The plugin prefix is dropped: tote-issue-tracker:work reads work.md.
# Silent outside herdr-core and for skills without a file.
set -uo pipefail

[ -n "${HC_TERMINAL_ID:-}" ] || exit 0

in=$(cat)
event=$(jq -r '.hook_event_name // empty' <<<"$in")
name=$(jq -r '.tool_input.skill // .command_name // empty' <<<"$in")
name=${name##*:}
[ -n "$event" ] && [ -n "$name" ] || exit 0

f="${HC_SKILL_CONTEXT_DIR:-$HOME/.config/herdr-core/skill-context}/$name.md"
[ -f "$f" ] || exit 0

jq -n --arg e "$event" --rawfile c "$f" '{hookSpecificOutput: {hookEventName: $e, additionalContext: $c}}'
