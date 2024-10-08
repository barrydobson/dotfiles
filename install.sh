#!/usr/bin/env bash

echo_task() {
  printf "\033[0;34m--> %s\033[0m\n" "$*"
}

error() {
  printf "\033[0;31m%s\033[0m\n" "$*" >&2
  exit 1
}

# -e: exit on error
# -u: exit on unset variables
set -eu

if ! chezmoi="$(command -v chezmoi)"; then
	bin_dir="${HOME}/.local/bin"
	chezmoi="${bin_dir}/chezmoi"
	echo_task "Installing chezmoi to '${chezmoi}'"
	if command -v curl >/dev/null; then
		sh -c "$(curl -fsLS https://get.chezmoi.io)" -- -b "$bin_dir"
	elif command -v wget >/dev/null; then
		sh -c "$(wget -qO- https://get.chezmoi.io)" -- -b "$bin_dir"
	else
		error "To install chezmoi, you must have curl or wget installed."
		exit 1
	fi
else
  chezmoi=chezmoi
fi

echo_task "Setting up chezmoi"

# POSIX way to get script's dir: https://stackoverflow.com/a/29834779/12156188
script_dir="$(cd -P -- "$(dirname -- "$(command -v -- "$0")")" && pwd -P)"
exec "$chezmoi" init --apply "--source=$script_dir" "$@"
