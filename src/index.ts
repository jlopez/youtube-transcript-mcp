import process from "node:process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerGetTranscriptTool } from "./tools/get-transcript.js";

declare const __VERSION__: string;

async function main(): Promise<void> {
  const server = new McpServer({
    name: "youtube-transcript",
    version: __VERSION__,
  });

  registerGetTranscriptTool(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[youtube-transcript] MCP server v${__VERSION__} started (stdio)`);
}

main().catch((err) => {
  console.error("[youtube-transcript] Fatal:", err);
  process.exit(1);
});
