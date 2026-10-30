# Ticketing

Applies whenever you write an epic or tickets, from any skill (`to-spec`, `to-tickets`, or by hand). These rules override the skill where they conflict.

- **One repo per ticket.** Each ticket names exactly one repo and sets it as the Jira component. A vertical slice is vertical within one repo. A tracer that needs two repos is two tickets joined by a blocking link. A sweep across N repos is N tickets.
- **No component for the repo?** Say so in the quiz and ask. Never leave it blank silently, and never put in a guess.
- **Read the code first.** Before drafting, read every repo a ticket will touch. Start a read-only `hc` agent in that repo, or use an Explore agent. Never ticket a repo you have not read. A spec or vault note is not a substitute.
- **Size gate blocks publishing.** If a ticket might not fit one fresh context, split it before you publish. Never publish a placeholder as `ready-for-agent`.
- **One deliverable per ticket.** If the "What to build" needs a list of unrelated artefacts, or acceptance needs throwaway apps in other repos, split it.
- **The approval quiz shows the risk.** In the quiz `to-tickets` shows before publishing:
  - show the repo for each ticket;
  - list tickets flagged as large, multi-repo or unsure first;
  - offer splitting as an option, not just merging;
  - never recommend "approve as proposed" while your own warnings are open.
- **Epic component** is the repo that holds most of the work. If no repo does, say so rather than guessing.
