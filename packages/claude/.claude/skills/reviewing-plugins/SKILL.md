---
name: reviewing-plugins
description: Reviews Claude Code skills, plugins and plugin marketplaces against current Anthropic guidance, then reports ranked, concrete recommendations and offers to apply them. Covers SKILL.md frontmatter and descriptions, invocation control, context cost, progressive disclosure, plugin.json, agents, hooks, MCP config, userConfig, marketplace.json entries and sources. Use when the user asks to review, audit, critique, tidy or improve a skill, plugin or marketplace, asks why a skill does not trigger or triggers too often, asks whether a skill follows best practice, or wants a plugin checked before sharing or publishing it. Do not use to create a new skill from scratch or to run evals (that is skill-creator), or to write a mod (that is plugin-authoring).
---

# Reviewing plugins

Review a skill, plugin or marketplace and produce a ranked list of fixes. The validator checks schema. This review checks judgement: whether the thing triggers when it should, costs what it should, and does what its author thinks it does.

Report first. Edit nothing until the user picks which recommendations to apply.

## 1. Identify the target

Work out what the user pointed at. If they gave no path, use the current directory, and ask only if it holds nothing reviewable.

| What is there | Target type | Checklists to read |
| :- | :- | :- |
| `<dir>/SKILL.md`, no `.claude-plugin/` | Standalone skill | [skill-checklist.md](references/skill-checklist.md) |
| A `skills/` folder of skill directories | Skill collection | skill checklist, applied to each skill |
| `.claude-plugin/plugin.json` | Plugin | [plugin-checklist.md](references/plugin-checklist.md), then the skill checklist for each skill |
| `.claude-plugin/marketplace.json` | Marketplace | plugin checklist (marketplace section), then each relative-path plugin it lists |
| A plugin name such as `foo@bar` | Installed plugin | Resolve it with `claude plugin details <name>` and review the cached copy under `~/.claude/plugins/cache/`. Say that fixes belong upstream, because the cache is overwritten on update |

Read every file in the target before judging it: SKILL.md bodies, reference files, scripts, agent files, `hooks/hooks.json`, `.mcp.json` and manifests. A finding that a reference file would have answered is noise.

## 2. Run the mechanical checks

Run the validator before reading for judgement, so the review does not repeat what a tool already reports:

```bash
claude plugin validate --strict --json <path>
```

- For a standalone skill, pass the enclosing directory, and only if that directory is named `skills/`. The validator checks components only in a directory with that name. On any other directory, including the skill's own, it fails with `No manifest found`, which is not a real defect. If the skill lives somewhere else, copy it into `$(mktemp -d)/skills/` and validate that copy.
- The validator catches some YAML parse errors but not all. For example, an unclosed `[` passes. It doesn't report unknown or misspelt skill frontmatter keys. Check both yourself against the skill checklist.
- The validator does not follow symlinks and says how many entries it skipped. Resolve each one with `realpath` and validate the real path.
- For an installed or loadable plugin, also run `claude plugin details <name>` and record the always-on and on-invoke token cost.

Put validator output in its own section of the report. Treat a warning as something to judge, not something to fix automatically. For example, a missing `version` is a release-strategy choice, not a bug.

## 3. Review against the checklists

Read the checklist files the table in step 1 names. Each item says what to look for and why it matters. Report only what applies. A checklist item that does not apply is not a finding.

The checklists cover how a skill or plugin is written. Also check what it does. Trace each script, hook and command against the real environment it will run in, and look for behaviour the author would not want: a deploy that targets whatever context is current, a step that bypasses the team's normal release path, or a script that disagrees with the instructions that call it. These are often the most valuable findings in a review.

Weigh every finding by what it costs the user:

- **Broken**: it does not load, does not trigger, or behaves differently from what its author intended. Examples: a misspelt frontmatter key, which Claude Code ignores silently; a component in the wrong directory; a hook matcher that can never match.
- **Costly**: it spends context or usage in every session for little return. Examples: a long description on a manual-only skill; a 900-line SKILL.md; hooks that fire on every tool call.
- **Weak**: it works, but triggers unreliably or gives the model unclear instructions. Examples: a vague description; menus of options with no default; key rules buried at the bottom of the file.
- **Polish**: style and consistency. Report these only when there are few higher findings, and group them.

## 4. Check the live docs when the checklist runs out

The checklists cover what was current when they were written. The platform changes quickly, and many behaviours are gated by version. Fetch the source page before you make a claim the checklist does not support, for example when you find a frontmatter key, manifest field or hook event that the checklist does not list:

```bash
curl -sL https://code.claude.com/docs/en/<page>.md
```

The pages you are most likely to need are `skills`, `sub-agents`, `hooks`, `plugins/components`, `plugins/manifest-reference`, `plugins/marketplace-reference` and `plugin-evals`. The full index is at `https://code.claude.com/docs/llms.txt`. Skill-writing guidance is at `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices.md`. Run `claude --version` when a finding depends on a version gate.

Do not guess about a field you have never seen. An unknown key and a new feature look the same until you check.

## 5. Report

Use this structure. Leave out a section if it would be empty.

```markdown
# Review: <target name> (<type>)

<One or two sentences: overall state and the single most important change.>

## Validator
<Pass/fail line, then each error or warning with a verdict: fix, ignore (why), or judge.>
<Token cost from `claude plugin details`, if run.>

## Findings

### Broken
1. **<short title>** - `path/to/file:line`
   <What is wrong, in one sentence.> <Why it matters, citing the doc rule.>
   Fix: <the concrete change, as a diff or replacement text when it is short.>

### Costly
### Weak
### Polish

## Not checked
<Anything you could not verify, such as behaviour that needs an eval run, or a symlinked path you could not resolve.>
```

Rules for findings:

- Give every finding a location and a concrete fix. "Improve the description" is not a fix. A rewritten description is.
- Rank findings within each severity by impact.
- Merge repeated instances into one finding that lists every location.
- Do not pad the report with praise or with checklist items that passed.
- When a fix is a judgement call, such as splitting a skill or changing who can invoke it, give the trade-off in one line.

## 6. Offer to apply

End by asking which findings to apply, for example "all Broken and Costly", or by number. After you edit, run the validator again, check that the result is no worse, and say which findings you applied and which you skipped.

For trigger problems, a rewritten description is only a hypothesis. Recommend measuring it: skill-creator's description optimiser for a standalone skill, or a `claude plugin eval` case with a `tool_used: Skill` grader for a plugin skill.

## Where the guidance conflicts

The sources disagree on some points. Take these positions, and say so if the user asks.

- **Explaining why versus stating what.** The Claude Code skills page says to state what to do and not narrate why, because the body is a recurring token cost. Skill-authoring guidance says to explain the reasoning in place of rigid MUSTs. Recommend giving a reason only for rules the model would otherwise break or apply too literally. Recommend cutting reasons that just justify the obvious.
- **Gerund names.** The best-practice guide prefers names like `processing-pdfs`, but lists noun phrases as acceptable. Flag a name only if it is vague, breaks the character rules, or does not match the rest of the user's collection.
- **Pushy descriptions.** A description that pushes hard to trigger helps a skill that undertriggers, and hurts a skill that already triggers too often. Base the advice on the symptom the user reports, not on a rule of thumb.
