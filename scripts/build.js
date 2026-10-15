import { rmSync, readFileSync } from "node:fs";
import { build } from "esbuild";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

const shared = {
  bundle: true,
  format: "esm",
  target: "es2022",
  outdir: "dist",
  jsx: "automatic",
  // Peer dependencies come from the app
  external: Object.keys(pkg.peerDependencies ?? {}).flatMap((name) => [name, `${name}/*`]),
  logLevel: "info",
};

rmSync("dist", { recursive: true, force: true });

await Promise.all([
  build({
    ...shared,
    // Components use hooks and portals; Next.js App Router needs the directive on the bundle
    entryPoints: { index: "src/index.js" },
    banner: { js: '"use client";' },
  }),
  build({
    ...shared,
    // Plain date helpers, also safe for server code
    entryPoints: { "date-range": "src/date-range/date-range.js" },
  }),
]);
