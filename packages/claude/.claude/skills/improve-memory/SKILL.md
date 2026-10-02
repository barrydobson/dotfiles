---
name: improve-memory
description: Reconciles and restructures this project's Claude Code memory (auto-memory files, CLAUDE.md and .claude/rules/). Merges duplicates, resolves contradictions, and proposes a thin CLAUDE.md with detail in path-scoped rules. Requires a session-analysis digest and stops without one. Use when a caller hands over candidate memories, or when the user runs /improve-memory or asks to tidy or restructure memory. For the full cycle, the user runs /dream.
---

# Improve memory

Take a set of candidate memories - normally the output of `/session-analysis dream` - and fold them into the memory this project already has, without leaving duplicates, contradictions or a bloated always-loaded file behind.

Two jobs, in order: **reconcile** what exists, then **restructure** it so each fact loads only when it is needed and lands where everyone who needs it will see it.

## 0. Take the candidates handed in

This skill reconciles; it does not gather. The candidates and the `session-analysis` digest they came from arrive with the invocation - `/dream` passes both, and a user running `/improve-memory` directly can give a digest path or paste an overview.

Nothing supplied: stop and say so, naming `/dream` for the whole cycle or `/session-analysis dream` to produce a digest to hand over. Don't sweep the transcripts here. A second sweep is slow, and it would leave the dedupe pass judging candidates against a different sample from the one that produced them.

Carried-forward items may arrive alongside: pending `[ ]` entries from the previous overview, with their original numbers and `(pending since ...)` markers. Keep both. A new candidate saying the same thing as a carried item merges into that entry under its existing number, taking the stronger evidence - never a second entry for the same fact.

Candidates are input, not truth. A candidate that contradicts a checked-in CLAUDE.md is a conflict to resolve, not a fact to write.

## 1. Gather what exists

Auto memory lives outside the repo, under `~/.claude/projects/<project>/memory/`. Take that path from the digest's `memory_dir` - `harvest.py` already derives it, keyed off the *main* worktree so every worktree of a repo shares one directory. Deriving it here instead gets it wrong from inside a worktree, where `git rev-parse --show-toplevel` is the worktree, not the repo.

`existing_memories` can reach wider than `memory_dir`: it lists memory files from every transcript directory for the repo, and `stray_memory_dirs` names the ones that sit outside the directory that gets written to. A memory in a stray directory is not "already covered" - nothing loads it. Report each as a finding and propose moving it into `memory_dir`, rather than quietly deduplicating a candidate against it.

Check for an override, because it beats `memory_dir` and changes where everything gets written:

```bash
for f in ~/.claude/settings.json ~/.claude/settings.local.json .claude/settings.json .claude/settings.local.json; do
  [ -f "$f" ] && jq -r --arg f "$f" '.autoMemoryDirectory // empty | "\($f): \(.)"' "$f"
done
```

Then read, in this order:

| Tier | Files | Loading |
| --- | --- | --- |
| Auto memory | `<memory dir>/MEMORY.md` plus its topic files | `MEMORY.md` every session (first 200 lines or 25KB); topic files on demand |
| Project | `./CLAUDE.md`, `./.claude/CLAUDE.md` | every session |
| Project, scoped | nested `CLAUDE.md` in subdirectories | when working under that directory |
| Project rules | `.claude/rules/**/*.md` | every session, unless the file has `paths` frontmatter - then only on matching files |
| Local | `./CLAUDE.local.md`, repo root only | every session, not checked in |
| User | `~/.claude/CLAUDE.md`, `~/.claude/rules/*.md`, and anything they `@`-import | every session, every project |

Find them:

```bash
rg --files --hidden --no-ignore-vcs --glob '!node_modules' --glob 'CLAUDE.md' --glob 'CLAUDE.local.md'
rg --files --hidden .claude/rules ~/.claude/rules 2>/dev/null
```

