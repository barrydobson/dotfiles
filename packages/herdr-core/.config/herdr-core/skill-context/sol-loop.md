# sol-loop inside herdr-core

This session runs inside herdr-core. Run the Sol reviewer as an hc terminal the user can watch, not a native subagent.

- **Start**: from the repo root, `hc run sol-loop --bg --name sol-<branch> "<round 1 brief>"`. The name is the reviewer ID. hc accepts 1-32 characters of `a-z 0-9 - _ .`, so lowercase and shorten the branch if needed. Check the model in its banner with `hc read <name>`.
- **Wait**: `hc wait --children any`; never sleep or poll. The reply arrives as an hc message starting `VERDICT:`. An exit, `error` or `timeout` with no verdict is not approval.
- **Next round**: `hc send <name> "<round body>"`. If the terminal is gone, start a new one with the ledger added to the brief.
- **On failure**: `hc kill <name>`, confirm it stopped with `hc get <name>`, then start a new one with the ledger.
- **End**: `hc kill <name>` once the loop stops.
