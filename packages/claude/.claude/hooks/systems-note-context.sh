#!/usr/bin/env bash
# SessionStart hook: when a session starts inside a repo that has a note in the vault's
# Systems/ folder, print that note so it lands in Claude's context. The notes hold the
# non-obvious facts that past work in the repo turned up; an instruction to go and read
# them loses to the task in front of the session, so the hook does it instead.
#
# Match order: the origin remote's repo name, then the checkout folder's name. Each is
# compared with the note filename, then with the last segment of the note's `repo:` field
# (dev-metrics.md has `repo: TheTote/development-metrics`). Silent when nothing matches.
# Never fails the session: every miss exits 0.
#
# shortcut: `aliases:` is not read. Every current note is reachable by filename or `repo:`;
# read aliases if a note turns up that is only known by an alias.
set -uo pipefail

payload=$(cat)
cwd=$(jq -r '.cwd // empty' <<<"$payload" 2>/dev/null) || exit 0
[ -n "$cwd" ] || exit 0

systems="${VAULT_DIR:-$HOME/vault}/Systems"
[ -d "$systems" ] || exit 0

# A worktree's top level is the worktree folder, so take the name from the shared git dir.
common=$(git -C "$cwd" rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0
folder=$(basename "${common%/.git}")
remote=$(git -C "$cwd" remote get-url origin 2>/dev/null)
remote=$(basename "${remote%.git}" 2>/dev/null)

note=""
for name in $remote $folder; do
  lname=$(tr '[:upper:]' '[:lower:]' <<<"$name")
  for f in "$systems"/*.md; do
    base=$(basename "$f" .md)
    [ "$(tr '[:upper:]' '[:lower:]' <<<"$base")" = "$lname" ] && { note=$f; break 2; }
  done
  for f in "$systems"/*.md; do
    repo=$(awk '/^---$/{n++; next} n==1 && /^repo:/{sub(/^repo:[ \t]*/, ""); print; exit}' "$f")
    [ -n "$repo" ] || continue
    [ "$(tr '[:upper:]' '[:lower:]' <<<"${repo##*/}")" = "$lname" ] && { note=$f; break 2; }
  done
done
[ -n "$note" ] || exit 0

printf 'Vault note for this repo (%s). Facts recorded from past work here; treat them as context, and check anything you rely on:\n\n' "${note/#"$HOME"/\~}"
# Body only: the frontmatter is Obsidian metadata.
awk 'NR==1 && /^---$/{fm=1; next} fm && /^---$/{fm=0; next} !fm' "$note"
exit 0
