# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Architecture

This is a **stow-based dotfiles repository** managing cross-platform configurations for macOS, Linux, and Windows/WSL2. Each application's configuration lives in its own `packages/` subdirectory and is deployed using GNU Stow.

### Package Structure

```
packages/
├── <app-name>/
│   └── .config/             # Stows to ~/.config/
│       └── <app-name>/
│   └── .<filename>          # Stows to ~/.<filename>
```

**Key principle**: Packages use real dotfile names, so the directory structure mirrors home directly. For example:
- `packages/zsh/.zshenv` → `~/.zshenv`
- `packages/nvim/.config/nvim/init.lua` → `~/.config/nvim/init.lua`

`packages/.stowrc` already sets `--target=~/` and ignores `.stowrc` and `.DS_Store`. The `-t "${HOME}"` in the commands below is redundant but matches what the install scripts do.

### Major Components

- **Shell**: Zsh with Zinit plugin management and Starship prompt
- **Editor**: Neovim (LazyVim plus four small plugin overrides, Copilot for AI); also `zed`, `vscode`
- **Terminal**: Ghostty (`voltaic-dark`/`voltaic-light`)
- **Git**: Modular config - `config` includes `.gitalias` (short single-letter aliases) and a gitignored `.gitconfig-local`
- **Tools**: `atuin`, `eza`, `mise`, `k9s`, `homebrew` (Brewfile), `yamllint`, `editorconfig`, `worktrunk`, `ccstatusline`
- **Claude**: Config, skills, agents and rules at `packages/claude/.claude/` - see gotcha below
- **Other**: `1Password`, `ssh`, `tmux`, `starship`, `claude-mem`, `agents`, `skills`

**Deployment source of truth**: the `COMMON_PACKAGES` / `MAC_PACKAGES` arrays in `install.sh` and `DEVCONTAINER_PACKAGES` in `install/devcontainer.sh`. A directory under `packages/` is not deployed unless it is listed there. Every directory in `packages/` is currently listed; `.github/workflows/lint.yml` fails the build if an array names a package that does not exist.

`packages/agents` must be stowed wherever `packages/claude` is - the tavily skills under `.claude/skills/` are symlinks into `~/.agents/skills/`.

## Common Development Commands

### Deployment

```bash
./install.sh           # Bootstrap: detect OS, stow configs, install tools
```

For manually stowing specific packages:

```bash
cd packages && stow -v -t "${HOME}" git zsh   # Stow specific packages
stow -v -D -t "${HOME}" git                   # Unstow a package
stow -v -R -t "${HOME}" git                   # Restow (unstow + stow)
```

### Linting

```bash
shellcheck -x --source-path=SCRIPTDIR install.sh install/*.sh   # Same command CI runs; must exit 0
```

`.markdownlint.json` exists (MD013 off, MD007 indent 2) but no markdownlint CLI is installed; it is only honoured by editor extensions. Match those rules when writing markdown here, don't try to run it.

### Platform-Specific Installation

Called by `install.sh` after OS detection; `install/common.sh` is sourced (not executed) and provides the `print_*` output functions plus the `install_*` helpers.

```bash
./install/mac.sh          # macOS: Homebrew + GUI apps
./install/ubuntu.sh       # Ubuntu/Debian: apt + manual installs
./install/devcontainer.sh # Devcontainer: stows a 5-package subset, see DEVCONTAINERS.md
```

## Key Integration Points

### Git Configuration

Git config is **modular**:

- `packages/git/.config/git/config` - Main config, with `[include]` paths at the bottom
- `.gitalias` - Short single-letter aliases plus `git cleanup`
- `.gitconfig-local` - Machine-specific overrides (gitignored, included by `config`)

Commits are signed with `gpg.format = ssh` and verified against `~/.ssh/allowed_signers`. Delta is present in the config but commented out, and is not installed - don't re-enable it without adding the binary.

### Neovim Configuration

LazyVim with a thin override layer in `packages/nvim/.config/nvim/`:

- `init.lua` - Entry point (`require("config.lazy")`)
- `lazyvim.json` - Enabled LazyVim extras (Copilot, Go, Docker, Helm, JSON, YAML, Markdown, DAP, REST, mini-surround, mini-files)
- `lazy-lock.json` - Plugin versions (commit this)
- `lua/plugins/` - Only four files: `colorschemes`, `conform`, `copilot`, `git`
- `lua/config/keymaps.lua` - Only `jj`/`jk` to escape insert mode

