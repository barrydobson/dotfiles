---
name: til
description: Captures a hard-won, transferable lesson from the current session as one article in the Obsidian wiki at ~/vault/wiki, filed under the right topic with its hub index updated. Works from any repo. Use when the user says "/til", "TIL", "save this", "capture that", "write that up", "add that to the wiki" or "that took ages to work out", and offer it when something transferable has just been worked out. Do not use for one-off incidents whose fix lives in a commit, PR or ticket, or for daily logs and task notes.
---

# TIL

Capture one hard-won lesson, right after you learn it, as one wiki article.

Friction is the enemy. A lesson learned at 16:00 is worth writing at 16:01 and worthless by Friday, because by then the specific error string, the wrong turn you took, and the reason the obvious fix didn't work have all evaporated. So this skill is deliberately fast: gather, write one file, update two indexes, log, report. No research phase, no web lookups, no clarifying interview unless the lesson is genuinely too thin to be useful.

## Where this runs, and where it writes

**The lesson comes from wherever you are. The article always lands in the vault at `~/vault`.** This skill is user-level precisely because the lessons worth keeping get learned in work repos, not in the vault, and a skill that only exists in the vault can only capture what you learned in the vault.

So: `~/vault` is the target for every path below, and every command needs that prefix because the working directory is almost always some other repo. Nothing is written into the current repo. If the lesson is only about the repo you're standing in, it is an incident and step 1 will tell you not to file it at all.

Two things follow from being outside the vault:

- **Read `~/vault/wiki/CLAUDE.md` before writing the article.** In a vault session it loads on its own; from a work repo it does not. It holds the canonical tag list and the article format, and both matter in step 3.
- **The vault has to be reachable.** If a write to `~/vault` is refused, `permissions.additionalDirectories` in `~/.claude/settings.json` is missing `~/vault`. Say so rather than writing the article into the current repo as a consolation prize.

## 1. Work out what the lesson actually is

**If the user passed text**, that's the lesson. Use it as the spine, and enrich it from the session - the actual error message, the command that fixed it, the file paths - because a TIL that says "DNS was wrong" helps nobody, and one that quotes the exact `dial tcp: lookup ... no such host` and the `coredns` config line that caused it saves future-you an hour.

**If the user passed nothing**, mine the current conversation. Look for the thing that was hard: where you went round in circles, what the wrong assumption was, what the actual root cause turned out to be. That struggle is the value - the final one-line fix on its own is not a lesson, it's a diff.

Prefer specifics over summary throughout. Exact error strings, versions, flags, file paths, and the counter-intuitive bit. Generic advice ("check your config") is the failure mode here.

**Sanity check before writing.** The bar is transferability. Two questions settle it: would this help someone who has never seen this repo, and would it still be true in a year?

That rules out incidents, which is most of what a hard day produces. A bot re-triggering its own release, a sidecar breaking one app in preprod, a script that misfired once - those hurt, they got fixed, and the reasoning is already preserved in the commit, the PR, the ADR or the ticket. The repo remembers them. What belongs here is what survives being lifted out of that repo: a tool or technology understood for the first time, a process finding that holds generally, a durable behaviour that will bite again anywhere, a principle that changes how a class of problem gets approached.

"Stacked PRs don't survive a merge queue" is knowledge. "PR 431 got stuck" is not - and filing the second kind is how a wiki fills with things nobody ever reads again.

If what's offered is an incident, say so in one line and ask whether there's a general lesson underneath it - there often is, and it's usually the more interesting article. If it's genuinely thin, don't file it. Don't be precious though: when there's a real lesson there, write it.

## 2. Check it isn't already written

Search before creating, so you get one improving article per topic rather than four overlapping ones:

```bash
rg -il "<distinctive term>" ~/vault/wiki/
```

`rg` alone is unreliable here - the distinctive terms in a lesson are often either too common to filter or too specific to appear in an article title. So pick the likely topic folder (step 3) and skim its hub note as well: the hub notes carry a one-line description of every article in the folder, and scanning a couple of dozen of those catches the near-duplicates a keyword search misses. `wiki/_master-index.md` cannot answer this - it lists topics, not articles - so use it only to work out which topic to look in.

If a close article exists, extend it - add a section or bullets, and add or bump `updated:` in the frontmatter with today's real date from `date +%F`. Only create a new file when the lesson genuinely stands alone.

## 3. Write the article

Path: `~/vault/wiki/<topic-folder>/<Title Case Name>.md`

**Folder and tags are two separate decisions** - the two sets overlap but are not the same, so don't derive one from the other or you'll misfile things into a plausible-looking neighbour.

**Folder** - list the topic folders that actually exist and pick the closest:

```bash
ls -d ~/vault/wiki/*/ | grep -vE '(_resources|assets|logs)/$'
```

Those three are excluded because they are not topic folders: they carry no hub note and no tag, and an article filed into one is invisible to `Knowledge Base.base`.

Pick the most specific folder that exists. A Claude Code lesson belongs in `claude-code/`, not in the broader `ai-agents/`.

**Tags** - pick from the closed list in `~/vault/wiki/CLAUDE.md` under "Canonical Tags", never invent one.

