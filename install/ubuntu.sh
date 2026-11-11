#!/bin/bash

# =============================================================================
# Ubuntu/Debian Bootstrap
# =============================================================================
# Installs minimal system packages and mise.
# Tool installation happens via mise after stowing.

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

check_debian_based() {
    if ! command -v apt >/dev/null 2>&1; then
        print_error "This script requires apt (Debian/Ubuntu)."
        exit 1
    fi

    if [[ -f /etc/os-release ]]; then
        # shellcheck disable=SC1091
        source /etc/os-release
        print_status "Detected ${PRETTY_NAME:-${ID}}"
    fi
}

install_system_packages() {
    print_status "Installing system packages..."

    # bubblewrap: Codex's bundled bwrap is blocked by Ubuntu's AppArmor user namespaces
    local packages=(
        bubblewrap
        curl
        fzf
        git
        gnupg
        gpg
        gpg-agent
        locales
        stow
        unzip
        zsh
    )

    if check_sudo_access; then
        sudo apt update
        sudo apt install -y "${packages[@]}"
        print_success "System packages installed"
    else
        print_warning "Cannot install packages automatically - requires sudo"
        print_warning "Run: sudo apt install -y ${packages[*]}"
    fi
}

# macOS ssh forwards LC_* and Ubuntu's sshd accepts it, so every command on the
# box complains unless this locale exists.
configure_locale() {
    local locale="en_GB.UTF-8"
    # locale -a spells it en_GB.utf8
    if locale -a 2>/dev/null | grep -qiE '^en_GB\.utf-?8$'; then
        print_status "Locale ${locale} already generated"
        return
    fi
    if ! check_sudo_access; then
        print_warning "Run: sudo locale-gen ${locale}"
        return
    fi
    _sudo locale-gen "${locale}"
    print_success "Locale ${locale} generated"
}

change_shell() {
    if [[ "${SHELL}" != */zsh ]]; then
        print_status "Changing default shell to zsh..."
        local zsh_path
        zsh_path=$(command -v zsh)
        if _sudo chsh -s "${zsh_path}" "${USER}"; then
            print_success "Default shell changed to zsh (restart required)"
        else
            print_warning "Could not change default shell automatically"
            print_warning "To change manually, run: chsh -s ${zsh_path}"
        fi
    else
        print_status "Default shell is already zsh"
    fi
}

main() {
    check_debian_based
    install_system_packages
    configure_locale
    install_mise
    post_install_setup
    change_shell
}

main "$@"
