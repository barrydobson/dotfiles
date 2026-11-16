---
name: sol-loop
description: Review a working-tree change with GPT Sol in a loop until it approves. Use when the user says "sol loop".
---

# sol-loop

Hold every fix to the smallest change; push back on findings you can show are
wrong.

## Budget

- Default: 3 rounds total.
- Extend to 5 only for security, permissions, auth, data loss, or
  state/concurrency, while a blocker or should stays open with evidence. Or when
  the user asks.
- Keep a ledger: id, severity, outcome, usage if returned. Never guess it.

## 1. Scope

Run `git status --short`. Do not stash, discard, or include unrelated
changes. Limit review to the change paths if they separate cleanly.
Otherwise stop and ask.

Find the base after `git fetch origin`:

- PR: `gh pr view <n> --json baseRefName,headRefOid`. Check out the branch
  only if clean. Confirm `HEAD` is the PR head, or ahead only by this
  change. Base: `git merge-base HEAD origin/<baseRefName>`.
- Local: `git merge-base HEAD origin/<default-branch>`. No remote: a base
  the user names, or `HEAD` for uncommitted changes only.

The change is base to working tree in those paths, with untracked files.
Use one diff command all rounds. State intent and out-of-scope in 1-2
sentences. Run covering checks. Do not send code this change breaks. Note
missing or pre-failing checks in the brief.

## 2. Start Sol

Read the one adapter for where you run. It says how to start, follow up,
wait for and end the reviewer, and its reply channel.

- `$HC_TERMINAL_ID` is set: [`adapters/herdr-core.md`](adapters/herdr-core.md).
- `orca worktree current --json` (`orca-ide` on Linux) succeeds:
  [`adapters/orca.md`](adapters/orca.md).
- Neither: use a native Sol subagent and keep its ID; its final message is
  the reply channel. In Claude Code, use a custom subagent only if it is set
  up to run Sol. If no route runs Sol, report the blocker.

In every harness:

- One reviewer for the whole loop: async, read-only, and followed up by its
  saved ID.
- Pick the latest Sol unless the user named a version. Do not hardcode an
  ID. If the reviewer is not Sol, report the blocker. Do not substitute a
  model. Record provider, model, and effort only if exposed.
- Do not edit scoped files while review runs. Wait for the reply; do not
  poll. Timeout, error, exit, or no reply is not approval. On failure,
  cancel, verify stop, restart with the ledger.

Round 1 brief (the reviewer gets no history beyond it):

```
Review only, per ${CLAUDE_SKILL_DIR}/reviewer.md. Reply via: <adapter's reply channel>.
Repo: <repo> Base: <sha> Paths: <paths or "all">
Intent: <intent> Out of scope: <scope> Checks: <results>
See: git diff <base> [-- <paths>]; git status --short (read untracked).
```

## 3. Answer findings

Check each finding and severity yourself. Another path, rare case, or
small cost is a nit, whatever label it came with.

- Agree: smallest fix. Prefer delete or narrow over new lock, cache,
  helper, or option. Fix the case that happened. Add one focused test
  that fails without the fix, if intent needs it.
- Disagree: say why, with evidence (file:line, test, output).
- Out of scope or nit: decline in one line. List as follow-up.

Update the ledger. Re-run checks and `git diff --shortstat <base>`. If
review grew the diff, cut first. Do not agree just to end the loop.

## 4. Next round

Follow up the saved reviewer ID through the adapter. Send the round 1 brief,
the ledger (`fixed:` / `disagree:` / `declined:` + evidence), the same base
diff, and the change since last round. If the reviewer is gone, start a new
one with the ledger.

## 5. Stop and ship

After each round, decide:

- **Next round:** budget remains and a blocker or should is open, behavior
  code changed, or approval does not cover the current behavior diff.
- **Stop early:** the round returned only nits. Declined nits and comment,
  doc, or format-only fixes need no new round.
- **Agreed:** APPROVE on the current behavior diff, no blocker or should
  open, no concern of your own.
- **Stuck:** an item stays disputed after two replies, or budget ends. Show
  both sides in 2-3 lines each. The user decides. Budget end is not approval.

End the reviewer through the adapter once the loop stops.

Do not push during the loop. Push after agreement only if the user asked
to push, ship, or update the PR. If you push to a PR, add above the model
blurb:

`Reviewed with sol-loop: <N> rounds with <model>. Sol verdict: approved`.

Add `on <effort>` only if verified.

Report: rounds, model, what Sol changed, diff size before/after, fixed and
declined findings with reasons, usage if exposed (else say not), pushed or not.
