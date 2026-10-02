---
name: knowledge-capture
description: |
  Capture valuable knowledge from a Claude session into Barry's Obsidian vault so it's
  searchable later. Use when the user says "capture this", "save this for later", "worth
  remembering", "log this", "keep this one", "that's useful, save it", "add this to the
  vault", "future me will want this", or similar. Also trigger after a non-trivial debug
  or investigation where the root cause, workaround, or gotcha would be valuable to find
  again in weeks or months. The user may pass freeform text describing exactly what to
  capture and where to scope it - respect that input over inferring from the transcript.
  Do NOT use for routine session summaries, code that was just written, or trivially
  Googleable facts - claude-mem handles general session recall.
---

# Knowledge Capture

Write durable knowledge from this Claude session into Barry's Obsidian vault, routed to
the right location so it's discoverable later via Obsidian search, graph view, and
wiki navigation.

## When this skill runs

Two modes, decided by the user's message:

1. **Freeform capture** - user provides text: *"capture: the reason the Istio sidecar
   was failing was X because Y"*. Take that content as authoritative. Do not invent
   or re-infer.
2. **Transcript capture** - user says *"save this"* / *"capture this investigation"*
   with no specific text. Scan the recent turns for the valuable finding (root cause,
   workaround, non-obvious discovery) and summarise it yourself.

