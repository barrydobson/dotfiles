# ~/.zshenv exports ZDOTDIR, so child zsh processes read this file instead of
# ~/.zshenv. Without it they inherit a stale environment and skip ~/.env.
source "${HOME}/.zshenv"
