# Functions
typeset -gx -U fpath
fpath=( \
    /usr/local/share/zsh/site-functions(N-/) \
    ~/.shell/functions \
    $fpath \
)
autoload -U ~/.shell/functions/*(:t)

source ~/.shell/functions.sh

# Allow local customizations in the ~/.shell_local_before file
if [ -f ~/.shell_local_before ]; then
    source ~/.shell_local_before
fi

# Allow local customizations in the ~/.zshrc_local_before file
if [ -f ~/.zshrc_local_before ]; then
    source ~/.zshrc_local_before
fi

# External plugins (initialized before)
source ~/.zsh/plugins_before.zsh

DEFAULT_USER="$(whoami)"
if [[ "$__CFBundleIdentifier" == "com.jetbrains.rider" ]]; then
    ZSH_THEME="robbyrussell"
else
    ZSH_THEME="powerlevel10k/powerlevel10k"
    # zsh tmux settings
    ZSH_TMUX_AUTOSTART='true'
    ZSH_TMUX_AUTOCONNECT='false'
fi

# Settings
source ~/.zsh/settings.zsh

# Bootstrap
source ~/.shell/bootstrap.sh

# External settings
source ~/.shell/external.sh

# Aliases
source ~/.shell/aliases.sh

# Custom prompt
source ~/.zsh/prompt.zsh

# External plugins (initialized after)
source ~/.zsh/plugins_after.zsh

# Allow local customizations in the ~/.shell_local_after file
if [ -f ~/.shell_local_after ]; then
    source ~/.shell_local_after
fi

# Allow local customizations in the ~/.zshrc_local_after file
if [ -f ~/.zshrc_local_after ]; then
    source ~/.zshrc_local_after
fi

# Allow private customizations (not checked in to version control)
if [ -f ~/.shell_private ]; then
    source ~/.shell_private
fi