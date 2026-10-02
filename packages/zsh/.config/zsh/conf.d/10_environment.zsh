#=============================================================================
# Environment Variables
#=============================================================================

# XDG Base Directory Specification
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_CACHE_HOME="$HOME/.cache"
export XDG_DATA_HOME="$HOME/.local/share"
export XDG_STATE_HOME="$HOME/.local/state"
export SSH_CONFIG_HOME="$XDG_CONFIG_HOME/ssh"
export SSH_DATA_HOME="$XDG_DATA_HOME/ssh"
export EZA_CONFIG_DIR="$XDG_CONFIG_HOME/eza"

# Terminal settings
# TERM is deliberately not set here — the terminal emulator and tmux each
# advertise their own, and overriding it loses their capabilities.
export EDITOR=nvim
export VISUAL=nvim
export LANG=en_GB.UTF-8

# herdr 0.9.2+ sets TERM_PROGRAM=herdr, which isn't on Claude Code's hyperlink
# allowlist, so it stops emitting OSC 8 links. Drop once either side fixes it:
# herdrdev/herdr#4748, anthropics/claude-code#83508
[[ "$TERM_PROGRAM" == "herdr" ]] && export FORCE_HYPERLINK=1

# Tool configurations
export STARSHIP_CONFIG=~/.config/starship/starship.toml
export HOMEBREW_BUNDLE_FILE="$HOME/.Brewfile"
export WORDCHARS=''

# History configuration
HISTSIZE=10000000
HISTFILE="$HOME/.zsh_history"
SAVEHIST=$HISTSIZE

# History options — atuin owns recall, so no share_history here
setopt inc_append_history
setopt extended_history
setopt hist_ignore_space
setopt hist_ignore_all_dups
setopt hist_expire_dups_first
setopt hist_save_no_dups
setopt hist_find_no_dups
setopt hist_reduce_blanks
setopt hist_verify

# Shell behaviour
setopt auto_cd
setopt extended_glob
setopt glob_dots
setopt numeric_glob_sort
setopt interactive_comments
setopt no_beep

# Directory stack — makes `cd -<TAB>` useful
setopt auto_pushd
setopt pushd_ignore_dups
setopt pushd_silent

# Completion behaviour
setopt complete_in_word
setopt always_to_end
