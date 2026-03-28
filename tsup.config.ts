import { readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const { version } = JSON.parse(readFileSync("package.json", "utf-8"));

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  target: "node22",
  sourcemap: true,
  clean: true,
  skipNodeModulesBundle: true,
  // youtube-transcript has broken CJS/ESM dual packaging: "type": "module" but
  // "main" points to .common.js which fails at runtime. Bundle it so the ESM
  // source is inlined and the broken entrypoint is never hit.
  noExternal: ["youtube-transcript"],
  banner: {
    js: "#!/usr/bin/env node",
  },
  define: {
    __VERSION__: JSON.stringify(version),
  },
});
