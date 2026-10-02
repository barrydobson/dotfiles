# Plugin and marketplace checklist

Run `claude plugin validate --strict --json` first. This list covers what the validator can't judge, and the cases where its pass result misleads.

## Contents

- Should this be a plugin?
- Layout
- Manifest
- Agents
- Hooks
- MCP servers and user configuration
- Paths and state
- Context footprint
- Trust and data
- Marketplace
- Testing

## Should this be a plugin?

- **A plugin suits a setup that is shared, installed in several projects, or released in versions.** A setup that one person uses in one project works as standalone `.claude/` files. Say so if a plugin adds packaging for no benefit.
- **The reverse also applies.** Skills, agents and hooks that teammates copy around by hand should become a plugin.

## Layout

- **Only `plugin.json` goes inside `.claude-plugin/`.** Components saved there don't load. A `skills/` folder inside `.claude-plugin/` is the usual cause of "plugin loads but its skills are missing".
- **Components go at the plugin root**: `skills/<name>/SKILL.md`, `agents/*.md`, `hooks/hooks.json` and `.mcp.json`.
- **`commands/` is the legacy format.** Recommend moving its files to `skills/<name>/SKILL.md`, which can carry supporting files.
- **A `CLAUDE.md` at the plugin root isn't loaded.** Turn its instructions into a skill, or into a hook if they must always apply.
- **A single root `SKILL.md` loads only** when there is no `skills/` directory and no `skills` manifest key. It must set `name`.

## Manifest

- **`name` is the only required field.** Use kebab-case with no spaces. It prefixes every skill and agent the plugin provides.
- **`description` and `author.name`** are what users see in `/plugin`. Flag them if they are missing.
- **`version` sets the release model.** When set, users stay pinned to that version until you change it, so the author must bump it on every release. A plugin can also leave it unset on purpose. Flag it only if it is set but stale, or if the author's release process contradicts the choice.
- **`homepage` must parse as a URL**, or the plugin fails to load. `repository` isn't validated.
- **Unknown top-level keys are stripped** with a warning. An unknown key inside `userConfig`, `channels`, `lspServers` or `monitors` is an error, and the plugin doesn't load.
- **Component keys behave differently from each other**:
  - `commands`, `agents`, `outputStyles` and the `experimental.*` keys replace their default directory. Setting `agents` means `agents/` is no longer scanned. Flag a plugin that has both the key and the default folder.
  - `skills` adds directories to the `skills/` scan.
  - `hooks`, `mcpServers` and `lspServers` merge with their default files.
- **Directory-listing fields** (`icon`, `documentationUrl`, `supportUrl`, `privacyPolicyUrl`, `termsOfServiceUrl`) belong only in `plugin.json`, not in marketplace entries.
- **Only `agent` and `subagentStatusLine` take effect in `settings`.** Anything else in that object is dead config.
- **`defaultEnabled` applies only to new users.** Changing it in a later release doesn't affect people who already installed the plugin.
- **`dependencies`** should name every plugin this one needs. Bare names resolve against this plugin's own marketplace.

## Agents

- **Supported frontmatter**: `name`, `description`, `model`, `effort`, `maxTurns`, `tools`, `disallowedTools`, `skills`, `memory`, `background`, `omitClaudeMd`, `isolation` (`"worktree"` is the only valid value), `color`, and `experimental.cacheTtl`.
- **Plugin agents ignore `permissionMode`, `hooks`, `mcpServers` and `initialPrompt`.** Flag these as Broken, because the author expects them to work. Move hooks and MCP servers to the plugin level.
- **An agent whose frontmatter doesn't parse** still loads, with the description `Agent from <plugin> plugin`, and is never delegated to sensibly.
- **Agent descriptions decide delegation**, the same way skill descriptions decide triggering. Apply the description rules from the skill checklist.
- **Scoped names include subfolders**: `agents/review/security.md` loads as `<plugin>:review:security`. Check that any docs or skills that name the agent use the scoped name.

## Hooks

- **Plugin hooks fire in every session where the plugin is enabled**, not only when its skills run. A broad matcher such as `.*` or none at all, on `PreToolUse` or `PostToolUse`, runs on every tool call. Flag it as Costly or Broken, depending on what the hook does.
- **Quote `"${CLAUDE_PLUGIN_ROOT}"`** in shell-form `command` strings, or a path containing spaces breaks. Exec form with `args` needs no quoting.
- **Matchers for the plugin's own MCP tools** must use the full name `mcp__plugin_<plugin>_<server>__<tool>`. A matcher on the server name alone never fires.
- **Hook scripts must be executable** and must exist at the path the hook names.
- **A hook duplicated in a user's settings file runs twice.** Check the migration notes if the plugin was converted from a `.claude/` setup.
- **A `modules` key in `hooks.json` makes the plugin a mod.** Mods are out of scope for this review. Say so, and suggest the user reviews it separately.

