#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { talkPath } from "./lib/index.mjs";
import { rebuildIndex } from "./lib/index.mjs";

const SLUG = "2026-09-01-how-to-add-a-talk";
const pages = [
  {
    title: "How to add a talk",
    lines: [
      "CyberSheeple monthly knowledge-share",
      "Export the deck. Attach the PDF. CI does the rest.",
    ],
  },
  {
    title: "Export from Google Slides",
    lines: [
      "File > Download > PDF Document (.pdf)",
      "Do not use Print > Save as PDF.",
      "Print-to-PDF often rasterizes text and search cannot read it.",
    ],
  },
  {
    title: "Submit without git",
    lines: [
      "Open Submit a talk on GitHub Issues.",
      "Month and year of the talk. Day is optional.",
      "Who presented: @github, an alias, or a real name.",
      "Drag the PDF into the slides field.",
    ],
  },
  {
    title: "What happens next",
    lines: [
      "A draft pull request lands with your PDF.",
      "CI extracts per-slide text into slides.md.",
      "After merge, the catalog can search the words on the slides.",
    ],
  },
  {
    title: "Optional extras",
    lines: [
      "recap.md - a short writeup you actually stand behind.",
      "Not a generated script of an unscripted room.",
      "transcript.md - spoken words, aligned to Slide N,",
      "when you have captions or a recording you transcribed elsewhere.",
    ],
  },
];

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Courier);
const bold = await doc.embedFont(StandardFonts.CourierBold);

for (const page of pages) {
  const p = doc.addPage([792, 612]);
  p.drawRectangle({ x: 0, y: 0, width: 792, height: 612, color: rgb(0.04, 0.04, 0.06) });
  p.drawText("CyberSheeple talks", { x: 48, y: 548, size: 12, font, color: rgb(0, 0.96, 1) });
  p.drawText(page.title, { x: 48, y: 500, size: 28, font: bold, color: rgb(1, 1, 1) });
  let y = 440;
  for (const line of page.lines) {
    p.drawText(line, { x: 48, y, size: 16, font, color: rgb(0.85, 0.85, 0.9) });
    y -= 28;
  }
}

const bytes = await doc.save();
const dir = talkPath(SLUG);
await mkdir(dir, { recursive: true });
await writeFile(join(dir, "slides.pdf"), bytes);

const meta = {
  title: "How to add a talk",
  date: "2026-09-01",
  datePrecision: "month",
  speakers: [{ display: "CyberSheeple", github: "CyberSheeple" }],
  tags: ["meta"],
  summary:
    "Export Google Slides as a PDF, attach it to the Submit a talk issue form, and let CI extract searchable slide text.",
  gslides_url: null,
  duration_minutes: 5,
  transcript: false,
  issue: null,
};
await writeFile(join(dir, "talk.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
await writeFile(
  join(dir, "README.md"),
  `# How to add a talk\n\nExample deck for the archive. Friends do not need git: they open the issue form and attach a PDF.\n`,
  "utf8",
);
await writeFile(
  join(dir, "recap.md"),
  `This is a meta-talk, not a reconstructed live script. The useful bits: export PDF from Slides, drag it onto the issue form, wait for the draft PR, glance at slides.md to see whether search will work.\n`,
  "utf8",
);

await rebuildIndex({ extract: true });
console.log(`Wrote talks/${SLUG}/slides.pdf`);
