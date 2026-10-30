#!/usr/bin/env bash
# SessionStart hook: inside herdr-core, tell Claude so and steer delegation to hc. The
# herdr-core skill's description already prefers hc, but a session can't see that it is
# inside herdr-core without running env, so the preference loses to the Agent tool.
# Silent outside herdr-core.
set -uo pipefail

[ -n "${HC_TERMINAL_ID:-}" ] || exit 0

printf '%s\n' "You are running inside herdr-core as terminal ${HC_TERMINAL_ID}. Use hc (the herdr-core skill) instead of the Agent tool for implementation, review, cross-repo work and anything long-running, so the user can watch and steer it. Keep the Agent tool for quick read-only lookups. If another agent started you (your task arrived as an <hc from=...> message), start agents only when that task tells you to."
exit 0