## MCP servers and user configuration

- **Use `${CLAUDE_PLUGIN_ROOT}`** in `command` and `args` for bundled servers, never an absolute path from the author's machine.
- **Never put a literal credential in `headers` or `env`.** Declare a `userConfig` option and reference `${user_config.KEY}`. The validator warns about headers that look like credentials, but it can't see every case.
- **Remote URLs should use `https://` or `wss://`** unless the host is loopback.
- **The `userConfig` dialog appears only when a user installs through `/plugin` in a session.** If the plugin's README tells users to install with `claude plugin install` or `--plugin-dir`, it must also tell them to run `/plugin configure <name>`.
- **`userConfig` options are strict.** An unknown key inside one stops the plugin loading.

## Paths and state

- **Every component path must start with `./`**, resolve inside the plugin root and exist. A path containing `..` is rejected.
- **Don't write state to `${CLAUDE_PLUGIN_ROOT}`.** That directory changes on every update. Use `${CLAUDE_PLUGIN_DATA}` for caches, `node_modules` and generated files.
- **These variables aren't in the Bash tool's environment.** In skill and agent bodies, write `${CLAUDE_PLUGIN_ROOT}` in the Markdown, where Claude Code substitutes it. Don't tell Claude to run `echo $CLAUDE_PLUGIN_ROOT`.
- **Use `${CLAUDE_PROJECT_DIR}`** for project-local files, not a relative path that depends on the working directory.

## Context footprint

- **Each enabled plugin adds the name and description of every model-invocable skill, agent and command to every turn**, whether or not anything from the plugin runs. Report the always-on cost from `claude plugin details`.
- **For a plugin with many skills**, check which ones Claude genuinely needs to choose on its own. Make the rest `disable-model-invocation: true`, which removes their descriptions from the listing.
- **Flag MCP servers that start in every session** but serve only one rarely used skill.

## Trust and data

Plugins run as the user, with no sandbox. When reviewing one, especially one from outside the user's organisation, list:

- every shell command a hook runs, and every network endpoint it calls
- every MCP server command and remote URL
- every broad `allowed-tools` grant in a skill
- anything that sends prompts, code, transcripts or files off the machine

Name the data that leaves and where it goes. Flag it for the user to decide on. Don't treat it as acceptable by default, because the user may work under regulatory or contractual data-handling rules.

## Marketplace

- **`marketplace.json` needs `name`, `owner` and a `plugins` array.** Each entry needs `name` and `source`.
- **Write relative sources from the marketplace root**, the directory that contains `.claude-plugin/`, starting with `./`. A path with `..` fails validation. A path to a directory that doesn't exist passes validation and fails only at install, so check each relative path exists yourself.
- **Each entry `name` must equal the `name` in that plugin's `plugin.json`.** When they differ, installing by the manifest name fails with `Plugin "<name>" not found in marketplace`. The validator doesn't catch this, so compare them yourself.
- **Reserved names** such as `claude-plugins-official` pass validation, but Claude Code refuses them when the marketplace is added. Flag any marketplace name that copies an Anthropic name.
- **For remote sources** (`github`, `url`, `git-subdir`, `npm` and `archive`), a wrong repository or path appears only at install time. Recommend pinning a `ref` or `sha` when users need reproducible installs.
- **Validate every relative-path plugin.** The validator reports their `plugin.json` problems as `plugins[N] plugin.json → …`.
- **README test instructions** must not tell users to run `--plugin-dir` at the marketplace root. That loads nothing, and shows no error.
- **Recommend a local end-to-end test** before hosting: `claude plugin marketplace add ./<dir>`, then `claude plugin install <entry>@<marketplace>`, then `claude plugin details <entry>`.

## Testing

- **Check whether `evals/` exists with `claude plugin eval` cases.** Each case should have one grader on the result and one on the process, such as `tool_used`.
- **A `tool_used: Skill` grader** measures triggering. It is excluded from the with-plugin minus without-plugin score by design, so a delta of zero on that grader alone means nothing.
- **Recommend `claude plugin validate --strict` in CI** for any plugin that is shared.
