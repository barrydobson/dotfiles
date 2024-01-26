#!/usr/bin/env zsh

if (( $+commands[terraform] )); then
  alias tf=terraform
fi

if (( $+commands[terragrunt] )); then
  alias tg=terragrunt
fi

if (( $+commands[kubectl] )); then
  alias kafhere="kubectl apply -f - <<EOF"
fi

if (( $+commands[kustomize] )); then
  alias kb="kustomize build --enable-alpha-plugins --load-restrictor=LoadRestrictionsNone --enable-exec"
fi

alias dockerclean='docker system prune --all'
alias less='less --force --no-init --hilite-search --ignore-case --SILENT --status-column --underline-special'
alias tmp=' cd $(mktemp -d)'
alias reload="exec $SHELL -l"
alias myip="curl ipinfo.io/ip"
alias ls="gls -F --color=auto"
alias l="ls -lAh --color=auto"
alias ll="ls -l --color=auto"
alias la="ls -Al --color=auto"

# allow for common cd typo
alias cd..="cd .."