If both are mixed ("capture what we just figured out about the SSL issue, specifically
the cert rotation part"), use the freeform hint to scope which part of the transcript
to write up.

## Judge what's worth saving

Only capture if it meets at least one of these bars. If none apply, tell the user
plainly that nothing worth keeping was found - do not write filler.

- Root cause identified after non-trivial investigation
- Non-obvious system behaviour, gotcha, or edge case
- Workaround with the reason it was needed
- "How X actually works" explanation that corrects a common misconception
- A hard-won decision with the reasoning behind it
- A reusable pattern, snippet, or framework worth reference later

**Do not capture:**

- Code you just wrote (the diff is the record)
- Session summaries of "what we did" (the git log is the record)
- Trivially Googleable facts
- Unresolved questions or in-progress work
- Anything the user has not confirmed is correct

## Gather context before writing

Run these commands to populate the frontmatter correctly. Capture the outputs and
use them verbatim in the YAML.

```bash
# Current working directory (what the user was working on)
pwd

# Project name - best-effort derivation
PROJECT_NAME="$(git -C "$PWD" rev-parse --show-toplevel 2>/dev/null | xargs -I{} basename {} 2>/dev/null)"
[ -z "$PROJECT_NAME" ] && PROJECT_NAME="$(basename "$PWD")"
echo "$PROJECT_NAME"

# Claude session ID - discover from the active transcript
# Transcripts live at ~/.claude/projects/<encoded-cwd>/<session-uuid>.jsonl
# The most recently modified .jsonl in the project dir is the current session.
ENCODED_CWD="$(echo "$PWD" | sed 's|/|-|g')"
TRANSCRIPT_DIR="$HOME/.claude/projects/$ENCODED_CWD"
SESSION_ID="$(ls -t "$TRANSCRIPT_DIR"/*.jsonl 2>/dev/null | head -1 | xargs -n1 basename 2>/dev/null | sed 's/\.jsonl$//')"
echo "${SESSION_ID:-unknown}"

# Today's date for filenames and frontmatter
date +%Y-%m-%d
```

If `SESSION_ID` ends up empty, set it to `unknown` in frontmatter rather than
omitting the field - keeps the schema stable.

## Route to the correct vault location

Vault root: `/Users/barrydobson/Library/Mobile Documents/iCloud~md~obsidian/Documents/Personal`

Decide the destination using this table. When uncertain between two, prefer the more
specific one.

| Content | Destination | Filename |
|---|---|---|
| Reusable reference knowledge (gotchas, how-things-work, patterns) | `wiki/<topic>/<Title Case>.md` | Descriptive title |
| Decision with reasoning, tied to a moment in time | `Intelligence/decisions/YYYY-MM-DD-<kebab-title>.md` | Dated kebab-case |
| Specific to an active project in the vault | `Projects/<ProjectName>/notes/<Title Case>.md` | Descriptive title |
| Debug war story or investigation not yet general enough for wiki | `Daily/YYYY-MM-DD.md` (append as callout) | N/A - daily note |

**Topic selection for wiki:** match against the existing folders in `wiki/` first
(`ls "<vault>/wiki"`). Only create a new topic folder if nothing existing fits, and
mention that you did so in the final report.

**Tag discipline:** wiki articles must use only the canonical tags defined in the
vault `CLAUDE.md`:

```
openclaw, kubernetes, aws, gitops, ci-cd, observability, security, ai-agents,
developer-tools, infrastructure, architecture, automation, knowledge-management,
reference, kafka, performance, testing
```

Do not invent new tags. If nothing fits, use `reference`.

## Frontmatter template

Every captured note uses this frontmatter. Preserve field order.

```yaml
---
tags: [<canonical-tag>, <optional-additional-tag>]
created: <YYYY-MM-DD>
source:
  - Claude session <YYYY-MM-DD>
session:
  id: <session-uuid-or-unknown>
  project: <project-name>
  cwd: <absolute-path-of-pwd>
---
```

If the session has a relevant external source (docs URL, GitHub issue, Stack Overflow
answer the user referenced), add those URLs to the `source:` list above the Claude
session line. The Claude session line is always present.

## Content format

For wiki articles:

```md
# <Title matching filename>

## Key Takeaways

- Bullet point, self-contained, with [[wikilinks]] where relevant
- Another bullet - each one should make sense in isolation

## <Section>

Main content. Concise. Bullets over paragraphs where possible.

## Related

- [[Linked Article]]
- [[Another Article]]
```

For `Intelligence/decisions/`:

```md
# <Decision title>

> [!important] Decision
> One-sentence summary of the decision.

## Context

What prompted this, what was on the table.

## Rationale

Why this option over the alternatives.

## Consequences

What this locks in, what it rules out.
```

For `Projects/*/notes/`:

```md
# <Note title>

Concise content. Link back to the project's `[[README]]` where relevant.
```

For `Daily/` appends, use a callout so the entry stands out:

```md
> [!note]- Captured knowledge - <short title>
> <content>
>
> *Session: `<session-id>` - cwd: `<pwd>`*
```

The foldable callout (`[!note]-` with trailing dash) keeps the daily note tidy.

## Write the file

1. Build the destination path from the routing table.
2. Check whether the file exists:
   - Wiki / project / decision files: if it exists, read first, then decide whether
     to append a new section or write a new file with a differentiated title.
   - Daily note: if it exists, append. If not, create with minimal frontmatter
     (`---\ntype: daily\ndate: <YYYY-MM-DD>\n---\n` then heading `# <YYYY-MM-DD>`)
     before appending the callout.
3. Use the Obsidian CLI if Obsidian is running, otherwise direct file write:
   ```bash
   # Prefer this if available:
   obsidian create name="<relative-path-without-.md>" content="..."
   obsidian append file="<relative-path-without-.md>" content="..."
   ```
   Fall back to standard Write/Edit tools when the CLI is unavailable or the path
   is outside Obsidian's index refresh.
4. Update backlinks: if the captured note fits naturally into an existing article's
   `## Related` section, add the wikilink there too. Do not force this.

## Obsidian conventions (reinforced)

- Title Case filenames with spaces, e.g. `Istio Sidecar Cert Rotation.md`
- Every project, person, or note reference uses `[[wikilinks]]`, never plain text
- Do not start the body with `# Title` when the filename already titles the note
  in Obsidian - the first `#` heading is only used for wiki articles where the
  filename and title should match visibly
- `==highlights==` sparingly for critical info
- `%%comments%%` for internal notes invisible in preview
- Keep articles concise - bullets over paragraphs

## Report back

After writing, tell the user:

- **File written:** absolute path
- **Type:** wiki / decision / project note / daily append
- **Tags applied:** comma-separated list
- **Obsidian URI to open it:**
  `obsidian://open?vault=Personal&file=<url-encoded-relative-path-without-.md>`

If you created a new wiki topic folder or added a backlink to an existing article,
mention that too.

## Anti-patterns

Do not:

- Save anything the user has not confirmed or asked for
- Duplicate information that is already in the vault - check first with `grep` or
  `obsidian search`
- Invent new tags outside the canonical set
- Write multi-paragraph prose when bullets carry the content
- Create orphan notes - always link from at least one existing note, even if that's
  just adding to the relevant `_index.md`
- Narrate the capture process in the written note itself ("Claude identified that...")
  - write the knowledge, not the meta-story
- Save to `wiki/` content that is still project-specific or time-bound - that goes
  in `Projects/` or `Intelligence/` instead
