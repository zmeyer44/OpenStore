// Renders public/icon/{16,32,48,96,128}.png from the inline Locker logo SVG.
// WXT auto-detects this directory and emits the corresponding manifest icons
// entry, so just running this once after touching the logo is enough.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

// sharp isn't declared as an extension dep — it's only used by this one-off
// icon-render script. Resolve it from the web app, which has it transitively
// via Next.js, so we don't have to bloat extension/package.json.
const here = import.meta.dirname; // /Users/.../apps/extension/scripts
// pnpm leaves sharp in .pnpm/<v>/node_modules/sharp without symlinking it
// into any package's node_modules (since nothing in the workspace declares
// sharp directly). Resolve the .pnpm directory and createRequire from inside
// it so we can `require('sharp')` without adding it as an extension dep.
const { readdirSync } = await import("node:fs");
const workspaceRoot = path.resolve(here, "..", "..", "..");
const pnpmDir = path.join(workspaceRoot, "node_modules", ".pnpm");
const sharpEntry = readdirSync(pnpmDir).find((d) => d.startsWith("sharp@"));
if (!sharpEntry) {
  throw new Error(
    "sharp not found in workspace .pnpm directory — install deps and retry.",
  );
}
const require = createRequire(
  path.join(pnpmDir, sharpEntry, "node_modules", "sharp", "package.json"),
);
const sharp = require("sharp");

const outDir = path.resolve(here, "..", "public", "icon");

const SIZES = [16, 32, 48, 96, 128];

// Render the brand glyph in primary blue on a transparent background so the
// toolbar icon picks up the user's Chrome theme. Chrome will tint the icon
// for accessibility on dark themes; we stick with brand blue and let the
// alpha do the work.
const PRIMARY = "#3a62f5";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="250" height="250">
  <g fill="${PRIMARY}">
    <path d="m235.6 116-39.27-66.5c-10.16-17.57-23.48-26.1-45.67-26.1h-65.69c-14.93 0-27.69 0.72-37.09 10.12-10.17 10.16-11.61 21.68-4.2 35.92l6.72 11.83 31.53 53.8c12.89 22.23 22.43 33.56 47.74 33.56h74.25c11.83 0 22.12-0.71 28.13-5.93 11.83-10.28 13.82-28.27 3.55-46.7zm-31.82 19.03c-4.31 1.82-15.48 1.45-35.14 1.45-10.02 0-21.61-0.18-31.02-0.33-15.51-0.25-20.89-4.49-28.55-17.7l-26.06-45.71c-6.83-12.54-6.87-19.05 5.48-19.27 7.56-0.57 18.66-0.28 27.43-0.32h27.33c15.04 0 22.52 3.58 32.1 19.09l24.47 40.51c7.63 12.58 9.02 20.18 3.96 22.28z"/>
    <path d="m222.2 186.9-9.88 17.54c-7.73 12.57-19.57 20.3-34.93 20.3h-82.77c-17.35 0-31.6-8.38-40.3-22.66l-40.51-63.76c-10.27-16.17-10.27-32.77-1.39-46.02l8.91-17.85c-2.85 9.4 0 18.8 7.38 31.34l40.51 65.34c9.55 16.21 18.61 25.83 40.67 25.83h74.98c16.17 0 27.73-0.42 37.33-10.06z"/>
  </g>
</svg>`;

await mkdir(outDir, { recursive: true });
const buf = Buffer.from(svg);
for (const size of SIZES) {
  const out = path.join(outDir, `${size}.png`);
  await sharp(buf, { density: Math.max(72, size * 8) })
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(out);
  console.log(`wrote ${out}`);
}

await writeFile(path.join(outDir, "source.svg"), svg, "utf8");
console.log("done");
