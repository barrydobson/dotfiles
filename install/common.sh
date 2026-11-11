#!/bin/bash

# =============================================================================
# Common functions shared across install scripts
# =============================================================================
# Source this file rather than executing it directly.

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "This script must be sourced, not executed directly." >&2
    exit 1
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if sudo is available without a password prompt
check_sudo_access() {
    if sudo -n true 2>/dev/null; then
        print_status "Sudo access available without password"
        return 0
    else
        print_warning "Sudo requires password - some operations may be skipped"
        print_warning "You may need to run some commands manually with sudo"
        return 1
    fi
}

_sudo() {
    if [[ ${EUID} -eq 0 ]]; then
        "$@"
    else
        sudo "$@"
    fi
}

# Install mise (https://mise.jdx.dev)
install_mise() {
    print_status "Installing mise..."

    if command -v mise >/dev/null 2>&1; then
        print_status "mise is already installed"
        return
    fi

    curl -fsSL https://mise.run | sh
    export PATH="${HOME}/.local/bin:${PATH}"
    print_success "mise installed"
}

install_1password_cli() {
  if command -v op >/dev/null 2>&1; then
    print_status "1Password CLI is already installed"
    return
  fi

  print_status "Installing 1Password CLI..."
  local arch
  arch="$(dpkg --print-architecture)"

  # Add the key for the 1Password apt repository:
  if [[ -f /usr/share/keyrings/1password-archive-keyring.gpg ]]; then
    print_status "1Password repository key already exists"
  else
    print_status "Adding 1Password repository key..."
    curl -sS https://downloads.1password.com/linux/keys/1password.asc | sudo gpg --dearmor --output /usr/share/keyrings/1password-archive-keyring.gpg
    print_success "1Password repository key added"
  fi

  if [[ -f /etc/apt/sources.list.d/1password.list ]]; then
    print_status "1Password repository already exists"
  else
    print_status "Adding 1Password repository..."
    echo "deb [arch=${arch} signed-by=/usr/share/keyrings/1password-archive-keyring.gpg] https://downloads.1password.com/linux/debian/${arch} stable main" | sudo tee /etc/apt/sources.list.d/1password.list
    print_success "1Password repository added"
  fi

  # Add the debsig-verify policy:
  sudo mkdir -p /etc/debsig/policies/AC2D62742012EA22/ && \
    curl -sS https://downloads.1password.com/linux/debian/debsig/1password.pol | \
    sudo tee /etc/debsig/policies/AC2D62742012EA22/1password.pol && \
    sudo mkdir -p /usr/share/debsig/keyrings/AC2D62742012EA22 && \
    curl -sS https://downloads.1password.com/linux/keys/1password.asc | \
    sudo gpg --dearmor --output /usr/share/debsig/keyrings/AC2D62742012EA22/debsig.gpg

  print_status "Installing 1Password CLI with apt-get..."
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends 1password-cli
}

install_starship() {
    print_status "Installing Starship prompt..."

    if command -v starship >/dev/null 2>&1; then
        print_status "Starship is already installed"
        return
    fi

    # -b: the default /usr/local/bin needs sudo, and the installer then prompts for it
    curl -fsSL https://starship.rs/install.sh | sh -s -- --yes -b "${HOME}/.local/bin"
    print_success "Starship prompt installed"
}

# Install TPM (Tmux Plugin Manager)
install_tpm() {
    print_status "Installing TPM (Tmux Plugin Manager)..."

    # Must match the `run` line at the bottom of tmux.conf
    local tpm_dir="${HOME}/.config/tmux/plugins/tpm"

    if [[ ! -d "${tpm_dir}" ]]; then
        mkdir -p "${HOME}/.config/tmux/plugins"
        git clone https://github.com/tmux-plugins/tpm "${tpm_dir}"
        print_success "TPM installed"
    else
        print_status "TPM is already installed"
    fi
}

# Install Tavily CLI
install_tavily_cli() {
    print_status "Installing Tavily CLI..."
    if command -v tvly >/dev/null 2>&1; then
        print_status "Tavily CLI is already installed"
        return
    fi

    curl -fsSL https://cli.tavily.com/install.sh | bash
    print_success "Tavily CLI installed"
}

# Agent CLIs from their vendor installers, all into ~/.local/bin. macOS gets
# skillshare from Homebrew; the others install the same way on both.
install_claude_code() {
    if command -v claude >/dev/null 2>&1; then
        print_status "Claude Code is already installed"
        return
    fi
    print_status "Installing Claude Code..."
    curl -fsSL https://claude.ai/install.sh | bash
    print_success "Claude Code installed"
}

install_codex() {
    if command -v codex >/dev/null 2>&1; then
        print_status "Codex is already installed"
        return
    fi
    print_status "Installing Codex..."
    # Without this the installer stops to ask "Start Codex now?"
    curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
    print_success "Codex installed"
}

install_herdr_core() {
    if command -v herdr-core >/dev/null 2>&1; then
        print_status "herdr-core is already installed"
        return
    fi
    print_status "Installing herdr-core..."
    curl -fsSL https://releases.herdr.dev/core/install.sh | sh
    print_success "herdr-core installed"
}

install_skillshare() {
    if command -v skillshare >/dev/null 2>&1; then
        print_status "skillshare is already installed"
        return
    fi
    print_status "Installing skillshare..."
    curl -fsSL https://raw.githubusercontent.com/runkids/skillshare/main/install.sh | sh
    print_success "skillshare installed"
}

# ~/.local/bin is on PATH before anything is installed into it
post_install_setup() {
    mkdir -p "${HOME}/.local/bin"
}

# For config files the app also writes to, so they are not stowed. Merges the repo's
# copy into the live file: repo keys win (arrays are replaced, not joined), every other
# key the app wrote is kept. Usage: merge_config <json|toml> <repo file> <live file>
merge_config() {
    local fmt=$1 common=$2 dest=$3
    local dir yq tmp
    dir=$(dirname "${dest}")

    # Old stow links, to the file or a folded parent dir, would make the write land in the repo
    if [[ -L "${dir}" && "$(readlink "${dir}")" == *packages/* ]]; then
        rm "${dir}"
    fi
    if [[ -L "${dest}" ]]; then
        rm "${dest}"
    fi
    mkdir -p "${dir}"

    # On Linux yq comes from mise, whose shims may not be on PATH yet
    if ! yq=$(command -v yq || mise which yq 2>/dev/null); then
        if [[ -e "${dest}" ]]; then
            print_warning "yq is not installed, skipping merge into ${dest}"
        else
            cp "${common}" "${dest}"
            print_success "Copied ${dest}"
        fi
        return
    fi
    [[ -e "${dest}" ]] || : >"${dest}"

    tmp=$(mktemp)
    # $f is a yq variable. Comments are dropped so the repo file's header is not copied in.
    # shellcheck disable=SC2016
    "${yq}" ea -p "${fmt}" -o "${fmt}" '(. as $f ireduce ({}; . * $f)) | ... comments = ""' "${dest}" "${common}" >"${tmp}"
    if cmp -s "${tmp}" "${dest}"; then
        rm "${tmp}"
        print_status "${dest} already has the repo settings"
        return
    fi
    mv "${tmp}" "${dest}"
    chmod 600 "${dest}"
    print_success "Merged repo settings into ${dest}"
}

# Restow so re-runs pick up new files. Callers must set DOTFILES_DIR.
stow_packages() {
    print_status "Stowing: $*"
    (cd "${DOTFILES_DIR}/packages" && stow -v -R -t "${HOME}" "$@")
    print_success "Packages stowed"
}
