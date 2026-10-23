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

Use `SendMessage` with `to: <name>`. Do not set `notify_when_idle`: the worker's report arrives as its own message, and idle notices only cost the user turns. The worker receives a `<cross-session-message>`, and its `CLAUDE.md` contract then applies: a worktree, tests, a PR, no new tickets, and a report sent back to you. The task text needs only:

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

## Stuck workers

Herdr notifies the user directly when an agent in another tab needs input, so a worker stuck on a permission prompt reaches the user without you. Never answer a worker's permission or question prompt yourself with `send-keys`. The approval belongs to the user.

## Quiet workers

With no idle subscription, a worker that stops without reporting stays silent. When the user asks after one, or a worker has been quiet well past its peers, read its pane (`herdr agent read <name> --source visible`):

- **A question or a plan waiting:** add it to the waiting-on-you block, and name the tab.
- **Background work running:** say so in one line.
- **Neither:** the worker stopped early. Ask it for the report by `SendMessage`.

## Park out-of-scope findings

Workers and your own reads turn up problems outside the tickets in flight. Do not offer a ticket or a fix for each one as it lands, because every offer becomes another open question. Add it to a parked list instead: one line each, with the repo and the evidence. Mention a new entry in one line in the turn it arrives. Offer the whole list once, when the herd is done, so the user can triage it in one go.

The exception is a finding that makes in-flight work unsafe to merge or deploy. Raise it at once as a waiting-on-you item.

## Relay results

- A report counts as passed on only once its summary is in your visible text. Reports can land in the middle of another turn, such as a `/finish` run. End every turn by checking for reports you have not yet passed on.
- Give each report its own heading: worker, PR URL, test result and anything left open.
- When a check fails or a result looks wrong, send the worker the evidence (the error text, the failing check) and let it diagnose. Your own reads stay read-only and serve to confirm a report.
- Send follow-ups to the same worker by `SendMessage`. It keeps its context. Wait until it has reported before sending a new task.
- When `/finish` reports Done for every ticket a worker holds, and nothing else is queued for it, close its tab with `herdr tab close <tab_id>` and say so in one line. Keep the tab only when a ticket stays in review or the user asked to keep it.

## Waiting on you

End every turn that leaves anything for the user with this block, always last:

```markdown
## Waiting on you
- **Q1** PI-2201: merge PR #19236? Cutover drops compliance dashboards for up to 10 min.
- **Q2** Raise a ticket for the parked Flux managedFields sweep?
```

- Number questions once and keep the number until the question is answered. Never renumber, so "Q2 yes" stays unambiguous.
- Drop an item when the user answers it, and list every item still open, not only new ones.
- Ask questions only here, never mid-report in prose.
- One line per item: the ticket or tab, the decision, and the risk if there is one.

The herd is done when every worker's report is in your visible text, every tab is closed or kept at the user's word, and the parked list has been offered.
