import { describe, expect, it } from "vitest";

import { formatTranscript, isYouTubeUrl } from "../src/youtube";

describe("isYouTubeUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "http://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/abc123",
    "https://youtube.com/embed/abc123",
    "https://www.youtube.com/live/abc123",
  ])("recognizes %s as YouTube", (url) => {
    expect(isYouTubeUrl(url)).toBe(true);
  });

  it.each([
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
  ])("recognizes mobile URL %s", (url) => {
    expect(isYouTubeUrl(url)).toBe(true);
  });

  it.each([
    "https://www.reuters.com/article/test",
    "https://example.com/youtube.com/watch",
    "https://notyoutube.com/watch?v=abc",
    "https://www.youtube.com/channel/UCabc",
    "https://www.youtube.com/playlist?list=abc",
    // SSRF: hostname spoofing via subdomain
    "https://www.youtube.com.evil.com/watch?v=abc",
    "https://youtube.com.evil.com/watch?v=abc",
    // bare youtu.be with no video ID
    "https://youtu.be/",
    // not a URL at all
    "not a url",
  ])("rejects %s as not YouTube", (url) => {
    expect(isYouTubeUrl(url)).toBe(false);
  });
});

describe("formatTranscript", () => {
  it("returns empty string for empty segments", () => {
    expect(formatTranscript([])).toBe("");
  });

  it("joins segments without timestamps for content under 1 minute", () => {
    const segments = [
      { text: "Hello everyone.", offset: 0, duration: 3000 },
      { text: "Welcome to the show.", offset: 3000, duration: 4000 },
      { text: "Today we discuss politics.", offset: 7000, duration: 5000 },
    ];

    const result = formatTranscript(segments);
    expect(result).toBe("Hello everyone. Welcome to the show. Today we discuss politics.");
    expect(result).not.toContain("[");
  });

  it("inserts timestamp at 1-minute boundary", () => {
    const segments = [
      { text: "Before the mark.", offset: 55_000, duration: 5000 },
      { text: "After the mark.", offset: 61_000, duration: 5000 },
    ];

    const result = formatTranscript(segments);
    expect(result).toBe("Before the mark. [1:00] After the mark.");
  });

  it("inserts timestamps at multiple minute boundaries", () => {
    const segments = [
      { text: "Intro.", offset: 0, duration: 5000 },
      { text: "First point.", offset: 65_000, duration: 5000 },
      { text: "Second point.", offset: 125_000, duration: 5000 },
      { text: "Third point.", offset: 185_000, duration: 5000 },
    ];

    const result = formatTranscript(segments);
    expect(result).toBe("Intro. [1:00] First point. [2:00] Second point. [3:00] Third point.");
  });

  it("formats hours for long videos", () => {
    const segments = [
      { text: "Almost there.", offset: 3_599_000, duration: 1000 },
      { text: "One hour in.", offset: 3_600_000, duration: 5000 },
    ];

    const result = formatTranscript(segments);
    expect(result).toContain("[1:00:00]");
  });

  it("places marker at actual position when segments jump ahead", () => {
    const segments = [
      { text: "Start.", offset: 0, duration: 5000 },
      { text: "Five minutes later.", offset: 300_000, duration: 5000 },
    ];

    const result = formatTranscript(segments);
    expect(result).toBe("Start. [5:00] Five minutes later.");
    expect(result).not.toContain("[1:00]");
  });
});
