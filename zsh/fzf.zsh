#!/usr/bin/env zsh

export FZF_DEFAULT_COMMAND="fd --type f --hidden --follow --exclude .git --color=always"
export FZF_CTRL_T_COMMAND="${FZF_DEFAULT_COMMAND}"

export FZF_DEFAULT_OPTS="--ansi --color=16 --height=40% --reverse"