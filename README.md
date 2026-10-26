# Personal Dotfiles

A cross-platform dotfiles configuration for macOS, Windows (WSL2), and Linux. This configuration emphasizes modern tooling and AI-assisted developer productivity.

## 🤖 AI Development Features

- **Claude Code**: Global config, skills, agents and rules in `packages/claude/.claude/`, symlinked into `~/.claude`

**📖 See [CLAUDE.md](CLAUDE.md) for detailed Claude Code integration setup**

## Features

- **Cross-Platform Support**: Works on macOS, Windows (WSL2), and Linux
- **Modern CLI Tools**: Replaces traditional tools with faster, feature-rich alternatives
- **Theming**: Catppuccin Mocha in Neovim, tmux and Starship; voltaic-dark in Ghostty and k9s
- **Editor**: Minimal single-file Neovim configuration
- **Git Workflow**: Signed commits, linear-history defaults and worktree tooling
- **Shell Enhancement**: Zsh with modern completions and smart directory navigation

## Quick Start

### Prerequisites

- **OS**: macOS, Ubuntu/Debian, or Windows 10+ with WSL2
- **Git**: For cloning the repository
- **Stow**: Installed by the bootstrap (Homebrew on macOS, apt on Debian)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Debian/Ubuntu**: `sudo` for the apt step; without it the bootstrap prints the packages to install manually

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/barrydobson/dotfiles-public.git ~/dotfiles
   cd ~/dotfiles
   ```

2. **Bootstrap** (detects the OS, installs prerequisites, stows configs, then installs tools):

   ```bash
   ./install.sh
   ```

   `install.sh` runs the platform script first (Homebrew or apt, plus stow, zsh
   and git), stows the packages, and only then installs tools - the Brewfile and
   mise config have to be symlinked into `$HOME` before they can be used. The
   platform scripts are runnable on their own if you only want the prerequisites:

   ```bash
   ./install/mac.sh          # macOS
   ./install/ubuntu.sh       # Ubuntu/Debian
   ```

3. **Reload the shell:**

   ```bash
   exec zsh
   ```

## Key Tools and Replacements

| Traditional | Modern Alternative | Purpose |
|-------------|-------------------|---------|
| `ls`, `ll`, `la`, `tree` | `eza` | Directory listing with icons and git status |
| `find` | `fd` | Fast file finder; backs fzf |
| `grep` | `ripgrep` (`rg`, `rga`) | Fast text search - `grep` itself is not aliased |
| `cd` | `zoxide` | Smart directory navigation (`--cmd cd`, so `cd` is zoxide) |
| `ps` | `procs` | Process viewer |
| `rm` | `trash` | Recoverable deletes when `trash` is installed |
| `Ctrl-R` | `atuin` | Searchable, synced shell history |

## Configuration Highlights

### Shell (Zsh)

- **Plugin Manager**: Zinit for fast plugin loading
- **Prompt**: Starship, configured in `packages/starship/`
- **Completions**: Modern tab completion system
- **Aliases**: Shortcuts for modern CLI tools

### Terminal

**Ghostty** is the only terminal with a config here (`packages/ghostty/`):

- **Font**: JetBrainsMono Nerd Font (consistent across platforms)
- **Theme**: `voltaic-dark` / `voltaic-light`, following the system appearance
- **Splits**: `super+d` right, `super+shift+d` down, `ctrl+hjkl` to navigate
- **tmux friendly**: `cmd+a` sends the `Ctrl-A` prefix, and Shift+Enter is fixed up

### Text Editors

#### Neovim

A minimal, beginner-friendly config in one file,
`packages/nvim/.config/nvim/init.lua`. Needs Neovim 0.12+ for the built-in
`vim.pack` plugin manager. Plugins: catppuccin, which-key, telescope,
gitsigns and neo-tree. See [KEYMAPS.md](KEYMAPS.md).

### Git Configuration

- **Modular Config**: `config` includes `.gitalias` and a gitignored `.gitconfig-local`
- **Signed Commits**: SSH-format signing, 1Password agent supplies the key
- **Linear History**: `pull.rebase`, `rebase.autosquash`, `fetch.prune`, `push.autoSetupRemote`
- **Short Aliases**: single-letter aliases (`a`, `b`, `c`, `d`, ...) plus `git cleanup`

## Development Workflow

### Daily Commands

```bash
# Deployment (run from packages/)
cd packages
stow -v -t "${HOME}" git zsh    # Deploy specific packages
stow -v -D -t "${HOME}" git     # Remove a package
stow -v -R -t "${HOME}" git     # Redeploy a package