AI in the editor is GitHub Copilot, not CodeCompanion. See `KEYMAPS.md`.

### Zsh Configuration

Shell setup in `packages/zsh/.config/zsh/`:

- `conf.d/` - Numbered config files, glob-loaded in order by `.zshrc` (`00_platform` → `50_tools`)
- `aliases/` - Per-topic alias files (git, docker, modern-tools, etc.)
- `functions/` - Shell functions, added to `fpath` before `conf.d` loads
- `packages/zsh/.local/bin/` - Standalone scripts (`extract`, `+x`) stowed to `~/.local/bin`
- `.zshenv` at `packages/zsh/.zshenv` - Sets `ZDOTDIR` and `PATH`, so non-interactive shells get the same `PATH`

Aliases map traditional tools to modern alternatives (`ls`/`ll`/`la` → `eza`, `ps` → `procs`, `rm` → `trash`); zoxide takes over `cd` outright. `grep` and `cat` are deliberately not aliased, and neither `bat` nor `delta` is installed.

Gitignored, so absent on a fresh clone: `.zprofile`, `.zsh_history`, `99_private-environment.zsh` (machine-local secrets/env - picked up automatically by the `conf.d` glob).

### Claude Configuration

**`~/.claude` is a real directory holding stow symlinks.** Claude Code's runtime state stays in your home directory and never enters the working tree.

- `CLAUDE.md`, `me.md`, `work.md` and `settings.json` are individual file symlinks into `packages/claude/.claude/`.
- `agents/`, `rules/`, `skills/`, `themes/` and `scheduled-tasks/` are folded directory symlinks, so files you author in them are live immediately with no stow step.
- Everything else in `~/.claude` (`projects/`, `history.jsonl`, `plugins/`, `shell-snapshots/`, `statsig/`, ...) is a real path outside this repo.
- Only after adding a **new top-level entry** to the package does stow need re-running: `cd packages && stow -R -t "${HOME}" claude`.
- If a runtime path ever appears in `git status` under `packages/claude/`, the arrangement has been undone - re-check `~/.claude` is still a real directory rather than adding a gitignore rule.

`packages/claude/.claude/CLAUDE.md` is the global user instruction file, not project context. Changing it changes Claude's behaviour in every repo.

## Important Patterns

### When Adding New Packages

1. Create `packages/<app-name>/` directory
2. Add configs using real dotfile names (`.config/<app>/` for XDG, `.<filename>` for home-dir dotfiles)
3. Add the package name to the relevant array in `install.sh` (`COMMON_PACKAGES` or `MAC_PACKAGES`) - otherwise it never deploys
4. Add installation commands to appropriate `install/*.sh` script
5. Stow the new package: `cd packages && stow -v -t "${HOME}" <app-name>`
6. Document in README.md if user-facing

When **removing** a package, delete its name from the `install.sh` arrays too. Stow aborts the whole run on a missing package, and a stale symlink in `~/.config` is left dangling.

### When Modifying Install Scripts

- All install scripts use color-coded output functions (`print_status`, `print_success`, `print_error`, `print_warning`)
- Scripts must be idempotent (safe to run multiple times)
- Check for existing installations before attempting to install
- Use platform detection where needed

### Cross-Platform Considerations

- **macOS**: Uses Homebrew for everything, GUI apps to `~/Applications`
- **Linux**: apt for the bare minimum (curl, fzf, git, gnupg, stow, zsh), then mise for the tools; the `os = ["linux"]` entries in `packages/mise/.config/mise/config.toml` exist because macOS gets those from Homebrew
- **Fonts**: JetBrainsMono Nerd Font is required; installed by Homebrew on macOS, not installed at all on Linux
- **Theme**: Mixed - Catppuccin Mocha in Neovim, tmux and Starship; `voltaic-dark` in Ghostty and k9s. Don't assume one theme when editing configs

## Testing Changes

Before committing changes to configs:

1. **Test deployment**: `cd packages && stow -v -R -t "${HOME}" <package>`
2. **Verify symlinks**: `ls -la ~/.config/<app>` - confirm it resolves into this repo, not dangling
3. **Test functionality**: shell changes with `exec zsh`; others by opening the application
4. **Check for conflicts**: Stow errors if a real file already exists where a symlink should go
