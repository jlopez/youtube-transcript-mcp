# youtube-transcript-mcp

An MCP server that extracts YouTube video transcripts. Uses the InnerTube API (no API key required) with metadata from YouTube's free oEmbed endpoint.

## Tools

### `get_transcript`

Fetch the transcript of a YouTube video.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | yes | YouTube video URL |
| `lang` | string | no | Language code (default: `"en"`) |

Returns the video title, channel name, and full transcript text with `[M:SS]` timestamp markers at 1-minute boundaries.

Supports all YouTube URL formats:
- `https://www.youtube.com/watch?v=...`
- `https://youtu.be/...`
- `https://www.youtube.com/shorts/...`
- `https://www.youtube.com/embed/...`
- `https://www.youtube.com/live/...`

## Installation

### Via npx (recommended)

```bash
claude mcp add youtube-transcript -- npx youtube-transcript-mcp
```

### From source

```bash
git clone https://github.com/jlopez/youtube-transcript-mcp.git
cd youtube-transcript-mcp
pnpm install
pnpm mcp:register
```

The `mcp:register` script builds the project and registers it with Claude Code (`--scope user` by default). Use `-n` for a dry run or `--scope project` to override.

## Development

```bash
pnpm install        # install dependencies
pnpm dev            # run with watch mode (tsx)
pnpm build          # build with tsup
pnpm test           # run tests
pnpm test:watch     # run tests in watch mode
pnpm typecheck      # type check
pnpm lint           # lint
pnpm lint:fix       # lint with auto-fix
```

## License

MIT
