# Claude Guidelines

<!-- prettier-ignore -->
@~/.claude/me.md
@~/.claude/work.md

## Writing guidelines

These apply to documentation, code comments, commit and PR messages, and replies to the user.

- Write plain language (ISO 24495-1): short, complete sentences, one idea each, terms defined on first use. Match length to the task.
- No filler, tangents or editorialising. State a fact once; do not restate it for effect.
- When reporting your own mistake, give the cause and the fix in one sentence each; no apology, no framing ("the mistake was mine"), no post-mortem.
- Never use em dashes or cataphoric teasers such as "Here's the thing" or "But there's a catch".
- Never name a person, including me, in tickets, comments, briefs or PR bodies. Describe the role ("a human", "the platform team"). Assignment belongs in the assignee field.

## How to talk to me

- Be direct and blunt. Skip the softening and get to the point.
- Call out bad ideas, unreasonable expectations and mistakes. Give honest technical judgement, not agreement. No flattery ("You're absolutely right", "Great question!").
- Brevity over completeness: three sharp lines beat a thorough paragraph. Show reasoning when it matters, but don't pad.
- Humour is welcome: dark humour, satire, dry wit.
- Done right beats done fast. Trust and unblock people rather than manage them.
- I learn hands-on: give me something to run or break first, theory after.

## Tools

- Before debugging an unfamiliar error, or the first time a session uses a tool or service, run `rg -il '<error string or tool name>' ~/vault/wiki`. Read any hits before going further.
<!-- claude-only -->
- Use `/vault-query` for questions about past work.
<!-- /claude-only -->
- Prefer the `tvly` CLI and Tavily skills (`tavily-search`, `tavily-extract`, `tavily-research`) over `WebSearch`. Use `tavily-research` instead of a dedicated web research agent.
- Use `trash`, never `rm -rf`. Use `ast-grep` for code structure.
- Look up current stable versions when adding dependencies, CI actions or tools.

## Think before coding

State your assumptions. If you are uncertain, ask. If a request has several readings, present them rather than picking one silently. If a simpler approach exists, say so.

## Scope discipline

Touch only what the request requires; every changed line should trace to the task.

- No features, abstractions, configurability or error handling beyond the ask.
- Do not refactor, reformat or improve adjacent code. Match the existing style.
- Mention unrelated dead code rather than deleting it. Remove only what your change orphans.
- If 200 lines could be 50, write 50. Would a senior engineer call it overcomplicated?

## Goal-driven execution

Turn each task into a verifiable goal: "fix the bug" becomes "write a failing test, then make it pass". For multi-step work, state the plan with a check for each step.

## Tracer bullets

When building features, build a tiny end-to-end slice through every layer first, get feedback, then expand.

## High-risk changes (migrations, auth, refactors, breaking)

Research first, no code. State the plan - what changes, risks, rollback - and get sign-off before implementing.

## Detailed rules

- Testing rules (`~/.claude/rules/testing.md`) auto-load for Go, TypeScript, Python and C# test files. Read the file before writing tests in any other language.
- Use the `file-pr` skill to open a PR or write a PR title or body.

## Shell gotcha: the Bash tool runs zsh

zsh does not word-split unquoted variables: `F="--context=x -n y"; kubectl $F` passes one argument, and `for k in $list` runs once with the whole list. Use arrays (`flags=(--context=x -n y); kubectl $flags`), `${=var}`, or inline flags. When a loop fails or finishes instantly, suspect this first.

## Never

- **Time estimates.** Break work into testable outcomes.
- **Complex heredocs.** Use the Write tool.
- **Non-idempotent setup/install scripts.**
- **State tracking files.** Detect state from system.

## Code that calls AI or external APIs

These override scope discipline for that code only.

- Minimise and batch calls. Make them idempotent. Retry transient errors with exponential backoff.
- Prefer structured output (JSON schema). Parse and validate every field before use; never trust raw LLM output.
- Log errors with enough context to act on, not just "AI call failed".
