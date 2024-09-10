# dotfiles

Personal dotfiles, managed with [`chezmoi`](https://github.com/twpayne/chezmoi).

## Environment Variables

Set the follwing environment variables to determine some of the tooling installed

| Name                     | Description                | Default | Required |
|--------------------------|----------------------------|---------|----------|
| OP_SERVICE_ACCOUNT_TOKEN | 1Password token            |         | yes      |
| WITHOUT_TOOLCHAINS       | Disable all toolchains     | false   | no       |
| WITHOUT_<TOOLCHAIN_NAME> | Disable specific toolchain | false   | no       |
| WITH_TOOLCHAINS          | Enabled all toolchains     | false   | no       |
| WITH_<TOOLCHAIN_NAME>    | Enable specific toolchain  | false   | no       |

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

Details on which tools are installed are below.

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

## Tools

### Managed by [Aqua](home/private_dot_config/exact_aqua/aqua.yaml.tmpl)

| Name                      | Toolchain  |
|---------------------------|------------|
| ahmetb/kubectx            | Kubernetes |
| ahmetb/kubectx/kubens     | Kubernetes |
| aquasecurity/trivy        | Ops        |
| argoproj/argo-cd          | Ops        |
| aws/aws-cli               | AWS        |
| cli/cli                   | Common     |
| dandavison/delta          | Common     |
| derailed/k9s              | Kubernetes |
| derailed/popeye           | Kubernetes |
| docker/cli                | Docker     |
| fullstorydev/grpcurl      | Ops        |
| go-task/task              | Common     |
| hashicorp/vault           | Ops        |
| helm/helm                 | Kubernetes |
| helmfile/helmfile         | Kubernetes |
| hidetatz/kubecolor        | Kubernetes |
| homeport/dyff             | Kubernetes |
| jqlang/jq                 | Common     |
| junegunn/fzf              | Common     |
| koalaman/shellcheck       | IAC        |
| kubernetes-sigs/kind      | Kubernetes |
| kubernetes-sigs/kustomize | Kubernetes |
| kubernetes/kubectl        | Kubernetes |
| loft-sh/devpod            | Kubernetes |
| mike-engel/jwt-cli        | Common     |
| mikefarah/yq              | Common     |
| mozilla/sops              | IAC        |
| nektos/act                | Ops        |
| neovim/neovim             | Common     |
| open-policy-agent/opa     | Ops        |
| pre-commit/pre-commit     | Common     |
| stern/stern               | Kubernetes |
| terraform-linters/tflint  | IAC        |
| wagoodman/dive            | Docker     |
| yannh/kubeconform         | Kubernetes |

### Managed by [ASDF](home/.chezmoiscripts/common/run_onchange_after_15_install-asdf-packages.tmpl)

| Name       | Toolchain |
|------------|-----------|
| direnv     | Common    |
| golang     | GoLang    |
| NodeJS     | Node      |
| Python     | Python    |
| Terraform  | IAC       |
| Terragrunt | IAC       |

### Managed by Package Manager

| Name             | Toolchain | OS     |
|------------------|-----------|--------|
| bash             | Common    | All    |
| bat              | Common    | All    |
| coreutils        | Common    | All    |
| curl             | Common    | All    |
| direnv           | Common    | All    |
| eza              | Common    | All    |
| fd               | Common    | Darwin |
| fd-find          | Common    | Ubuntu |
| git              | Common    | All    |
| git-delta        | Common    | All    |
| gnupg            | Common    | All    |
| httpie           | Common    | All    |
| jq               | Common    | All    |
| neovim           | Common    | All    |
| procs            | Common    | Darwin |
| ripgrep          | Common    | All    |
| sd               | Common    | Darwin |
| tmux             | Common    | All    |
| tokei            | Common    | Darwin |
| twingate         | Common    | Darwin |
| wget             | Common    | All    |
| zsh              | Common    | All    |
| build-essential  | Python    | Ubuntu |
| curl             | Python    | Ubuntu |
| libbz2-dev       | Python    | Ubuntu |
| libffi-dev       | Python    | Ubuntu |
| liblzma-dev      | Python    | Ubuntu |
| libncursesw5-dev | Python    | Ubuntu |
| libreadline-dev  | Python    | Ubuntu |
| libsqlite3-dev   | Python    | Ubuntu |
| libssl-dev       | Python    | Ubuntu |
| libxml2-dev      | Python    | Ubuntu |
| libxmlsec1-dev   | Python    | Ubuntu |
| llvm             | Python    | Ubuntu |
| make             | Python    | Ubuntu |
| tk-dev           | Python    | Ubuntu |
| wget             | Python    | Ubuntu |
| xz-utils         | Python    | Ubuntu |
| zlib1g-dev       | Python    | Ubuntu |

The installation method will differ by OS.

- Darwin = brew/mas
- Ubuntu = apt-get
