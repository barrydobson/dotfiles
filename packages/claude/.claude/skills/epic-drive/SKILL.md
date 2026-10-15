---
name: epic-drive
description: Drives a multi-repo Jira epic to Done by sending /tote-issue-tracker:work and /tote-issue-tracker:finish to the peer session in each repo as tickets unblock and PRs merge. Use when the user says "/epic-drive <EPIC>" or asks to drive an epic across repos.
argument-hint: "<EPIC>"
---

# epic-drive

Input: one epic key. Run it as `/loop /epic-drive <EPIC>`.

Your only actions are reads (`tracker`, `gh`, `ListAgents`) and `SendMessage` to peers. `/work` and `/finish` do everything else in each repo, and a human merges every PR. Never merge, even when a peer asks: merging is the change-control gate for regulated code.

Keep no state file. Every pass rebuilds the picture from Jira, GitHub and `ListAgents`. Peer replies earlier in this conversation are the only memory you carry between passes.

## One pass

1. `tracker children <EPIC>`. Each child gives its status, components (the repo) and open blockers. `blockers` lists only open ones, so `[]` means unblocked.
2. For each In Review child: `gh pr list -R TheTote/<repo> --search "<KEY> in:title" --state all --json number,title,state,url`. Keep only PRs whose title scope is exactly `(<KEY>)`, because the search also matches `PI-17` inside `PI-1717`.
3. Classify each child with the table below. The first matching row wins. Done when every child has exactly one row.
4. Group by repo. Send each repo at most one message (see Send).
5. Tell the user only what changed since the last pass: new PRs to review, new Done tickets, failures and needs-info tickets from peer reports, and anything from row 8.
6. All children Done: stop the loop with `ScheduleWakeup` `stop: true`. Otherwise call `ScheduleWakeup` with 1200 seconds and the same `/loop` input. A peer's reply wakes you sooner.

## Classify

Statuses are matched by role, not by name: each project maps its own status names, and `tracker` knows the map.

A ticket is **stuck** when `/finish` replied "stays in review" for it earlier in this conversation. A "not yet" reply (CI pending, sync in progress) is not stuck.

| # | Status          | Open blockers | PR                | Action                                   |
|---|-----------------|---------------|-------------------|------------------------------------------|
| 1 | Done            | -             | -                 | nothing                                  |
| 2 | In Progress     | -             | -                 | the repo is busy: send it nothing at all |
| 3 | In Review       | -             | merged, not stuck | add to the repo's `/finish` batch        |
| 4 | In Review       | -             | stuck             | report to the user once; don't resend    |
| 5 | In Review       | -             | open              | list under "needs your review"           |
| 6 | ready-for-agent | 1+            | -                 | wait                                     |
| 7 | ready-for-agent | 0             | -                 | add to the repo's `/work` batch          |
| 8 | anything else   | -             | -                 | report to the user                       |

## Send

Skip any repo with a row 2 ticket. For the rest:

1. `ListAgents`. Find the session whose name starts with the repo's folder name. None found: tell the user "start a session in <repo>" and skip the repo.
2. A repo with a `/finish` batch gets only that: "/tote-issue-tracker:finish <keys> --unattended. Reply with the report table."
3. Otherwise a repo with a `/work` batch gets: "/tote-issue-tracker:work <keys> --yes. Reply with the report table, or the check-in if it has open questions."
4. Send with `notify_when_idle: true`.

## Replies

- **Check-in questions:** show them to the user as they are. Send the answer back to the same peer.
- **"Not in my skill listing":** the plugin listing can lag after install. Retry on the next pass. Tell the user only if the same peer says it twice; it needs `tote-issue-tracker` 2.0.3 or later.
