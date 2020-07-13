#!/usr/bin/env zsh

export HISTFILE=~/.zsh_history
export HISTSIZE=10000
export SAVEHIST=10000
if [[ ${UID} == 0 ]]; then
  unset HISTFILE
  export SAVEHIST=0
fi

setopt append_history
setopt extended_history
setopt hist_expire_dups_first
setopt hist_find_no_dups
setopt hist_ignore_all_dups
setopt hist_ignore_space
setopt hist_no_functions
setopt hist_no_store
setopt hist_reduce_blanks
setopt hist_save_no_dups
setopt hist_verify
setopt share_history