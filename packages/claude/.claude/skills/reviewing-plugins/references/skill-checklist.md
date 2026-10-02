# Skill checklist

Apply this to each `SKILL.md`, and to command files under `commands/`, which take the same frontmatter except `name` and `paths`.

## Contents

- Frontmatter: placement and keys
- Name
- Description
- Invocation control
- Tool grants and forked execution
- Body: size and structure
- Body: instructions
- Bundled scripts and paths
- Testing

## Frontmatter: placement and keys

- **The opening `---` must be the first line of the file.** Otherwise Claude Code treats the whole file as body text and no fields are set.
- **YAML must parse.** If it doesn't, the skill still loads but with no fields set, so `/name` works and Claude can never match the description. `claude plugin validate` finds this.
- **Every key must match a known field exactly.** Claude Code ignores an unknown key without reporting an error, so a misspelt key is a silent bug. The known keys are:
  `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `background`, `hooks`, `paths`, `shell`, `metadata`, `license`, `compatibility`.
  Common mistakes are `disable_model_invocation`, `allowed_tools` and `user_invocable`, which use underscores where the field uses hyphens, and `when-to-use`, which uses hyphens where the field uses underscores. If you find a key that isn't in this list, check the `skills` docs page before you report it, because it may be a new field.
- **Portability.** claude.ai uploads, the Skills API and `package_skill.py` accept only `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools`, and reject any other key with a hard error. Flag Claude Code-only keys only if the author intends to ship the skill to those surfaces.
- **`metadata` must be a map** and must not reuse frontmatter field names as keys.

## Name

- Maximum 64 characters: lowercase letters, digits and hyphens only. No XML tags. Must not contain the reserved words `anthropic` or `claude`.
- Not vague (`helper`, `utils`, `tools`) and not too generic (`documents`, `data`).
- Consistent with the other skills in the same collection.
- In a plugin, `name` replaces only the last segment of `/<plugin>:<name>`. Don't add the plugin prefix to the name yourself.
- A `SKILL.md` at a plugin root needs `name` set. Without it, a marketplace install names the skill after its cache directory.

## Description

The description decides whether the skill is ever used. Spend the most review effort here.

- **States what the skill does and when to use it.** The only exception is a skill with `disable-model-invocation: true`, whose description is never shown to Claude. For that kind of skill, a short label is enough, and a long one wastes the author's effort.
- **Third person.** "Reviews pull requests…", not "I can help you…" or "Use this to…". The description is injected into the system prompt, and a mixed point of view harms discovery.
- **Front-loads the key use case.** The listing caps `description` plus `when_to_use` at 1,536 characters. When the overall listing runs over its budget, Claude Code drops whole descriptions, starting with the least-used skills. The Agent Skills spec limits `description` to 1,024 characters, so stay under that if the skill might ship outside Claude Code.
- **Uses the words a user would actually type**: file types, tool names, symptoms, and casual phrasings, not just the formal name of the task.
- **Names its near misses** when a neighbouring skill exists: "Do not use for X (that is skill-y)". This prevents two skills competing for the same request.
- **Is not vague.** "Helps with documents" or "Processes data" gives Claude nothing to match.
- **Undertrigger or overtrigger.** Ask the user which symptom they see, or read the description against the realistic requests it should and shouldn't catch. Make an undertriggering description more specific and more insistent. Narrow an overtriggering one, or make the skill manual with `disable-model-invocation: true`.

## Invocation control

| Situation | Recommend |
| :- | :- |
| Side effects such as deploy, commit, send a message or write to a ticket | `disable-model-invocation: true`. It also removes the description from context, prevents preloading into subagents and stops the skill firing from a scheduled task |
| Background knowledge that is meaningless as a `/command` | `user-invocable: false` |
| Only relevant when certain files are being worked on | `paths:` with glob patterns |
| A rule that must hold every time, such as "never edit X" or "always run Y after editing" | A hook, not prose. Use the skill's `hooks` frontmatter, or a plugin hook. A skill is guidance Claude can drift from; a hook always runs |

Flag a skill with side effects that Claude can invoke on its own. That is a Broken finding: Claude may deploy because the code "looks ready".

## Tool grants and forked execution

- **`allowed-tools` pre-approves tools for the invoking turn only.** It doesn't restrict which tools are available; `disallowed-tools` does that. Flag broad grants such as `Bash` or `Bash(*)` on skills that live in a repository. Workspace trust doesn't gate them, so anyone running Claude Code in that repo gets the grant.
- **Match the grant to the command.** When the body runs a bundled script, write the same `${CLAUDE_SKILL_DIR}/scripts/x.sh *` path in both the grant and the body, so the call runs without a prompt.
- **`context: fork` needs a task, not guidelines.** The subagent receives only the skill body, not the conversation, and returns nothing useful from reference-only content. Check that the body stands on its own.
- **Forks run in the background by default.** They get the narrower background tool set, and their edits bypass checkpoints, so `/rewind` can't undo them. If the skill needs the full tool set or needs its result in the same turn, recommend `background: false`.
- **`agent: Explore` or `agent: Plan`** skips CLAUDE.md, so project conventions don't reach the fork.
- **`model` and `effort` overrides** should have a reason. An override silently degrades on surfaces where the model isn't allowed.

## Body: size and structure

- **The body is a recurring cost.** Once invoked, it stays in context for the rest of the session. Cut anything Claude already knows, such as explanations of what a PDF or a REST API is. Test each paragraph: would Claude get this wrong without it?
- **Keep it under 500 lines.** Move detail into reference files that SKILL.md links to directly. Each link should say what the file holds and when to read it.
- **Keep references one level deep.** Claude often reads only part of a file that is linked from another reference file.
- **Reference files over 100 lines need a table of contents at the top**, so a partial read still shows the whole scope.
- **Put the most important instructions first.** After compaction, Claude Code re-attaches only the first 5,000 tokens of each invoked skill, within a 25,000-token total across skills.
- **Use descriptive file names**, such as `form-validation-rules.md`, not `doc2.md`. Organise files by domain or feature.

## Body: instructions

- **Write standing instructions, not one-off steps.** The file is read once and not re-read on later turns, so "Run the tests after every edit" works and "Run the tests" fades.
- **Match the degree of freedom to how fragile the task is.** Give exact commands for fragile operations such as migrations and releases. Give heuristics for tasks where judgement applies, such as reviews.
- **Give one default, with an escape hatch.** Don't offer a menu of five libraries.
- **Use consistent terminology.** Pick one term and keep to it, not "field", "box" and "control" for the same thing.
- **Avoid time-sensitive statements** such as "before August 2025, use…". Move legacy behaviour into a clearly labelled "old patterns" section.
- **Use concrete examples**, with input and output pairs where the output style matters.
- **Give multi-step workflows numbered steps** and, where they are long, a checklist Claude can copy and tick off.
- **Add a feedback loop to quality-critical tasks**: validate, fix, repeat, and continue only when validation passes.
- **Use all-caps MUST and NEVER rarely.** If a rule needs shouting, it may belong in a hook. If it stays as prose, one line of reason usually works better than capitals.

## Bundled scripts and paths

- **Use `${CLAUDE_SKILL_DIR}` for files bundled with the skill**, and `${CLAUDE_PLUGIN_ROOT}` for files shared across a plugin. A bare relative path such as `scripts/x.py` resolves against the user's working directory, not the skill's.
- **Say whether to run a script or read it.** Write "Run `x.py` to …" for scripts to execute, and "See `x.py` for the algorithm" for scripts to read as reference.
- **Scripts should handle their own errors** with specific messages, not fail and leave Claude to work out why.
- **No unexplained constants.** Every timeout and retry count should carry a one-line reason.
- **Declare dependencies.** Name the packages or binaries the skill needs, and don't assume they are installed.
- **Use forward slashes** in all paths.
- **Name MCP tools in full.** In skill text, use `Server:tool`. In hook matchers, use `mcp__<server>__<tool>`.
- **Mark Claude Code-only features.** `` !`cmd` `` context injection and `$ARGUMENTS` substitution don't work on claude.ai or through the API.
- **Escape literal dollar amounts.** Write `\$1.00`, or `$1` expands to the first argument.

## Testing

- **Check for an eval suite.** skill-creator uses `evals/evals.json` inside the skill. `claude plugin eval` uses `evals/` cases inside a plugin. The two formats aren't interchangeable.
- **Without evals, recommend at least three realistic prompts** and a with-skill and without-skill comparison run in a fresh session. A trigger proves Claude found the skill, not that the skill helped.
- **Check model coverage.** If the skill will run on Haiku, check that the instructions give enough guidance. If it will run on Opus, check that they don't over-explain.
- Run `/skill-doctor` to find skills that are never invoked and are costing context for nothing.
