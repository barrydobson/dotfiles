export ZDOTDIR="${HOME}/.config/zsh"

# macOS Terminal.app writes session files into $ZDOTDIR, which is a stow
# symlink into the dotfiles repo. Set here because /etc/zshrc reads it
# before ~/.zshrc runs.
export SHELL_SESSIONS_DISABLE=1

#=============================================================================
# PATH
#=============================================================================
# Set in .zshenv, not conf.d, so non-interactive shells (zsh -c, ssh commands,
# git hooks, editor tasks) get the same PATH as an interactive one.

add_to_path() {
  local new_path="$1"
  case ":$PATH:" in
  *":$new_path:"*) ;;
  *) export PATH="$new_path:$PATH" ;;
  esac
}

add_to_path "$HOME/.local/bin"
add_to_path "/opt/nvim/bin"
add_to_path "$HOME/go/bin"
add_to_path "${KREW_ROOT:-$HOME/.krew}/bin"
add_to_path "$HOME/.bun/bin"
add_to_path "$HOME/.groundcover/bin"

#=============================================================================
# Local Environment
#=============================================================================
# Here rather than conf.d for the same reason as PATH above. conf.d only loads
# from .zshrc, so a key set there exists for interactive shells and nothing
# else. Scheduled jobs, agent routines and git hooks all run non-interactively
# and saw nothing, which reads at the far end as "not authenticated" rather
# than as a config bug.
#
# ~/.env uses explicit `export` per line, so no `set -a` here — a blanket
# auto-export would push every future entry into every child process.
#
# Sourced after PATH so entries can reference the binaries it adds.
if [[ -s ~/.env ]]; then
  source ~/.env
fi
