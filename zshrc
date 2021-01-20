#!/usr/bin/env zsh

setopt no_global_rcs
export LANG=en_GB.UTF-8
export LC_ALL=en_GB.UTF-8
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



export PATH="$HOME/bin:/usr/local/bin:$PATH"

autoload -U +X bashcompinit && bashcompinit
source $ZSH/oh-my-zsh.sh
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export SHOW_AWS_PROMPT=1
export PATH="/Applications/Visual Studio Code.app/Contents/Resources/app/bin:$PATH"
eval "$(direnv hook zsh)"
autoload -U +X bashcompinit && bashcompinit
complete -o nospace -C /usr/local/bin/kustomize kustomize
export PATH="/usr/local/opt/terraform/bin:$PATH"
export PATH="/Users/barrydobson/istio-1.8.1/bin:$PATH"
export GOPATH=$HOME/go
export GOBIN=$GOPATH/bin
export  VSCODE_FORCE_USER_ENV=1
export CLOUDSDK_PYTHON="/usr/local/opt/python@3.8/libexec/bin/python"
source "/usr/local/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/path.zsh.inc"
source "/usr/local/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/completion.zsh.inc"

# CLEAN PATH
export PATH="$GOPATH/bin:/usr/local/opt/terraform/bin:/Applications/Visual Studio Code.app/Contents/Resources/app/bin:/Users/barrydobson/bin:/usr/local/bin:/usr/local/opt/coreutils/libexec/gnubin:/usr/local/opt/gnu-tar/libexec/gnubin:/usr/local/opt/gnu-sed/libexec/gnubin:/usr/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/opt/liquibase:/Users/barrydobson/istio-1.8.1/bin:/usr/local/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/bin:/Applications/Wireshark.app/Contents/MacOS/"
PATH="/Users/barrydobson/perl5/bin${PATH:+:${PATH}}"; export PATH;
PERL5LIB="/Users/barrydobson/perl5/lib/perl5${PERL5LIB:+:${PERL5LIB}}"; export PERL5LIB;
PERL_LOCAL_LIB_ROOT="/Users/barrydobson/perl5${PERL_LOCAL_LIB_ROOT:+:${PERL_LOCAL_LIB_ROOT}}"; export PERL_LOCAL_LIB_ROOT;
PERL_MB_OPT="--install_base \"/Users/barrydobson/perl5\""; export PERL_MB_OPT;
PERL_MM_OPT="INSTALL_BASE=/Users/barrydobson/perl5"; export PERL_MM_OPT;

export GPG_TTY=$(tty)
gpg-connect-agent updatestartuptty /bye
unset SSH_AGENT_PID
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)