Every topic folder has a matching tag, so the folder's own tag is always a valid starting point. The reverse does not hold: several tags are briefing subject areas with no folder at all, which is why the folder choice cannot be read off the tag list. `~/vault/wiki/CLAUDE.md` is the source of truth for which tags those are - read it rather than trusting a copy, because any list kept here goes stale the moment a topic folder is added, and a stale list misfiles articles.

So a Claude Code hooks lesson lands in `wiki/claude-code/` tagged `[claude-code]`, or `[ai-agents, claude-code]` if it genuinely spans both.

**When a lesson spans several topics** - and the good ones usually do - file it under the system whose behaviour *caused* the problem, not the system that was affected. You'll come looking for it the next time that system misbehaves, not the next time you happen to be in the affected one. Use `## Related` wikilinks to reach it from the other angles.

**Dates** - `created:` is today's real date. Get it, don't guess it:

```bash
date +%F
```

The "Recently Added" view in `Knowledge Base.base` sorts on this field, so a guessed date files a fresh article somewhere in the back catalogue where nobody will see it.

Template:

```markdown
---
type: til
tags: [canonical-tag]
created: YYYY-MM-DD
source:
  - internal
---

# <Title>

<One or two sentences: what you now know that you didn't this morning.>

## Key Takeaways

- The counter-intuitive bit, stated plainly
- The exact symptom, so future-you can grep for it
- The conclusion, in one line

## <Body sections - name them after the lesson, see below>

## Watch Out For

<Optional. The trap, adjacent gotchas, what you'd do differently.>

## Related

<Optional. [[Wikilinks]] to existing wiki articles.>
```

**The frontmatter, the `# Title`, `## Key Takeaways` and `## Related` are fixed. The body headings are yours to pick.** The fixed parts are what the Base views and the graph read, so changing them breaks things. Between Key Takeaways and Watch Out For, write whatever shape the lesson actually has:

- **Something broke and you worked out why** - `## What Happened` then `## Fix`. The symptom, what misled you, then the exact commands or config.
- **You understood a tool, technology or approach for the first time** - name the sections after the thing itself: `## The Three Tiers`, `## Socket Mode Acknowledgment`, `## Why It Came Up`, `## Why It Matters`. This is the more common shape, because the incident-shaped lessons mostly fail the transferability bar in step 1.

Forcing "What Happened / Fix" onto a lesson that was never an incident gets you a padded article with a fictional narrative in it, which is the opposite of the point.

Notes on the template:

- `type: til` is what separates your own hard-won lessons from compiled articles clipped off the web. It's a frontmatter field rather than a tag because the vault's tag list is closed and this is metadata, not a topic.
- **`source: internal` is the default, and it's in the template for a reason.** Most TILs are primary - you lived it, there is no source. Replace `internal` only where a real URL genuinely applies: the GitHub issue, the PR, the doc page that was wrong, the Stack Overflow answer that finally helped. Never invent one. A fabricated source is worse than no source because it sends future-you chasing a dead link. The field is never omitted either, because every wiki article needs one for the `Knowledge Base.base` Source column to render. See `~/vault/wiki/CLAUDE.md`.
- **`updated:` is only for articles you extend**, and it goes directly below `created:`. New articles don't carry it.
- Drop any section that would be empty. A three-line TIL that's all signal beats a padded one.
- Use `[[wikilinks]]` for anything that is or could be another vault note - this is what makes the graph work.

## 4. Update the indexes

An unlinked article is invisible to the hub-note navigation and to Obsidian's graph, so this step is what makes the capture actually pay off later.

**Topic index** - the hub note in that folder, tagged `[index, ...]` and named after the topic. Look it up rather than deriving it from the folder name, because the Title Case form isn't mechanical (`llm-infrastructure/` holds `LLM Infrastructure.md`, not `Llm Infrastructure.md`):

```bash
ls ~/vault/wiki/<topic-folder>/
```

Append a line, matching the format already used in that file:

```markdown
- [[Your Article Name]] — one-line description
```

**The other angle** - if step 3 made you choose between two systems, add a `## Related` line on the article for the one you didn't file it under, pointing at the new note. Obsidian's backlinks panel shows the connection either way, but only a real link puts it in the graph and in front of someone who is reading that article rather than hunting for this one. Skip it when there's no obvious counterpart article.

**Master index** - `~/vault/wiki/_master-index.md`. It no longer carries article counts; those come from embedded Base views that query the articles directly, so they cannot drift. Only touch it when you add a whole new topic, and then add a line under the right callout group.

**If no topic fits**, create the folder, a topic index tagged `[index, <tag>]`, and a new master index line. Rare - try hard to fit an existing topic first, because a wiki of one-article topics is just a folder of files.

## 5. Log it

Never edit the log by hand. Use the script, which picks the right year file and always appends:

```bash
~/vault/.claude/scripts/wiki-log.sh til "<Article Name>" <<'BODY'
- **Target**: `wiki/<topic-folder>/<Article Name>.md`
- **Action**: created | extended
BODY
```

## 6. Report back

One or two lines: what was captured, where it landed. Then get back to whatever you were doing - this skill interrupts real work, so it shouldn't linger.

Example: `Captured "CoreDNS NodeLocal Cache Stale Records" → wiki/kubernetes/, linked from [[Kubernetes]].`
