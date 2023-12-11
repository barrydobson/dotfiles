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


DEFAULT_USER="$(whoami)"
if [[ "$__CFBundleIdentifier" == "com.jetbrains.rider" ]]; then
  ZSH_THEME="robbyrussell"
else
  ZSH_THEME="powerlevel10k/powerlevel10k"
  # zsh tmux settings
  ZSH_TMUX_AUTOSTART='false'
  ZSH_TMUX_AUTOCONNECT='false'
fi
zstyle ':bracketed-paste-magic' active-widgets '.self-*'

autoload -Uz compinit; compinit
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
plugins=(asdf)
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
export PATH="/usr/local/opt/terraform/bin:$PATH"
export GOPATH=$HOME/go
export GO111MODULE=on
export GOPRIVATE='github.com/thetote/*'
export VSCODE_FORCE_USER_ENV=1

CLEAN PATH
export PATH="/usr/local/share/dotnet:/Users/barrydobson/Library/Python/2.7/bin:$GOPATH/bin:/usr/local/opt/terraform/bin:/Applications/Visual Studio Code.app/Contents/Resources/app/bin:/Users/barrydobson/bin:/usr/local/bin:/usr/local/opt/coreutils/libexec/gnubin:/usr/local/opt/gnu-tar/libexec/gnubin:/usr/local/opt/gnu-sed/libexec/gnubin:/usr/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/opt/liquibase:/usr/local/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/bin:/Applications/Wireshark.app/Contents/MacOS/:${KREW_ROOT:-$HOME/.krew}/bin:/Applications/Rancher Desktop.app/Contents/Resources/resources/darwin/lima/bin"
PATH="/Users/barrydobson/.fig/bin:/Users/barrydobson/.bin:/Users/barrydobson/perl5/bin${PATH:+:${PATH}}"; export PATH;
PERL5LIB="/Users/barrydobson/perl5/lib/perl5${PERL5LIB:+:${PERL5LIB}}"; export PERL5LIB;
PERL_LOCAL_LIB_ROOT="/Users/barrydobson/perl5${PERL_LOCAL_LIB_ROOT:+:${PERL_LOCAL_LIB_ROOT}}"; export PERL_LOCAL_LIB_ROOT;
PERL_MB_OPT="--install_base \"/Users/barrydobson/perl5\""; export PERL_MB_OPT;
PERL_MM_OPT="INSTALL_BASE=/Users/barrydobson/perl5"; export PERL_MM_OPT;
export EDITOR="code --wait"
export GPG_TTY=$(tty)
gpg-connect-agent updatestartuptty /bye
unset SSH_AGENT_PID
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
gpgconf --launch gpg-agent
source <(stern --completion=zsh)
export PATH="$PATH:/Users/barrydobson/.local/bin"
export PATH="$HOME/percona-toolkit-3.3.1/bin:$PATH"
export USE_GKE_GCLOUD_AUTH_PLUGIN=True
export XDG_CONFIG_HOME="$HOME/.config"
export VAULT_ADDR="https://vault.tote.engineering/"
export LOKI_ADDR="https://loki.tote.engineering"
source ~/perl5/perlbrew/etc/bashrc

if [ -d "/usr/local/opt/ruby/bin" ]; then
  export PATH=/usr/local/opt/ruby/bin:$PATH
  export PATH=`gem environment gemdir`/bin:$PATH
fi

export NVM_DIR="$HOME/.config/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

export PATH="/usr/local/opt/mysql-client@5.7/bin:$PATH"
INSTALLATION_PATH=$(brew --prefix switch) && source $INSTALLATION_PATH/switch.sh
source "$HOME/.kube/load-all.sh"
