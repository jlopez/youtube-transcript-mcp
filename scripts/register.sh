#!/usr/bin/env bash
# Register the YouTube transcript MCP server with Claude Code.
# Builds the project first, then registers using claude mcp add.
#
# Usage:
#   ./scripts/register.sh              # register with --scope user
#   ./scripts/register.sh --scope project  # override scope
#   ./scripts/register.sh -n           # dry-run: print the command without executing

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SCOPE="user"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --scope)
      SCOPE="$2"
      shift 2
      ;;
    -n|--dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Usage: $0 [--scope user|project] [-n|--dry-run]" >&2
      exit 1
      ;;
  esac
done

if ! command -v claude &>/dev/null; then
  echo "Error: 'claude' CLI not found on \$PATH" >&2
  exit 1
fi

echo "Building MCP server..."
cd "$PACKAGE_DIR"
pnpm build

CMD=(claude mcp add youtube-transcript --scope "$SCOPE" -- node "$PACKAGE_DIR/dist/index.js")

if $DRY_RUN; then
  echo ""
  echo "Dry run — command that would be executed:"
  echo "  ${CMD[*]}"
  echo ""
  echo "You can also install globally via npx:"
  echo "  claude mcp add youtube-transcript --scope user -- npx @jesusla/youtube-transcript-mcp"
  exit 0
fi

"${CMD[@]}"

echo "Done. youtube-transcript MCP server registered (scope: $SCOPE)."
echo ""
echo "You can also install globally via npx:"
echo "  claude mcp add youtube-transcript --scope user -- npx @jesusla/youtube-transcript-mcp"
