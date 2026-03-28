/**
 * YouTube transcript extraction utilities.
 *
 * Extracts transcripts via youtube-transcript (InnerTube API scraping)
 * and video metadata via the free oEmbed endpoint (no API key required).
 *
 * Transcript segments are joined into flowing text with timestamp markers
 * inserted at 1-minute boundaries (e.g. [1:00], [2:00]).
 */

import type { TranscriptResponse } from "youtube-transcript";
import { YoutubeTranscript } from "youtube-transcript";

const YOUTUBE_HOSTNAMES = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

/** Video path prefixes that indicate a playable video (not a channel/playlist page). */
const VIDEO_PATH_PREFIXES = ["/watch", "/shorts/", "/embed/", "/live/"];

/** Check if a URL is a YouTube video URL. Uses URL parsing + hostname allowlist. */
export function isYouTubeUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  }
  catch {
    return false;
  }

  if (!YOUTUBE_HOSTNAMES.has(parsed.hostname))
    return false;

  // youtu.be uses the path as the video ID (e.g. youtu.be/dQw4w9WgXcQ)
  if (parsed.hostname === "youtu.be")
    return parsed.pathname.length > 1;

  return VIDEO_PATH_PREFIXES.some(prefix => parsed.pathname.startsWith(prefix));
}

/** oEmbed metadata for a YouTube video. */
interface YouTubeMetadata {
  title: string;
  authorName: string;
  authorUrl: string;
}

/**
 * Fetch video metadata via the YouTube oEmbed endpoint.
 * Free, no API key, returns title + channel info.
 */
async function fetchOEmbed(url: string): Promise<YouTubeMetadata | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok)
      return null;

    const data = await response.json() as Record<string, unknown>;
    return {
      title: String(data.title ?? ""),
      authorName: String(data.author_name ?? ""),
      authorUrl: String(data.author_url ?? ""),
    };
  }
  catch {
    return null;
  }
}

/** Format a millisecond offset as M:SS or H:MM:SS. */
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Join transcript segments into flowing text with timestamp markers
 * at 1-minute boundaries. When segments skip ahead (e.g. 0s -> 5min),
 * the marker reflects the actual position in the video, not every
 * intermediate minute.
 */
export function formatTranscript(segments: TranscriptResponse[]): string {
  if (segments.length === 0)
    return "";

  const parts: string[] = [];
  let nextMarkerMs = 60_000; // first marker at 1:00

  for (const segment of segments) {
    if (segment.offset >= nextMarkerMs) {
      const markerMs = Math.floor(segment.offset / 60_000) * 60_000;
      parts.push(`[${formatTimestamp(markerMs)}]`);
      nextMarkerMs = markerMs + 60_000;
    }
    parts.push(segment.text);
  }

  return parts.join(" ");
}

export interface YouTubeResult {
  title: string;
  channel: string;
  transcript: string;
  url: string;
}

/**
 * Fetch transcript and metadata for a YouTube video.
 * Returns null if the transcript cannot be retrieved.
 */
export async function fetchYouTubeTranscript(url: string, lang = "en"): Promise<YouTubeResult | null> {
  const [segments, metadata] = await Promise.all([
    YoutubeTranscript.fetchTranscript(url, { lang })
      .catch(() => null),
    fetchOEmbed(url),
  ]);

  if (!segments || segments.length === 0) {
    return null;
  }

  const transcript = formatTranscript(segments);

  return {
    title: metadata?.title ?? "",
    channel: metadata?.authorName ?? "",
    transcript,
    url,
  };
}
