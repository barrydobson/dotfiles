# /work inside herdr-core

How to start, reach and wait on any agent `/work` starts here. Who does which step is not set here: the `/work` skill and the instructions of the folder you run in decide that. Run `hc --skill` once before the first start if you have not read it this session.

## Starting a child

Names are shared with every session on the machine, so use `<repo>-<id>-<role>`, for example `tfmod-pi-2751-impl`. hc accepts 1-32 characters of `a-z 0-9 - _ .`: lowercase the ticket key and shorten the repo name if the whole name runs over.

A Claude child:

```sh
hc run --bg --name <name> --cwd <path> claude \
  --model <model> --permission-mode <mode> \
  "<task>"
```

- `--model` is always set; the child does not inherit yours.
- `--permission-mode` is this session's mode. An hc child starts in `default` and stops at its first edit without it. Never pass a mode more permissive than your own.
- The task arrives as typed, with no sender address. Put the reply address in it: "report with `hc send <your $HC_TERMINAL_ID>` when done or stuck".
- A long task goes in a file under `${TMPDIR:-/tmp}/work/<repo>/`, written with the Write tool; the task is then "Read <file> and follow it." Ask for a long reply the same way: written to a file there, its path sent with `hc send`, after every turn.

A template child, such as `codex-reviewer`, carries its own contract, so the task names only the target and the intent. If `hc templates` lacks the template, report BLOCKED: the herdr-core package is not stowed.

After any start, check `first_message.sent` in the JSON. If it is false, `hc read <name>` before anything else; never resend blindly. A start-up prompt on the screen (folder trust, an update) counts as `blocked`.

## Waiting

Wait with `hc wait --children any`, never sleep or poll. A report arrives tagged `<hc from="<t> <name>">`. If it names a file, read the file before acting. A `timeout` is a check-in: wait again.

- **`blocked`**: the child waits on a person, usually a permission prompt. If your own task gave a reply address, send "blocked in <name>: <what the screen asks>" there at once; nobody may be watching Herdr. Leave the child for the human and carry on with other tickets.
- **`error`** or **exited**: `hc read --lines 100 <name>`, and treat it as BLOCKED with what the screen shows.

## A /work request from another agent

If your task names a reply address, send your step 2 questions and the final report there, not to `AskUserQuestion`.

## Cleanup

Kill and remove a child once you no longer need it. Leave a blocked or failed child alive and name it in the report. Remove only terminals you started.
