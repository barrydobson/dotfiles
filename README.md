# dotfiles

Personal dotfiles, managed with [`chezmoi`](https://github.com/twpayne/chezmoi).

## Environment Variables

Set the follwing environment variables to determine some of the tooling installed

| Name                     | Description                | Default | Required |
|--------------------------|----------------------------|---------|----------|
| OP_SERVICE_ACCOUNT_TOKEN | 1Password token            |         | yes      |
| WITHOUT_TOOLCHAINS       | Disable all toolchains     | false   | no       |
| WITHOUT_<TOOLCHAIN_NAME> | Disable specific toolchain | false   | no       |
| WITH_<TOOLCHAIN_NAME>    | Enable specific toolchain  | true    | no       |

## Tool Chains

The following values are available for the `TOOLCHAIN_NAME` value

| Name       | Enabled by Default |
|------------|--------------------|
| AWS        | false              |
| DOCKER     | false              |
| GOLANG     | true               |
| IAC        | false              |
| KUBERNETES | false              |
| NODE       | true               |
| PYTHON     | false              |
| OPS        | false              |

## Installation

Install them with:

```sh
OP_SERVICE_ACCOUNT_TOKEN=abc12343 \
WITHOUT_TOOLCHAINS=true \
sh -c "$(curl -fsSL https://raw.githubusercontent.com/barrydobson/dotfiles/main/install.sh)"
```

or

```sh
OP_SERVICE_ACCOUNT_TOKEN=abc12343 \
WITHOUT_TOOLCHAINS=true \
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --one-shot barrydobson
```
