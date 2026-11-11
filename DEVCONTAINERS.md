# Devcontainers

A minimal entry point for using these dotfiles inside ephemeral VSCode
devcontainers. The full bootstrap (`install.sh`) is built for a long-lived
workstation and pulls in tools that aren't useful in a throwaway container,
so devcontainers get their own narrowly-scoped script.

## How VSCode wires this up

VSCode supports a personal "dotfiles" workflow per user, independent of any
shared `devcontainer.json`. After the container starts, VSCode clones a
nominated repo into the container as the remote user and runs an install
command.

Configure it in your **user** settings (Settings JSON, not the repo's
`devcontainer.json`):

```jsonc
{
  "dotfiles.repository": "barrydobson/dotfiles",
  "dotfiles.targetPath": "~/dotfiles",
  "dotfiles.installCommand": "~/dotfiles/install/devcontainer.sh"
}
```

Because this lives in your personal settings, it doesn't affect collaborators
on shared repos — each developer points at their own dotfiles.

Reference: <https://code.visualstudio.com/docs/devcontainers/containers#_personalizing-with-dotfile-repositories>

## Prerequisites (must be in the container image)

The script runs as the **remote (non-root) user** with no sudo. It will not
attempt to install system packages. The following must already be on `PATH`,
typically baked into the base image's Dockerfile:

| Command | Why                                                  |
| ------- | ---------------------------------------------------- |
| `zsh`   | Target shell for the configuration                   |
| `git`   | VSCode uses it to clone the dotfiles repo            |
| `curl`  | Reserved for future user-space tool installs         |
| `stow`  | Symlinks config files from `packages/` into `$HOME`  |

If any of these are missing, the script fails fast with a clear message
listing what's absent.

## What gets installed

`DEVCONTAINER_PACKAGES` in `install/devcontainer.sh` is the source of truth.
Three packages are stowed into `$HOME`:

- **`zsh`** — `~/.zshenv`, `~/.config/zsh/` (zshrc, conf.d, aliases, functions)
- **`starship`** — `~/.config/starship/starship.toml`
- **`claude`** — `~/.claude/` config, rules and agents. No skills: they come
  from skillshare, which devcontainers do not install

Two settings files are copied rather than stowed, because the apps write to
them: `~/.claude/settings.json` from `install/claude-settings.json`, and
`~/.config/ccstatusline/settings.json` from `install/ccstatusline-settings.json`.
For Claude settings, if `yq` is on `PATH` and the file exists, the repo copy is
merged in instead. The ccstatusline file is only copied when missing.

The zsh config is defensively gated with `command -v` checks, so missing
optional tools (atuin, zoxide, fzf, mise, etc.) are silently skipped — the
shell still starts cleanly with just zsh and starship.

`post_install_setup` creates `~/.local/bin` before stowing, so it is on `PATH`
whether or not anything ends up in it.

The script creates `~/.claude` before stowing, so stow links the files inside it
one by one, as on a workstation. Claude Code's runtime state stays out of the
repo checkout.

## What is **not** installed

Deliberately out of scope to keep the script portable and fast:

- System packages (apt/apk/dnf) — no sudo available
- Default shell change via `chsh` — needs root or a passwd entry change
- Tool binaries (starship, mise, eza, atuin, zoxide, etc.)
- Plugin managers (tpm). Zinit is the exception: `conf.d/05_zinit.zsh` clones it
  into `$XDG_DATA_HOME/zinit/zinit.git` on first shell start
- `bun`, which the Claude Code status line needs (`bunx ccstatusline`); without
  it the status line is simply absent
- `rtk`, referenced by a hook in `settings.json` — the hook fails harmlessly if
  the binary is not there
- Anything from `Brewfile`

If you want starship's prompt to actually render, install the binary
separately. It is fully user-space:

```bash
curl -sS https://starship.rs/install.sh | sh -s -- --yes -b "$HOME/.local/bin"
```

Without it, the `starship init` line in zsh's `conf.d/50_tools.zsh` is
skipped and you get a vanilla zsh prompt.

## Making zsh the default shell

`chsh` won't work without sudo. Set the default terminal profile in
`devcontainer.json` instead:

```jsonc
{
  "customizations": {
    "vscode": {
      "settings": {
        "terminal.integrated.defaultProfile.linux": "zsh"
      }
    }
  }
}
```

Or set `SHELL=/usr/bin/zsh` via `containerEnv`. Both are repo-level and
collaborators-friendly.

## Re-running

The script is idempotent. It uses `stow -R` (restow), which cleanly handles
re-runs whether or not symlinks already exist.
