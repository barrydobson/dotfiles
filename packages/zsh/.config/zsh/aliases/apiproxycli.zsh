#=============================================================================
# APIProxyCLI
#=============================================================================

claudex() {
  ANTHROPIC_BASE_URL=http://localhost:8317 \
    ANTHROPIC_AUTH_TOKEN=${APIPROXY_CLAUDEX_KEY} \
    ANTHROPIC_DEFAULT_OPUS_MODEL=gpt-5.6-terra \
    ANTHROPIC_DEFAULT_SONNET_MODEL=gpt-5.6-terra \
    ANTHROPIC_DEFAULT_HAIKU_MODEL=gpt-5.6-luna \
    ANTHROPIC_DEFAULT_FABLE_MODEL=gpt-5.6-sol \
    CLAUDE_CODE_SUBAGENT_MODEL=gpt-5.6-terra \
    command claude "$@"
}