The paths in that table are exact, and a file one directory off the exact path is a different thing entirely: `.claude/CLAUDE.local.md` is not the Local tier, it is a dead file nothing reads. So the table tells you what each tier costs, never whether a given file is live. The observable for that is the `claudeMd` block in this session's own context: it names every file actually loaded, so a file the block omits is dead, whatever the table would suggest. Check the block before writing "always loaded" against anything, and report a dead file as a finding - a fact sitting in one is a fact nobody has been reading.

The user tier is one person's, and it loads in every repo they open, so it matters in both directions. A fact that genuinely holds across all their work, duplicated into this project, is a deletion from the project file - not the other way round. A fact about *this repo* that has ended up there is simply misfiled, and `## 3. Restructure` wants it promoted into checked-in project context instead. Either way, never edit a user-tier file unprompted - it lands in every project they open. Propose it in the overview and apply only the exact item the user has ticked, as `## 5. Apply` requires.

## 2. Reconcile

**Merge duplicates.** Same fact in two places: keep the copy in the tier with the narrowest loading scope that still covers every session that needs it, and delete the others. A fact repeated in the project CLAUDE.md and the user CLAUDE.md is one deletion from the project file. Two overlapping-but-not-identical entries merge into one that keeps the specifics from both - error strings, flags, paths, the why.

**Fix contradictions.** Two instructions that disagree get picked between arbitrarily at runtime, which is worse than either. For each pair, work out which is current from the evidence: the most recent session where the user said it, a git commit that changed the practice, or the tier (a project instruction is more specific than a user one). If the evidence settles it, rewrite the loser. If it doesn't, flag it - don't guess between two things the user has said.

**Delete what earns nothing.** A line a fresh session could reconstruct with `ls`, `cat`, or `--help` is dead weight in every session that loads it. Same for anything already true of the codebase, already in the git history, or scoped to a task that finished.

**Watch loading scope when merging.** A `.claude/rules/*.md` file with `paths` frontmatter, or a nested `CLAUDE.md`, is not in context by default. It cannot absorb a line from an always-loaded file unless that line only ever matters when working on those paths. Say so explicitly when a merge narrows scope.

## 3. Restructure

The target shape: a thin always-loaded CLAUDE.md that holds only what every session needs, with the detail in files that load conditionally.

- **Always-loaded CLAUDE.md**: build and test commands, project layout, conventions that apply everywhere, "always do X" rules. Target under 200 lines. Markdown headers and bullets, concrete enough to verify - "use 2-space indentation", not "format code properly".
- **Area-specific detail** goes to `.claude/rules/<topic>.md` with `paths` frontmatter, so it only enters context when Claude touches those files:

  ```markdown
  ---
  paths:
    - "src/api/**/*.{ts,tsx}"
  ---

  # API rules

  - All endpoints validate input at the boundary
  ```

  One topic per file, descriptive filename. Rules are discovered recursively, so `rules/frontend/` and `rules/backend/` are fine. A rule with no `paths` loads every session - same cost as CLAUDE.md, so only leave `paths` off when it genuinely applies everywhere.
- **Multi-step procedures** are a skill, not memory. A rule is a fact that constrains work; a procedure with steps and a trigger belongs in `.claude/skills/`, where it loads only when invoked or matched.
- **Detail behind the auto-memory index**: keep `MEMORY.md` to one line per memory and push the detail into topic files, which are read on demand.

**Promote what the team needs.** Auto memory and the user tier sit on one machine and help exactly one clone. A fact about *this repo* living there is the single most valuable thing this pass can catch: move it into a checked-in file - the project CLAUDE.md when every session needs it, a `paths`-scoped rule when only some do - so anyone who clones the repo gets it without being told. Go looking for these deliberately. Merging downwards is the easy half of the job and the half that changes least.

Keep the line honest, or the promotion becomes its own kind of bloat. Promote facts about the repo: the build incantation that actually works, the deploy gotcha, the convention the team keeps breaking, the reasoning behind a decision that is nowhere in the git history. Leave behind facts about the person: their tools, their shell, their phrasing preferences, paths on their machine. Checked in, those read as the project dictating how to work, and they cost every teammate context for nothing.

Promotion always asks (`## 5. Apply`), and the proposal names the destination file, the tier it came from, and whether the personal copy stays or goes - left in both places it is just the duplicate the next run will flag.

