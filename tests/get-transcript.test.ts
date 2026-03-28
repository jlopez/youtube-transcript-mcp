import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { registerGetTranscriptTool } from "../src/tools/get-transcript";

// Mock the youtube module
vi.mock("../src/youtube.js", () => ({
  isYouTubeUrl: vi.fn(),
  fetchYouTubeTranscript: vi.fn(),
}));

// Import the mocked functions so we can control them per-test
const { isYouTubeUrl, fetchYouTubeTranscript } = await import("../src/youtube.js") as {
  isYouTubeUrl: ReturnType<typeof vi.fn>;
  fetchYouTubeTranscript: ReturnType<typeof vi.fn>;
};

type ToolHandler = (args: { url: string; lang?: string }) => Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}>;

/** Capture the callback passed to server.registerTool. */
function captureHandler(): ToolHandler {
  let handler: ToolHandler | undefined;

  const mockServer = {
    registerTool: (_name: string, _opts: unknown, cb: ToolHandler) => {
      handler = cb;
    },
  } as unknown as McpServer;

  registerGetTranscriptTool(mockServer);

  if (!handler)
    throw new Error("registerGetTranscriptTool did not call server.registerTool");

  return handler;
}

describe("get_transcript tool handler", () => {
  let handler: ToolHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = captureHandler();
  });

  it("rejects non-YouTube URLs", async () => {
    isYouTubeUrl.mockReturnValue(false);

    const result = await handler({ url: "https://example.com" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Not a YouTube URL");
    expect(fetchYouTubeTranscript).not.toHaveBeenCalled();
  });

  it("returns error when no transcript is available", async () => {
    isYouTubeUrl.mockReturnValue(true);
    fetchYouTubeTranscript.mockResolvedValue(null);

    const result = await handler({ url: "https://www.youtube.com/watch?v=private" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("No transcript available");
  });

  it("returns formatted transcript on success", async () => {
    isYouTubeUrl.mockReturnValue(true);
    fetchYouTubeTranscript.mockResolvedValue({
      title: "Test Video",
      channel: "Test Channel",
      transcript: "Hello world.",
      url: "https://www.youtube.com/watch?v=abc",
    });

    const result = await handler({ url: "https://www.youtube.com/watch?v=abc" });

    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain("# Test Video");
    expect(text).toContain("**Channel:** Test Channel");
    expect(text).toContain("**Source:**");
    expect(text).toContain("Hello world.");
  });

  it("omits title and channel when empty", async () => {
    isYouTubeUrl.mockReturnValue(true);
    fetchYouTubeTranscript.mockResolvedValue({
      title: "",
      channel: "",
      transcript: "Just transcript.",
      url: "https://www.youtube.com/watch?v=abc",
    });

    const result = await handler({ url: "https://www.youtube.com/watch?v=abc" });

    const text = result.content[0].text;
    expect(text).not.toContain("# ");
    expect(text).not.toContain("**Channel:**");
    expect(text).toContain("**Source:**");
    expect(text).toContain("Just transcript.");
  });

  it("passes lang parameter through", async () => {
    isYouTubeUrl.mockReturnValue(true);
    fetchYouTubeTranscript.mockResolvedValue({
      title: "Video",
      channel: "Channel",
      transcript: "Bonjour.",
      url: "https://www.youtube.com/watch?v=abc",
    });

    await handler({ url: "https://www.youtube.com/watch?v=abc", lang: "fr" });

    expect(fetchYouTubeTranscript).toHaveBeenCalledWith(
      "https://www.youtube.com/watch?v=abc",
      "fr",
    );
  });

  it("catches and reports unexpected errors", async () => {
    isYouTubeUrl.mockReturnValue(true);
    fetchYouTubeTranscript.mockRejectedValue(new Error("Network timeout"));

    const result = await handler({ url: "https://www.youtube.com/watch?v=abc" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Failed to fetch transcript: Network timeout");
  });
});
