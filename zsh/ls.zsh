#!/usr/bin/env zsh

export TREE_IGNORE="cache|log|logs"

if (( $+commands[exa] )); then
  alias la=' ls --all'
  alias ll=' ls --git --long'
  alias ls=' exa --group-directories-first'
  alias lt=" ls --tree --only-dirs --level=2 --ignore-glob=\"${TREE_IGNORE}\""
  alias ltt=" ls --tree --only-dirs --level=3 --ignore-glob=\"${TREE_IGNORE}\""
  alias lttt=" ls --tree --only-dirs --level=4 --ignore-glob=\"${TREE_IGNORE}\""
  alias ltttt=" ls --tree --only-dirs --level=5 --ignore-glob=\"${TREE_IGNORE}\""
  alias tree=" ls --tree --ignore-glob=\"${TREE_IGNORE}\""
elif (( $+commands[ls] )); then
  if is_osx; then
    alias ls=' ls -GF'
  else
    alias ls=' ls -F --color'
  fi
fi