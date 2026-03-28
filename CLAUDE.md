# youtube-transcript-mcp

MCP server that extracts YouTube video transcripts via the `youtube-transcript` library (InnerTube API scraping) and video metadata via YouTube's free oEmbed endpoint. No API keys required.

## Architecture

- `src/index.ts` — MCP server entry point (stdio transport, version injected at build time via tsup `define`)
- `src/youtube.ts` — YouTube utilities: URL validation (hostname allowlist), oEmbed metadata, transcript fetching and formatting with timestamp markers
- `src/tools/get-transcript.ts` — `get_transcript` MCP tool registration (Zod schema, handler)
- `scripts/register.sh` — Local registration script (`claude mcp add`, supports `--scope` and `-n` dry-run)

## Key decisions

- **youtube-transcript CJS/ESM workaround**: The `youtube-transcript` package has broken dual packaging (`"type": "module"` but `"main"` points to CJS). Solved with `noExternal: ["youtube-transcript"]` in tsup (bundles it) and a `resolve.alias` in vitest config.
- **URL validation**: Uses `new URL()` + hostname allowlist instead of regex to prevent SSRF. Does not extract video IDs — leaves that to the library.
- **Version injection**: `__VERSION__` is replaced at build time via tsup `define` reading from `package.json`. No hardcoded version in source.

## Commands

```bash
pnpm build          # build (tsup, ESM, node22 target)
pnpm test           # run tests (vitest)
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint
pnpm mcp:register   # build + register with claude CLI
```
