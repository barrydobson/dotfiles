# sol-loop adapter: herdr-core

**Reply channel:** `hc send` to the address in the `reach` of the task
message.

## Start

Start the reviewer from the `sol-loop` template, in the background, from the
repo root:

```
hc run sol-loop --bg --name sol-<branch> "<round 1 brief>"
```

The template launches a read-only Codex. Save the terminal address it prints;
it is the reviewer ID. Check the model in the banner with `hc read <t>`.

## Wait

The reply arrives as an `hc send` message headed `VERDICT:`. An exit note is a
failure.

## On failure

`hc kill <t>`, confirm it stopped with `hc get <t>`, then start a new one as in
Start, with the ledger added to the round 1 brief.

## Next round

```
hc send <t> "<round body>"
```

If the terminal is gone, start a new one as in Start, with the ledger added to
the round 1 brief.

## End

`hc kill <t>`.
