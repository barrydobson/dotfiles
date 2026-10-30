#=============================================================================
# Tool Initialization
#=============================================================================

# Initialize zoxide (smart cd)
if command -v zoxide >/dev/null 2>&1; then
  eval "$(zoxide init zsh --cmd cd)"
fi

# Initialize starship prompt
if command -v starship >/dev/null 2>&1; then
  eval "$(starship init zsh)"
fi

# fzf — key bindings (CTRL-T, ALT-C) and fd-backed completion helpers.
# Must load before atuin so atuin's CTRL-R binding takes precedence.
if [[ -n "$HOMEBREW_PREFIX" ]] && [[ -d "$HOMEBREW_PREFIX/opt/fzf" ]]; then
  source "$HOMEBREW_PREFIX/opt/fzf/shell/key-bindings.zsh" 2>/dev/null
  source "$HOMEBREW_PREFIX/opt/fzf/shell/completion.zsh" 2>/dev/null
elif [[ -f ~/.fzf.zsh ]]; then
  source ~/.fzf.zsh
fi

if command -v fd >/dev/null 2>&1; then
  export FZF_DEFAULT_COMMAND="fd --hidden --strip-cwd-prefix --exclude .git"
  export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
  export FZF_ALT_C_COMMAND="fd --type=d --hidden --strip-cwd-prefix --exclude .git"

  _fzf_compgen_path() {
    fd --hidden --exclude .git . "$1"
  }

  _fzf_compgen_dir() {
    fd --type=d --hidden --exclude .git . "$1"
  }
fi

# Initialize atuin (shell history) — loads after fzf so its CTRL-R binding wins
if command -v atuin >/dev/null 2>&1; then
  eval "$(atuin init zsh)"
fi

#=============================================================================
# Terminal Integration
#=============================================================================

if [[ "$TERM_PROGRAM" == "vscode" ]] && command -v code >/dev/null 2>&1; then
  source "$(code --locate-shell-integration-path zsh)"
fi

#=============================================================================
# mise (runtime version manager)
#=============================================================================

if command -v mise >/dev/null 2>&1; then
  export MISE_NODE_COREPACK=1
  eval "$(mise activate zsh)"
fi
