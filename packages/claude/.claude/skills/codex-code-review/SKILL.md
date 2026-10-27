---
name: codex-code-review
description: Gets an independent code review from a Codex agent (currently Terra) through `claudex -p`, then verifies its findings before reporting them. Use when the user asks for a Codex, Terra or second-opinion review of a PR, branch or uncommitted diff, or when a workflow wants a reviewer from a different model family than Claude.
---

# Codex code review

Hand a review to Terra, a Codex model reached through the local API proxy, and bring back only the findings that survive verification. Terra is a second pair of eyes from a different model family. Its value is that it does not share your blind spots, so keep the brief unanchored.

## 1. Pin the target

Settle exactly what is under review before writing the brief. Run `git fetch origin` first so the base is current.

- **PR**: the number and repo. Terra reads it with `gh pr diff <n>` and `gh pr view <n>`.
- **Branch**: base is `git merge-base HEAD origin/<default-branch>`, as a SHA. Terra reads `git diff <base-sha>`, which includes uncommitted changes.
- **Uncommitted work only**: `git diff HEAD`.

Untracked files do not show in any diff. List them from `git status --short` in the brief.

Done when you have one command that prints the full diff against a fixed base.

## 2. Run the checks

If the change is checked out, run the repo's covering checks (the tests and linters its `CLAUDE.md` or CI names). Record each result in one line for the brief. Note checks that are missing or were already failing on the base.

Done when every check has a recorded result, or the brief states why none ran.

## 3. Write the brief

Write the brief to a temp file (`mktemp`), never inline in the shell command. It contains:

- The repo path, the diff command from step 1 and the untracked files.
- The intent in one or two sentences: the ticket's acceptance criteria or the PR description, if one exists.
- The check results from step 2.
- Any focus area the user named.
- The output contract, verbatim:

```text
You are the reviewer. Read the diff, then read the surrounding code it touches.
Find bugs, security holes, data loss, broken callers and mismatches with the intent.
Skip style unless it hides a bug. Hold the change to the smallest that meets the intent:
flag code, tests or guards the intent does not need.
Severity: blocker = the intended case is wrong. should = a real bug callers will hit, within the intent.
nit = everything else, including other paths, rare cases, small performance costs and extra compatibility.
Reply in exactly this format:
VERDICT: APPROVE or CHANGES
T1 [blocker|should|nit] <file>:<line> <defect in one sentence>. Trigger: <input or state>. Fix: <suggestion>
Number findings T1, T2, ... in order. With no findings, reply only "VERDICT: APPROVE".
```

Leave out your own view of the change. A brief that carries your conclusions gets them confirmed back.

## 4. Run Terra

`claudex` is a zsh function, not a binary, so source it first. Run from the repo root:

```bash
source ~/.config/zsh/aliases/apiproxycli.zsh
claudex -p \
  --allowedTools "Read Grep Glob Bash(git diff:*) Bash(git log:*) Bash(git show:*) Bash(git status:*) Bash(gh pr diff:*) Bash(gh pr view:*)" \
  --disallowedTools "Skill" \
  < "$brief" 2>/dev/null
```

The allowlist keeps Terra read-only. The Skill tool is outside the allowlist's reach, so it needs the explicit deny; without it Terra can recurse into this skill. Use the Bash tool's 600000 ms timeout; large diffs take minutes.

A timeout, an error, an empty reply or a reply without a `VERDICT:` line is not approval. The proxy at `localhost:8317` is the usual cause. Report the failure to the user rather than reviewing the change yourself and labelling it Terra's.

## 5. Verify and report

Terra's output is a claim, not a result. For every finding, open the cited code, check the trigger is real, and check the severity against the definitions in the brief. A finding on another path, a rare case or a small cost is a nit, whatever label it came with.

Report Terra's verdict, then each finding by its ID with your verdict: **confirmed** (you reproduced the reasoning against the code), **plausible** (could not rule it out), or **rejected** (with the one-line reason). Done when every finding carries a verdict.
