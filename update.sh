#!/bin/bash

# =============================================================================
# Dotfiles Update
# =============================================================================
# Upgrades the tools install.sh put in place. Run install.sh first on a new machine.
# One failed step is reported and the rest still run.

set -o pipefail

DOTFILES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./install/common.sh
source "${DOTFILES_DIR}/install/common.sh"

FAILED=()

# Runs one step if its tool is installed: step <tool> <label> <command...>
step() {
  local tool=$1 label=$2
  shift 2
  if ! command -v "${tool}" >/dev/null 2>&1; then
    print_status "${label}: ${tool} not installed, skipping"
    return
  fi
  print_status "Updating ${label}..."
  if "$@"; then
    print_success "${label} updated"
  else
    print_error "${label} update failed"
    FAILED+=("${label}")
  fi
}

update_system_packages() {
  if [[ "$(uname)" == "Darwin" ]]; then
    step brew Homebrew sh -c 'brew update && brew upgrade'
  elif check_sudo_access; then
    step apt apt sh -c 'sudo apt-get update && sudo apt-get upgrade -y'
  else
    print_warning "No sudo; run: sudo apt-get update && sudo apt-get upgrade -y"
  fi
}

main() {
  export PATH="${HOME}/.local/bin:${PATH}"

  update_system_packages

  # Homebrew owns mise and starship on macOS
  if [[ "$(uname)" != "Darwin" ]]; then
    step mise "mise itself" mise self-update --yes
    # shellcheck disable=SC2016 # $HOME expands in the inner shell
    step starship Starship sh -c 'curl -fsSL https://starship.rs/install.sh | sh -s -- --yes -b "${HOME}/.local/bin"'
  fi
  # --bump rewrites the pins in packages/mise/.config/mise/config.toml; review the diff
  step mise "mise tools" env MISE_AQUA_GITHUB_ATTESTATIONS=false mise upgrade --bump

  step claude "Claude Code" claude update
  step claude "Claude marketplaces" claude plugin marketplace update
  step codex Codex codex update
  step codex "Codex marketplaces" codex plugin marketplace upgrade
  step herdr-core herdr-core herdr-core update
  # The installer upgrades an existing install
  step tvly "Tavily CLI" sh -c 'curl -fsSL https://cli.tavily.com/install.sh | bash'

  step zsh "Zinit plugins" zsh -ic 'zinit self-update && zinit update --all --quiet'
  step tmux "tmux plugins" "${HOME}/.config/tmux/plugins/tpm/bin/update_plugins" all
  # Writes nvim-pack-lock.json in the repo; commit it
  step nvim "Neovim plugins" nvim --headless '+lua vim.pack.update(nil, { force = true })' +qa

  if ((${#FAILED[@]})); then
    print_error "Failed: ${FAILED[*]}"
    exit 1
  fi
  print_success "All updated. Restart your terminal or run: exec zsh"
}

main "$@"
