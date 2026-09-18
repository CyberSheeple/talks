#!/usr/bin/env node
import { rebuildIndex } from "./lib/index.mjs";

const extract = !process.argv.includes("--no-extract");
const index = await rebuildIndex({ extract });
const empty = index.talks.filter((t) => t.extractStatus === "empty");
const missing = index.talks.filter((t) => t.extractStatus === "missing");
console.log(`Indexed ${index.talks.length} talk(s).`);
if (empty.length) {
  console.warn(
    `No extractable text in: ${empty.map((t) => t.slug).join(", ")}. Export from Google Slides as PDF, not Print-to-PDF.`,
  );
}
if (missing.length) {
  console.warn(`Missing slides.pdf in: ${missing.map((t) => t.slug).join(", ")}.`);
}
if (index.warnings?.length) {
  for (const w of index.warnings) console.error(`${w.slug}: ${w.error}`);
  process.exitCode = 1;
}
