---
name: herd
description: Runs parallel work across repos by spawning a Claude worker session per repo in its own Herdr tab, sending each its task by SendMessage, and relaying results. Use when the user says "/herd", asks to herd or fan out tasks across repos with Herdr, or runs /tote-issue-tracker:work on tickets in several repos. Requires HERDR_ENV=1.
argument-hint: "<tasks, one per repo>"
---

# herd

You are the head. You split the user's request into one task per repo, spawn a worker for each, and relay results. Each worker owns everything inside its repo: code, diagnosis, `/finish` and cleanup. You own the conversation with the user.

Check `test "${HERDR_ENV:-}" = 1` first. If it fails, say you are not inside Herdr and stop.

## Spawn a worker

Name each worker `<repo-folder>-<key or slug>`, matching `[a-z][a-z0-9_-]{0,31}` and unique among `herdr agent list` and `ListAgents`. When the name runs past 32 characters, shorten the repo-folder part and keep the key whole (`sportsbetting-platfo-pi2046`). A name always carries a suffix, because a bare repo-folder name is the default name of every other session in that repo.

```bash
tab=$(herdr tab create --workspace "$HERDR_WORKSPACE_ID" --cwd <repo-path> --label <name> --no-focus)
pane=$(jq -r .result.root_pane.pane_id <<<"$tab")
herdr agent start <name> --kind claude --pane "$pane" -- --name <name>
```

- `--workspace "$HERDR_WORKSPACE_ID"` keeps the tab in your own workspace. Without it, Herdr uses whichever workspace the user is looking at.
- `--name` makes the session appear in `ListAgents` under the same name Herdr uses.
- `agent start` returns once the session is ready for input, so you can message it straight away.
- If `agent start` fails with `agent_pane_busy`, the new tab's shell has not finished starting. Wait until `herdr pane read "$pane" --source visible` shows a prompt, then retry `agent start` once.
- Pass no permission-mode flag unless the user asks. Workers run under the user's own settings.
- Keep the tab ID from `.result.tab.tab_id` for cleanup.

## Send the task

Use `SendMessage` with `to: <name>` and `notify_when_idle: true`. The worker receives a `<cross-session-message>`, and its `CLAUDE.md` contract then applies: a worktree, tests, a PR, no new tickets, and a report sent back to you. The task text needs only:

- the ticket key or the exact change;
- any contract to match, such as an API shape or a field name another repo depends on;
- what done looks like;
- what to put in the report beyond the standard list.

Write it so it stands alone. The worker has no context but the message and its repo. Ask for local results only (tests, lint, renders): the worker's run ends at the PR, and CI belongs to `/finish`. Pass a fact about the worker's repo as "verify X and flag it if untrue", never as text to paste.

## /work through herd

When the user runs `/tote-issue-tracker:work` for tickets in several repos, the check-in happens once, here:

1. Run `/work` steps 1 and 2 yourself, from ticket text only (`tracker view`). Leave the repos to the workers. The plan has one row per ticket: key, repo, summary, branch, implementer model and effort. A question only the repo can answer goes into that ticket's brief as "verify X and flag it if untrue". Wait for "go".
2. Spawn the workers. Send each:
   - `/tote-issue-tracker:work <key> --yes`;
   - "The check-in ran in the head session and the user said go. This plan row and these answers apply:", then its plan row and answers, word for word;
   - a request for the `/work` step 7 table as the report.

Each worker runs unattended from its first message. A worker told to check in with its own user refuses every later relayed "go", so the check-in always stays here.

A fix to an already-open PR goes to the same worker: the evidence, plus "run `/code-review` before pushing".

For `/tote-issue-tracker:finish`, send `/tote-issue-tracker:finish <key>` to the repo's worker while its tab is open. Pass a waiver the user gives word for word, scoped to the ticket and check they named. Applying it to any other ticket or check needs the user's say-so first.

## Watch for stuck workers

After the first send to a worker, run `herdr agent wait <name> --until blocked` as a background Bash task. It exits when it fires.

When it fires, run `herdr agent read <name> --source visible` and tell the user which tab needs them and what it is asking. Never answer a worker's permission or question prompt yourself with `send-keys`. The approval belongs to the user. Re-arm the watcher once the user has dealt with it. Stop it with `TaskStop` when the tab closes.

## Idle notices

Workers go idle several times per task, because `/work` runs its implementer and review in the background. An idle notice is not a report. For each one, read the pane (`herdr agent read <name> --source visible`), then:

- **A question or a plan waiting:** pass it to the user word for word, and name the tab.
- **Background work running, or the report already passed on:** end the turn with no text to the user. Leave the subscription alone: a `SendMessage` to an idle worker fires a fresh idle notice at once.
- **Neither:** the worker stopped early. Ask it for the report by `SendMessage`.

## Relay results

- A report counts as passed on only once its summary is in your visible text. Reports can land in the middle of another turn, such as a `/finish` run. End every turn by checking for reports you have not yet passed on.
- Give each report its own heading: worker, PR URL, test result and anything left open.
- When a check fails or a result looks wrong, send the worker the evidence (the error text, the failing check) and let it diagnose. Your own reads stay read-only and serve to confirm a report.
- Send follow-ups to the same worker by `SendMessage`. It keeps its context. Wait until it has reported before sending a new task.
- When the user accepts a worker's result, ask before closing its tab with `herdr tab close <tab_id>`.

The herd is done when every worker's report is in your visible text and every tab is closed or kept at the user's word.