# Development
shellcheck -x --source-path=SCRIPTDIR install.sh install/*.sh   # Lint shell scripts (same as CI)
```

### Git Integration

- `wt` ([worktrunk](https://worktrunk.dev)) manages worktrees; its shell hook is wired up in `.zshrc`
- Single-letter aliases plus `git cleanup` to prune merged branches
- `.gitconfig-local` for machine-specific settings (gitignored)

### Shell Productivity

- `cd <partial-path>` - zoxide-backed jumping (zoxide takes over `cd`)
- `ll`, `la`, `tree` - eza listings
- `Ctrl-R` - atuin history search; `Ctrl-T` file search and `Alt-C` directory jump via fzf
- `ea`, `ez`, `ev` - edit the alias, zsh and Neovim configs
- `mnt` - autoloaded function for mounting external drives; `extract` and `+x` in `~/.local/bin`

### Key Bindings and Shortcuts

- **📖 [Neovim Keymap Reference](KEYMAPS.md)** - keymaps and plugins
- **Ghostty**: split and tab bindings in `packages/ghostty/.config/ghostty/config`
- **tmux**: `Ctrl-A` prefix, `|` and `-` to split, `r` to reload

## Platform-Specific Notes

### macOS

- Homebrew manages CLI tools, casks and fonts via `~/.Brewfile`
- The 1Password SSH agent socket is linked into `~/.1password/agent.sock`
- Extra packages stowed only here: `1Password`, `claude`, `ghostty`, `k9s`, `lazygit`, `ssh`, `vscode`, `zed`, and the Claude helpers (see `MAC_PACKAGES` in `install.sh`)

### Linux

- apt installs the minimum (curl, fzf, git, gnupg, stow, zsh); everything else comes from mise
- Starship and the 1Password CLI are installed by `install.sh` after stowing, into `~/.local/bin` where relevant
- No fonts are installed - install JetBrainsMono Nerd Font yourself if the terminal needs it

### Windows

- Works via WSL2 with the Debian/Ubuntu path
- No Windows Terminal configuration in this repo

## Customization

### Adding New Tools

1. Create `packages/<tool>/` with the config at its real dotfile path
2. Add the package name to `COMMON_PACKAGES` or `MAC_PACKAGES` in `install.sh`
3. Add installation commands to the appropriate install script
4. Update README with tool information

### Theme Customization

Themes are set per application, so changing one means editing each config:

- Neovim: `vim.cmd.colorscheme` in `packages/nvim/.config/nvim/init.lua`
- tmux: the `@catppuccin_*` settings in `packages/tmux/.config/tmux/tmux.conf`
- Starship: `palette` in `packages/starship/.config/starship/starship.toml`
- Ghostty: `theme` in `packages/ghostty/.config/ghostty/config`
- k9s: `ui.skin` in `packages/k9s/.config/k9s/config.yaml`, skins under `skins/`

### Local Overrides

All gitignored:

- Git: `packages/git/.config/git/.gitconfig-local` - included by the main config for machine-specific settings
- Shell: `packages/zsh/.config/zsh/conf.d/99_private-environment.zsh` - loaded automatically by the `conf.d` glob
- Shell: `~/.env` - sourced by `10_environment.zsh` if present, one `export` per line

## Troubleshooting

### Common Issues

**Stow conflicts:**

```bash
cd packages
stow -v -R -t "${HOME}" <package>   # Restow (unstow + stow)
```

Stow refuses to overwrite a real file. Move or delete the conflicting file, then restow.

**Font not displaying:**

- Ensure Nerd Fonts are installed
- Rebuild font cache: `fc-cache -f` (Linux)
- Restart terminal application

**Shell completions missing:**

- Reload shell: `exec zsh`
- Check plugin installation in `${XDG_DATA_HOME:-~/.local/share}/zinit/zinit.git`
- Delete the completion cache and restart: `rm "${XDG_CACHE_HOME:-$HOME/.cache}/zsh/zcompdump"`

## Notes

- **Caveman hooks only**: `bash <(curl -s https://raw.githubusercontent.com/JuliusBrussee/caveman/main/hooks/install.sh)`

## Contributing

This is a personal dotfiles repository, but suggestions and improvements are welcome:

1. Fork the repository
2. Create a feature branch
3. Test changes across platforms
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Catppuccin](https://catppuccin.com/) for the beautiful color scheme
- [GitAlias.com](https://github.com/GitAlias/gitalias) for comprehensive git aliases
- [Zinit](https://github.com/zdharma-continuum/zinit) for fast zsh plugin management
- [Clank](https://github.com/obra/clank) for claude code integration inspiration
- The open source community for modern CLI tool alternatives
