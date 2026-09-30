#!/usr/bin/env node
/**
 * Assemble the static catalog into a deploy directory (no node_modules, no CI scripts).
 * Usage: node scripts/pack-site.mjs [--out _site] [--cname]
 */
import { cp, mkdir, rm, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const outDir = outIdx >= 0 ? args[outIdx + 1] : "_site";
const withCname = args.includes("--cname");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

async function copyIfExists(from, to) {
  try {
    await access(from);
  } catch {
    return false;
  }
  await cp(from, to, { recursive: true });
  return true;
}

for (const name of ["index.html", "styles.css", ".nojekyll", "robots.txt"]) {
  const ok = await copyIfExists(join(root, name), join(outDir, name));
  if (!ok && name !== "robots.txt") {
    throw new Error(`missing required site file: ${name}`);
  }
}
await cp(join(root, "src"), join(outDir, "src"), { recursive: true });
await cp(join(root, "talks"), join(outDir, "talks"), { recursive: true });

if (withCname) {
  await cp(join(root, "CNAME"), join(outDir, "CNAME"));
}

console.log(`Packed site → ${outDir}${withCname ? " (with CNAME)" : ""}`);
