#!/usr/bin/env zsh

setopt no_global_rcs

umask 022

export DOTFILES="${HOME}/.dotfiles"
export ZSH=$HOME/.oh-my-zsh
if [[ ! -d "$HOME/.zsh-cache" ]]; then
  mkdir $HOME/.zsh-cache
fi

export ZSH_CACHE_DIR=$HOME/.zsh-cache
typeset -gx -U path
path=( \
  /usr/local/sbin(N-/) \
  /usr/local/bin(N-/) \
  ~/bin(N-/) \
  "$path[@]" \
)

export PATH="$(brew --prefix gnu-sed)/libexec/gnubin:$PATH"
export PATH="$(brew --prefix gnu-tar)/libexec/gnubin:$PATH"
export PATH="$(brew --prefix coreutils)/libexec/gnubin:$PATH"

# zsh tmux settings
ZSH_TMUX_AUTOSTART='true'
ZSH_TMUX_AUTOCONNECT='false'
DEFAULT_USER="$(whoami)"
ZSH_THEME=powerlevel10k/powerlevel10k
zstyle ':bracketed-paste-magic' active-widgets '.self-*'

autoload -Uz compinit
typeset -i updated_at=$(date +'%j' -r ~/.zcompdump 2>/dev/null || stat -f '%Sm' -t '%j' ~/.zcompdump 2>/dev/null)
if [[ $(date +'%j') != ${updated_at} ]]; then
  compinit -i
else
  compinit -C -i
fi

typeset -U config_files
config_files=(${DOTFILES}/zsh/*.zsh)

[[ -f ~/.zsh_plugins.sh ]] && source ~/.zsh_plugins.sh

for file in ${${config_files}:#*/completion.zsh}; do
  source "$file"
done

typeset -gx -U fpath
fpath=( \
  /usr/local/share/zsh/site-functions(N-/) \
  ${DOTFILES}/zsh/functions \
  $fpath \
)

for file in ${(M)config_files:#*/completion.zsh}; do
  source "$file"
done

unset config_files updated_at

autoload -U "${DOTFILES}"/zsh/functions/*(:t)
autoload -Uz zmv
export LISTMAX=50
export WORDCHARS='*?_-.[]~=&;!#$%^(){}<>'



export PATH=$HOME/bin:/usr/local/bin:$PATH

autoload -U +X bashcompinit && bashcompinit
source $ZSH/oh-my-zsh.sh
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export SHOW_AWS_PROMPT=1
export PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin:$PATH"
eval "$(direnv hook zsh)"
