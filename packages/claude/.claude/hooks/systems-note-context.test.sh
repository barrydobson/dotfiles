#!/usr/bin/env bash
# Self-check for systems-note-context.sh. Builds a throwaway vault and repos, runs the hook
# against each, and checks the output names the right note and omits its frontmatter.
# Run it after any edit to the hook.
set -uo pipefail

H="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/systems-note-context.sh"
T=$(mktemp -d)
trap 'trash "$T"' EXIT
fail=0

mkdir -p "$T/vault/Systems"
printf -- '---\ntype: system\nrepo: TheTote/kube-fleet\n---\n\n## Notes\n\n- fleet fact\n' >"$T/vault/Systems/kube-fleet.md"
printf -- '---\ntype: system\nrepo: TheTote/development-metrics\n---\n\n- metrics fact\n' >"$T/vault/Systems/dev-metrics.md"
printf -- '---\ntype: system\nrepo: TheTote/ToteSite\n---\n\n- site fact\n' >"$T/vault/Systems/ToteSite.md"

repo() { # repo <folder> [origin-url]
  git init -q "$T/$1" && git -C "$T/$1" commit -q --allow-empty -m init
  [ -n "${2:-}" ] && git -C "$T/$1" remote add origin "$2"
}
repo kube-fleet https://github.com/TheTote/kube-fleet.git
repo development-metrics
repo totesite git@github.com:TheTote/ToteSite.git
repo renamed-checkout https://github.com/TheTote/kube-fleet.git
repo unrelated https://github.com/TheTote/unrelated.git
git -C "$T/kube-fleet" worktree add -q "$T/kube-fleet/.claude/worktrees/feat-x" -b feat-x
mkdir -p "$T/kube-fleet/sub/dir" "$T/not-a-repo"

check() { # check <want-substring|SILENT> <cwd>
  local out
  out=$(jq -n --arg c "$2" '{cwd:$c, source:"startup"}' | VAULT_DIR="$T/vault" bash "$H")
  local code=$?
  if [ "$1" = SILENT ]; then
    [ -z "$out" ] && [ $code -eq 0 ] && r=ok || r=FAIL
  else
    grep -qF "$1" <<<"$out" && [ $code -eq 0 ] && ! grep -q '^type: system' <<<"$out" && r=ok || r=FAIL
  fi
  [ "$r" = ok ] || fail=1
  printf '%-4s %-14s %s\n' "$r" "$1" "${2#"$T"/}"
}

check 'fleet fact' "$T/kube-fleet"
check 'fleet fact' "$T/kube-fleet/sub/dir"
check 'fleet fact' "$T/kube-fleet/.claude/worktrees/feat-x"
check 'fleet fact' "$T/renamed-checkout"
check 'metrics fact' "$T/development-metrics"
check 'site fact' "$T/totesite"
check SILENT "$T/unrelated"
check SILENT "$T/not-a-repo"

out=$(jq -n --arg c "$T/kube-fleet" '{cwd:$c}' | VAULT_DIR="$T/missing" bash "$H"); code=$?
{ [ -z "$out" ] && [ $code -eq 0 ]; } && echo "ok   SILENT         no vault" || { echo "FAIL SILENT         no vault"; fail=1; }

exit $fail
