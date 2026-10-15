import { execFileSync } from "node:child_process";
import { build } from "esbuild";

// Builds demo/dist; open demo/index.html in a browser to try the components
execFileSync("npx", ["@tailwindcss/cli", "-i", "demo/styles.css", "-o", "demo/dist/demo.css", "--minify"], {
  stdio: "inherit",
});

await build({
  entryPoints: ["demo/main.jsx"],
  bundle: true,
  format: "iife",
  jsx: "automatic",
  outfile: "demo/dist/demo.js",
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  logLevel: "info",
});
