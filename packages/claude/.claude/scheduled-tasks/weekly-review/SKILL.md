---
name: weekly-review
description: Review the week just ended and promote its daily notes into the slower vault layers
---

Work in the Obsidian vault at `~/vault` through the `vault` MCP server (`mcp__vault__*` tools) for every read, listing, write and edit. All paths below are relative to `~/vault`.

**Review the week that just ended**, Monday to Sunday, not the current week. This runs Monday morning after `daily-log` has written Friday's and the weekend's notes, so the previous week is complete and every daily note exists. Do not review the day this runs on.

The point of this run is **promotion**. The review prose is secondary. Nothing else in the vault sweeps the slower layers, so if promotion does not happen here, the daily notes accumulate and everything above them goes stale.

## The run

1. Read every `Worklog/YYYY-MM/` note for the week that just ended.
2. Scan `Projects/` for movement, and `Systems/` for repos that came up more than once.
3. Write `Worklog/YYYY-MM/YYYY-MM-DD Weekly Review.md`, dated the Monday of the week reviewed, following `Templates/Weekly Review.md`.
4. Promote, per the table below. This is the step that has to happen.
5. Report what was promoted and where, and list anything left open.

## Promotion

Read the previous week's `Worklog/` notes, then move what has held up:

- Project context, status, a decision inside one project → `Projects/{name}/`
- Durable behaviour of one system → `Systems/{repo}.md`, as a bullet under `## Notes`
- A transferable lesson with no single system → `/til`
- A choice about tooling, workflow or the vault → `Decisions/YYYY-MM-DD-{title}.md`
- A repo linked more than once with no note yet → create `Systems/{repo}.md`

Every source gets exactly one roll-up, and no source is summarised in another source's tree. `Worklog/` rolls up weekly into the review note. `DailyNews/` rolls up monthly into the wiki. There is no briefings section in the review.

Read the week's briefings anyway, for one question only: does any story change a live project or a `Systems/` note? If it does, write it into that note and say so in the report. If nothing does, say nothing.

**First review of a new month.** Compile the month that just ended into a wiki article, the way `wiki/daily-briefings/March 2026 AI and DevOps Trends.md` was compiled:

1. Read every briefing in `DailyNews/{last month}/`.
2. Write `wiki/daily-briefings/{Month YYYY} AI and DevOps Trends.md`. Frontmatter: `tags: [daily-briefings]` plus the topic tags that actually earned a section, `created:` today, `source:` the list of briefing paths.
3. Open with `## Key Takeaways`, then one `##` section per subject that ran through the month. A subject with two mentions is not a section.
4. Link out to wiki articles that exist. Rule 1 applies: no dead links.
5. Add the article to the list in `wiki/daily-briefings/Daily Briefings.md`.
6. Log it with Bash: `~/vault/.claude/scripts/wiki-log.sh compile "{Month YYYY} AI and DevOps Trends"`.

Stay inside the briefings. The synthesis names what was reported, not what you think happened.

Work through every unresolved `> [!question] Worth a /til?` callout in that week's notes. Each one is either promoted or explicitly dismissed with a reason. That backlog reached three months once before.

**Never change a project's `status:` unless the week's notes say the project finished.** A status is a claim about the world, and `Projects.base` filters the Active view on it, so a wrong value hides live work. If a project looks done but the notes do not say so, write that in the review and leave the frontmatter alone.

**Only link to notes that exist, by bare note name.** A partial path such as `[[ec2-local-llm-dev-box/README]]` does not resolve. Project READMEs are the one exception, because `README` is not unique: write `[[Projects/{name}/README|{Project Name}]]`. Everything else gets backticks. See Rule 1 in the root `CLAUDE.md`.

Two rules:

- Leave anything still a one-off in the daily note. The test is whether it held up over the week, not whether it felt significant on the day.
- Stay inside the evidence. If a daily note records a question but never its answer, do not promote it and do not invent the resolution. Say it is still open.