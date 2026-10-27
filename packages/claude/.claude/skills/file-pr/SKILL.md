---
name: file-pr
description: File a concise pull request with a problem-first body, evidence and merge risk. Use when the user asks to file, open, raise or create a PR, or to write a PR title or body.
---

# File PR

## Before filing

1. Check whether a PR for this branch already exists (`gh pr view`). If it does, update it rather than opening another.
2. Review the diff against the base branch (usually `origin/main`). Make sure it matches the goal and contains nothing unrelated.
3. Find the ticket key (Jira, for example `PLAT-123`) from the branch name or conversation. If there is none, ask.

## Title

PRs are squash-merged, so the title becomes the commit message on `main`. Use a conventional-commit title, following recent merged PRs and `git log` for scope and style. Say why the change matters, not how it works:

BAD

> ❌ perf(server): negotiate permessage-deflate on the websocket

GOOD

> ✅ perf(server): cut websocket frame size by 70%+ with gzipping

## Body

Skip preambles and keep prose short. Never name a person; describe the role. If the repo has a `GLOSSARY.md`, use its terms.

```markdown
<Problem in one or two plain sentences, then the fix in one.>

<Ticket key>

## Evidence

**Before:** <failing test, output or screenshot>
**After:** <passing test, output or screenshot>

## Risk

**Door:** <one-way or two-way>. **Blast radius:** <one word>
<Only if needed: what could break and how to roll back.>
```

- **Problem first.** Base it on the user's original prompt. Do not lead with a list of what changed:

  BAD

  > ❌ Removed implicit workspace carry-over from every "new thread" entry point (cmd+n, sidebar buttons, command palette). Deleted buildContextualThreadOptions and the seed-context machinery.

  GOOD

  > ✅ The "new worktree" default was ignored when starting threads on existing worktrees. Now the configured defaults always apply.

- **Optional picture.** Add one only when it makes the point faster than prose: pseudocode, a call tree, a file tree, a Mermaid diagram, or a `diff` of one of those. Pick the smallest view that works. Most PRs need none.
- **Evidence.** Show the exact test or command that failed before and passes now. A screenshot is best for visual changes. If there is no evidence, say why.
- **Risk.** A two-way door can be rolled back cheaply. A one-way door cannot: data migrations, deletions, public contract changes, anything customer-facing that cannot be undone. For a one-way door, always describe the rollback or mitigation. Blast radius covers consumers, other services, environments and customers.
- **Scale to the change.** A one-line fix gets one sentence of problem, one line of evidence and `Door: two-way. Blast radius: none`.

## Submit

Before submitting, check the title, body, quotes and attachments for secrets, credentials, customer data and other private details.

Open a real PR, not a draft, so review bots run. If `gh pr create` fails because the GraphQL rate limit is used up, use REST: `gh api repos/<owner>/<repo>/pulls -f title=... -f head=... -f base=... -F body=@<file>`.

Do not post a follow-up PR comment unless it serves the user's request. When a comment is needed, use the `leaving-pr-comments` skill.
