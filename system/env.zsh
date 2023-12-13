export HOMEBREW_NO_ENV_HINTS=1
export GPG_TTY=$(tty)
gpg-connect-agent updatestartuptty /bye
unset SSH_AGENT_PID
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
gpgconf --launch gpg-agent
export XDG_CONFIG_HOME="$HOME/.config"