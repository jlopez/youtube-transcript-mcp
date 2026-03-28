import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "youtube-transcript": resolve("node_modules/youtube-transcript/dist/youtube-transcript.esm.js"),
    },
  },
  test: {
    globals: true,
  },
});
