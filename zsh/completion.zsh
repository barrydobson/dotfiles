#!/usr/bin/env zsh

setopt auto_menu
setopt complete_in_word

# Use completion menu when two or more options
zstyle ':completion:*:default' menu select=2

# Completion grouping
zstyle ':completion:*:options' description 'yes'
zstyle ':completion:*:descriptions' format '%F{yellow}Completing %B%d%b%f'
zstyle ':completion:*' group-name ''

# Misc completion
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Z}'
zstyle ':completion:*' verbose yes
zstyle ':completion:*' completer _expand _complete _match _prefix _approximate _list _history
zstyle ':completion:*:*files' ignored-patterns '*?.o' '*?~' '*\#'
zstyle ':completion:*' use-cache true
zstyle ':completion:*:*:-subscript-:*' tag-order indexes parameters
zstyle ':completion:*' list-separator '-->'
zstyle ':completion:*:manuals' separate-sections true

# Directory completion
zstyle ':completion:*:cd:*' ignore-parents parent pwd
zstyle ':completion:*' list-colors ${(s.:.)LS_COLORS}

if (( $+commands[kubectl] )); then
  kubectl_cache="${HOME}/.kubectl-cache"
  if [[ "$(whence kubectl)" -nt "${kubectl_cache}" ]] || [[ ! -s "${kubectl_cache}" ]]; then
    kubectl completion zsh > "${kubectl_cache}"
  fi

  source "${kubectl_cache}"
  unset kubectl_cache
fi