#!/usr/bin/env node
import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { parseMonthYear, parseDay, buildTalkDate, formatTalkDate } from "./lib/date.mjs";
import { parseSpeakers } from "./lib/speakers.mjs";
import { talkFolderName } from "./lib/slug.mjs";
import { TALKS_DIR, rebuildIndex } from "./lib/index.mjs";

const { values } = parseArgs({
  options: {
    title: { type: "string" },
    date: { type: "string" },
    month: { type: "string" },
    day: { type: "string" },
    speakers: { type: "string" },
    summary: { type: "string", default: "" },
    tags: { type: "string", default: "" },
    gslides: { type: "string" },
    issue: { type: "string" },
    "skip-index": { type: "boolean", default: false },
  },
  allowPositionals: false,
});

if (!values.title) {
  console.error("Usage: npm run new-talk -- --title \"...\" --month 2026-04 [--day 12] --speakers \"@joevdotme, Alice\"");
  process.exit(1);
}

const monthYear = parseMonthYear(values.month || values.date);
const day = parseDay(values.day);
const { date, datePrecision } = buildTalkDate({ ...monthYear, day });
const speakers = parseSpeakers(values.speakers || "unknown");
const tags = String(values.tags || "")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

let slug = talkFolderName(date, values.title);
let dir = join(TALKS_DIR, slug);
let n = 2;
while (await exists(dir)) {
  slug = `${talkFolderName(date, values.title)}-${n}`;
  dir = join(TALKS_DIR, slug);
  n += 1;
}

const meta = {
  title: values.title,
  date,
  datePrecision,
  speakers,
  tags,
  summary: values.summary || "",
  gslides_url: values.gslides || null,
  duration_minutes: null,
  transcript: false,
  issue: values.issue ? Number(values.issue) : null,
};

await mkdir(dir, { recursive: true });
await writeFile(join(dir, "talk.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
await writeFile(
  join(dir, "README.md"),
  `# ${meta.title}\n\n- **When:** ${formatTalkDate(date, datePrecision)}\n- **Who:** ${speakers.map((s) => s.display).join(", ")}\n- **Slides:** \`slides.pdf\`\n`,
  "utf8",
);

if (!values["skip-index"]) {
  await rebuildIndex({ extract: false });
}

console.log(slug);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
