import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { fetchYouTubeTranscript, isYouTubeUrl } from "../youtube.js";

const DESCRIPTION = `Fetch the transcript of a YouTube video.

Returns the video title, channel name, and full transcript text with timestamp markers at 1-minute boundaries (e.g. [1:00], [2:00]).

Supports all YouTube URL formats:
- https://www.youtube.com/watch?v=...
- https://youtu.be/...
- https://www.youtube.com/shorts/...
- https://www.youtube.com/embed/...
- https://www.youtube.com/live/...

Returns an error if the video has no transcript available (e.g. no captions, private video).`;

const inputSchema = z.object({
  url: z.string().describe("YouTube video URL"),
  lang: z.string().max(10).optional().describe("Language code for transcript (default: \"en\")"),
});

export function registerGetTranscriptTool(server: McpServer): void {
  server.registerTool(
    "get_transcript",
    {
      title: "Get YouTube Transcript",
      description: DESCRIPTION,
      inputSchema,
    },
    async (args) => {
      const { url, lang } = args;

      if (!isYouTubeUrl(url)) {
        return {
          content: [{ type: "text" as const, text: `Not a YouTube URL: ${url}` }],
          isError: true,
        };
      }

      try {
        const result = await fetchYouTubeTranscript(url, lang);

        if (!result) {
          return {
            content: [{ type: "text" as const, text: `No transcript available for: ${url}` }],
            isError: true,
          };
        }

        const parts: string[] = [];
        if (result.title)
          parts.push(`# ${result.title}`);
        if (result.channel)
          parts.push(`**Channel:** ${result.channel}`);
        parts.push(`**Source:** ${result.url}`);
        parts.push("");
        parts.push(result.transcript);

        return {
          content: [{ type: "text" as const, text: parts.join("\n") }],
        };
      }
      catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[youtube-mcp] get_transcript error: ${message}`);
        return {
          content: [{ type: "text" as const, text: `Failed to fetch transcript: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
