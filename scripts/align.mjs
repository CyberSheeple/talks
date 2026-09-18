#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseCaptions, alignChunksToSlides, transcriptMarkdown } from "./lib/align.mjs";
import { parseSlideMarkdown } from "./lib/slides.mjs";
import { talkPath, fileExists, rebuildIndex, readTalkJson } from "./lib/index.mjs";

const slug = process.argv[2];
const captionsPath = process.argv[3];
if (!slug || !captionsPath) {
  console.error("Usage: npm run align -- <talk-slug> <captions.vtt|captions.srt|script.txt>");
  process.exit(1);
}

const dir = talkPath(slug);
const slidesPath = join(dir, "slides.md");
if (!(await fileExists(slidesPath))) {
  console.error(`Missing ${slidesPath}. Run npm run ingest first.`);
  process.exit(1);
}

const slides = parseSlideMarkdown(await readFile(slidesPath, "utf8"));
const raw = await readFile(captionsPath, "utf8");
const chunks = parseCaptions(raw, captionsPath);
const aligned = alignChunksToSlides(chunks, slides);
const md = transcriptMarkdown(aligned);
await writeFile(join(dir, "transcript.md"), md, "utf8");

const meta = await readTalkJson(slug);
meta.transcript = true;
await writeFile(join(dir, "talk.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
await rebuildIndex({ extract: false });
console.log(`Wrote talks/${slug}/transcript.md (${aligned.filter((s) => s.text && !s.text.startsWith("_(no")).length} slides with speech).`);
