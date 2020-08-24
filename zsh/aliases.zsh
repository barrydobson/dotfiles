#!/usr/bin/env zsh

alias ..=' cd ..'
alias ...=' cd ../..'
alias ....=' cd ../../..'

autoload -Uz run-help
alias help=run-help

if (( $+commands[gcloud] )); then
  alias gcontext='gcloud-context'
  alias new-gcc='new-gcloud-context'
fi

if (( $+commands[git] )); then
  alias ga='git add'
  alias gaa='git add --all'
  alias gap='git add --patch'
  alias gb='git branch'
  alias gba='git branch --all'
  alias gbdf='git branch --delete --force'
  alias gbdr='git branch --delete --remote'
  alias gbm='git branch --move'
  alias gbr='git branch --remote'
  alias gbsu='git branch --set-upstream-to'
  alias gbu='git branch --unset-upstream'
  alias gc='git commit --gpg-sign --signoff --verbose'
  alias gc!='git commit --amend --gpg-sign --signoff --verbose'
  alias gca='git commit --all --gpg-sign --signoff --verbose'
  alias gca!='git commit --all --gpg-sign --amend --signoff --verbose'
  alias gcae='git commit --allow-empty --gpg-sign --signoff --verbose'
  alias gcae!='git commit --allow-empty --gpg-sign --amend --signoff --verbose'
  alias gcm='git checkout master'
  alias gco=git-checkout
  alias gcob='git checkout -b'
  alias gcp='git cherry-pick'
  alias gd='git diff'
  alias gdm='git diff master'
  alias gfa='git fetch --all --tags --prune'
  alias gl='git pull'
  alias glog='git log --color --decorate --graph --oneline'
  alias glstat='git log --color --decorate --stat'
  alias gm='git merge'
  alias gp='git push'
  alias gpdo=git-push-delete-origin
  alias gpf='git push --force'
  alias gpsu='git push --set-upstream'
  alias gpsuo='git push --set-upstream origin'
  alias gradd='git remote add'
  alias grba='git rebase --abort'
  alias grbc='git rebase --continue'
  alias grbi='git rebase --interactive'
  alias grh='git reset HEAD'
  alias grhh='git reset HEAD --hard'
  alias grmv='git remote rename'
  alias grp=git-rebase-preserve-author
  alias grpm='git-rebase-preserve-author master'
  alias grrm='git remote remove'
  alias grset='git remote set-url'
  alias grv='git remote -v'
  alias glum='git pull upstream master'
  alias grum='git rebase upstream/master'
  alias grup='git remote update'
  alias gshow='git show --decorate'
  alias gst='git status --short --branch'
  alias gsta='git stash'
  alias gstp='git stash pop'

  if (( $+commands[git-fresh] )); then
    alias gff='git-fresh -f'
  fi

  if (( $+commands[hub] )); then
    alias git=hub
    alias gpr='git pull-request'
  fi
fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  alias brewski='brew update && \
    brew bundle --global && \
    brew upgrade &&
    brew cleanup && \
    brew doctor'
  alias fixbt='sudo killall coreaudiod'
  alias flushdns='sudo killall -HUP mDNSResponder'
fi

if (( $+commands[terraform] )); then
  alias tf=terraform
  alias tfgp='terraform get --update && terraform plan'
fi

alias dockerclean='docker system prune --all'
alias dotfiles='code ${DOTFILES}'
alias less='less --force --no-init --hilite-search --ignore-case \
  --SILENT --status-column --underline-special'
alias tmp=' cd $(mktemp -d)'
alias watch='watch '

alias afk="/System/Library/CoreServices/Menu\ Extras/User.menu/Contents/Resources/CGSession -suspend"

alias reload="exec $SHELL -l"

alias kafhere="kubectl apply -f - <<EOF"

alias gcloud-dev="gcloud config set project gc-lotto-dev | kubectl config use-context lotto-dev"
alias gcloud-test="gcloud config set project gc-lotto-test | kubectl config use-context lotto-test"
alias gcloud-stage="gcloud config set project gc-lotto-stage | kubectl config use-context lotto-stage"
alias gcloud-prod="gcloud config set project gc-lotto-prod | kubectl config use-context lotto-prod"
alias myip="curl ipinfo.io/ip"
alias mfa=~/.aws/get-aws-creds.sh