**Say the honest thing about `@` imports.** `@path` in a CLAUDE.md is expanded and loaded at launch, so it organises files without saving any context. If the goal is progressive disclosure, the mechanism is `paths`-scoped rules and skills, not imports. Only propose an import when the point is tidiness.

## 4. Write the overview

Write everything to `memory-improvement-overview.md` in the project root. Sections:

1. **Inventory** - every file found, its tier, its line count, and whether it is always loaded, checked against the `claudeMd` block rather than assumed from its path. Include the always-loaded total, because that is the number this exercise is trying to bring down, and count a dead file as zero.
2. **Applied** - what was changed without asking, one line each, with the file.
3. **For approval** - each proposal as a numbered checkbox: what changes, which files, the evidence, and what it costs or saves in always-loaded lines.

   ```markdown
   - [ ] 1. Move the delta/bat notes out of CLAUDE.md into `.claude/rules/shell-tools.md`
         paths: `packages/zsh/**`, `packages/git/**` - saves 9 always-loaded lines
         evidence: only ever came up while editing those packages (3 sessions)
   ```

   The checkbox is the approval mechanism and the state: the user ticks `[x]` to approve, `[-]` to reject, and whatever applies it appends `(applied YYYY-MM-DD)` to the line. So a `[x]` without an `applied` stamp is approved-but-not-yet-done, and nothing needs to track that separately. Carried-forward items keep the number they already had, plus their `(pending since YYYY-MM-DD, run N)` marker, and new proposals take numbers after them - "do 1, 3 and 5" has to mean the same items across a rewrite.
4. **Conflicts needing a decision** - contradictions the evidence didn't settle, both sides quoted with where each came from.
5. **Rejected candidates** - one line each, saying why (derivable from the repo, already covered, one-off).

The file is a working document, not a commit artefact. Add `memory-improvement-overview.md` to `.gitignore` before writing it, creating the file if the repo has none.

## 5. Apply

**Auto-apply, no asking** - reversible, and no judgement call about intent:

- Deleting a duplicate that is word-for-word covered by a broader tier.
- Repairing `MEMORY.md`: missing or stale index lines, entries pointing at files that no longer exist, trimming it back under the 200-line / 25KB limit by moving detail into topic files.
- Deleting a memory whose subject the user has explicitly corrected since, where the correction is unambiguous.
- Fixing broken `@` import paths and dead file references.
- Adding accepted candidates as new memory files in the memory directory, with the `MEMORY.md` pointer.

**Always ask** - everything else, including all of:

- Moving content between tiers, or into a new `.claude/rules/` file.
- Any new or reworded instruction in a checked-in file, since that changes behaviour for the whole team.
- Any deletion where the fact is not covered elsewhere.
- Every contradiction the evidence didn't settle.
- Anything in the user tier or in `~/.claude/rules/`.

Auto-applied edits to checked-in files still land in the working tree, so show `git diff --stat` for them and say plainly that they are uncommitted. Never commit from this skill.

Finish with a count: N applied, M awaiting approval, and the always-loaded line count before and after.

## 6. Apply-only mode

Invoked as `--mode apply` - the back half of the `/dream` loop, once the user has reviewed an overview. Apply what is already ticked and nothing else: no candidates needed, no reconcile, no restructure, and no rewrite of the overview beyond stamping the lines that got applied.

The apply rules live here rather than in the caller so that they hold whichever way this skill is reached. A caller applying ticked items itself would be running them without any of this.

- Apply every `[x]` item with no `(applied YYYY-MM-DD)` stamp, then append the stamp to its line.
- The tick is the approval, user-tier items included. Apply exactly the item as written and nothing adjacent - it approves that proposal, not a tidy-up of the file the proposal lives in.
- Ask before applying an item whose target file has changed since the overview was written, because the proposal may no longer describe what is there.
- `## 5. Apply`'s closing rules still hold: show `git diff --stat` for checked-in files, say plainly that they are uncommitted, never commit.
- Nothing ticked: say exactly that and change nothing.
