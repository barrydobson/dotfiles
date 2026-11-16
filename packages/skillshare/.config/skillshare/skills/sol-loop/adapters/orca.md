# sol-loop adapter: Orca

`ORCA` is the Orca CLI: `orca` on macOS, `orca-ide` on Linux. For a receipt
this file does not cover, run `ORCA skills get orchestration --full` once and
follow it.

**Reply channel:** `worker_done` with the IDs from your preamble; outcome
`succeeded` with a verdict, `failed` with the reason when you could not review.

## Start

Orca's own Codex launch skips approvals, so open the reviewer yourself,
read-only, in your workspace. `<repo>` is the literal absolute path.

```
ORCA orchestration run-create --objective "sol-loop <branch>" --json
ORCA orchestration task-create --task-title "sol-<branch>" --spec "<round 1 brief>" --json
ORCA terminal create --worktree active --title sol-<branch> --command "codex -a never -c default_permissions=\"reviewer\" -c permissions.reviewer.extends=\":read-only\" -c permissions.reviewer.network.enabled=true -c check_for_update_on_startup=false -c projects.<repo>.trust_level=trusted" --json
ORCA terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json
ORCA orchestration worker-start --task <taskId> --terminal <handle> --worktree current --keep-open --json
```

Add `-m <id>` to the Codex command only if the user named a Sol version. Check
the model in the banner with `ORCA terminal read --terminal <handle>`. Save
`taskId`, the handle and `dispatchId`; the reviewer ID is `dispatchId`.

## Wait

End your turn. Orca wakes you with the reviewer's `worker_done`. Only outcome
`succeeded` carries a verdict; an escalation, `exited`, `lost` or `failed` is a
failure.

## On failure

`ORCA orchestration worker-stop --dispatch <dispatchId>`, then verify the stop
with `ORCA orchestration worker-show --dispatch <dispatchId>`. On
`stop_unknown`, report the blocker. Restart: a new task whose spec is the round
1 brief plus the ledger, in a new pane, as in Start. After two restarts, report
the blocker.

## Next round

```
ORCA orchestration send --to dispatch:<dispatchId> --subject "Round <n>" --body "<round body>"
```

Then end your turn. If the send is refused or the worker is gone, start a new
task with the same body, as in Start.

## End

`ORCA orchestration worker-release --dispatch <dispatchId>`. Follow its receipt
for `release_pending` or `release_unknown`.
