#=============================================================================
# Platform-Specific Configuration
#=============================================================================

OS=$(uname)

# OS-specific initialization
case $OS in
    "Darwin")
        # macOS specific setup - handle both Intel and Apple Silicon
        if [ -f "/opt/homebrew/bin/brew" ]; then
            eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [ -f "/usr/local/bin/brew" ]; then
            eval "$(/usr/local/bin/brew shellenv)"
        fi
        ;;
    "Linux")
        # Linux specific setup
        if [ -f "/etc/os-release" ]; then
            . "/etc/os-release"
        fi
        ;;
esac
