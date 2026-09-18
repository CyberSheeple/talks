import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { extractPdfPages } from "../scripts/lib/slides.mjs";
import { talkPath } from "../scripts/lib/index.mjs";
import { join } from "node:path";

test("example PDF extracts per-slide text", async () => {
  const pages = await extractPdfPages(join(talkPath("2026-09-01-how-to-add-a-talk"), "slides.pdf"));
  assert.ok(pages.length >= 5, `expected 5+ pages, got ${pages.length}`);
  const blob = pages.map((p) => p.text).join("\n");
  assert.match(blob, /Google Slides/i);
  assert.match(blob, /slides\.md/);
  const md = await readFile(join(talkPath("2026-09-01-how-to-add-a-talk"), "slides.md"), "utf8");
  assert.match(md, /## Slide 1/);
  assert.match(md, /## Slide 5/);
});
