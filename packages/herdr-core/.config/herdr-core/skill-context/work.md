# /work inside herdr-core

The `/work` skill still owns the steps: read, decide, implement, review, PR. Inside herdr-core, this changes who does steps 3 and 4, and adds a review and fix round after step 4 and before step 5 opens the PR. You stay the coordinator: you hold the decisions, open the PRs and move the tickets. Run `hc --skill` once before the first start if you have not read it this session.

## Starting a child

Names are shared with every session on the machine, so use `<repo>-<id>-impl` and `<repo>-<id>-review`. hc accepts 1-32 characters of `a-z 0-9 - _ .`: lowercase the ticket key (`pi-2751`) and shorten the repo name if the whole name runs over.

**Implementer**, a Claude terminal:

1. Write the prompt to `${TMPDIR:-/tmp}/work/<repo>/<id>-impl-prompt.md` with the Write tool: the ticket key, the worktree path and branch, the human's answers from step 2, and "Implement this ticket following steps 3 and 4 of the `tote-issue-tracker:work` skill. Commit on the branch; pushing, the PR and the tracker are mine. Reply with status (DONE / BLOCKED), each criterion met or not met with its evidence, and rulings. Write your reply to `${TMPDIR:-/tmp}/work/<repo>/<id>-impl-report.md`, then `hc send <your $HC_TERMINAL_ID> \"<that path>\"`. Do the same after every later turn. Start no agents."
2. Start it in the worktree:

   ```sh
   hc run --bg --name <repo>-<id>-impl --cwd <worktree path> claude \
     --model <model> --permission-mode <mode> \
     "Read <prompt file> and follow it."
   ```

   - `--model` is always set; the child does not inherit yours. `sonnet` unless the ticket asks otherwise.
   - `--permission-mode` is this session's mode. An hc child starts in `default` and stops at its first edit without it. Never pass a mode more permissive than your own.

**Reviewer**, the `codex-reviewer` template, once the implementer reports DONE: after `/work` step 4, before step 5. The template carries the review contract, so the task names only the target and the intent:

```sh
hc run --bg --name <repo>-<id>-review --cwd <worktree path> codex-reviewer \
  "Review branch: git diff <base SHA>...HEAD. Intent: <ticket key and summary>."
```

Change nothing in the worktree while the reviewer runs: no edits, commits, resets or checkouts. Do side work in another worktree.

If `hc templates` lacks `codex-reviewer`, report BLOCKED: the herdr-core package is not stowed.

After either start, check `first_message.sent` in the JSON. If it is false, `hc read <name>` before anything else; never resend blindly. A start-up prompt on the screen (folder trust, an update) counts as `blocked`.

## Waiting

Wait with `hc wait --children any`, never sleep or poll. A report arrives tagged `<hc from="<t> <name>">`. The implementer's names a file: read it before acting. The reviewer's carries its findings inline. A `timeout` is a check-in: wait again.

- **`blocked`**: the child waits on a person, usually a permission prompt. Send "blocked in <name>: <what the screen asks>" to `reach` at once, if the request came over hc; nobody may be watching Herdr. Leave the child for the human and carry on with other tickets.
- **`error`** or **exited**: `hc read --lines 100 <name>`, and treat it as BLOCKED with what the screen shows.

## Fix round

Write the reviewer's open findings verbatim to `${TMPDIR:-/tmp}/work/<repo>/<id>-findings.md` and `hc send <repo>-<id>-impl "<that path>"`. One round; whatever stays open goes in the PR body.

## A /work request over hc

A request that arrives over hc carries the sender's address in `reach`: `<hc from="t3 lead" reach="hc send t3 when done or stuck">`. Send your step 2 questions and the final report there.

## Cleanup

Kill and remove a reviewer once its report is in hand, and an implementer once its PR is open. Leave a blocked or failed child alive and name it in the report. Remove only terminals you started.
