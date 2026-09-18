import { readdir, readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extractPdfPages, pagesToMarkdown, extractStatus, parseSlideMarkdown } from "./slides.mjs";
import { speakerLabel } from "./speakers.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const TALKS_DIR = join(ROOT, "talks");
export const INDEX_PATH = join(TALKS_DIR, "index.json");

export async function listTalkDirs() {
  const entries = await readdir(TALKS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();
}

export function talkPath(slug) {
  return join(TALKS_DIR, slug);
}

export async function readTalkJson(slug) {
  const raw = await readFile(join(talkPath(slug), "talk.json"), "utf8");
  return JSON.parse(raw);
}

export async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function maybeRead(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

export function emptyIndex() {
  return { generatedAt: new Date().toISOString(), talks: [] };
}

export async function ingestTalk(slug, { extract = true } = {}) {
  const dir = talkPath(slug);
  const meta = await readTalkJson(slug);
  const pdfPath = join(dir, "slides.pdf");
  const hasPdf = await fileExists(pdfPath);
  let pages = [];
  let status = hasPdf ? "ok" : "missing";

  if (extract && hasPdf) {
    pages = await extractPdfPages(pdfPath);
    status = extractStatus(pages, true);
    const md = pagesToMarkdown(pages);
    await writeFile(join(dir, "slides.md"), md, "utf8");
  } else if (await fileExists(join(dir, "slides.md"))) {
    pages = parseSlideMarkdown(await readFile(join(dir, "slides.md"), "utf8"));
    status = extractStatus(pages, hasPdf);
  }

  const recap = await maybeRead(join(dir, "recap.md"));
  const transcript = await maybeRead(join(dir, "transcript.md"));
  if (typeof meta.transcript !== "boolean") {
    meta.transcript = Boolean(transcript);
  }

  return buildIndexEntry(slug, meta, {
    hasPdf,
    extractStatus: status,
    slidesText: pages.map((p) => p.text).join("\n"),
    recapText: recap || "",
    transcriptText: transcript || "",
    hasRecap: Boolean(recap && recap.trim()),
    hasTranscript: Boolean(transcript && transcript.trim()),
  });
}

export function buildIndexEntry(slug, meta, extras) {
  return {
    slug,
    title: meta.title,
    date: meta.date,
    datePrecision: meta.datePrecision || "day",
    speakers: meta.speakers || [],
    speakerLabels: (meta.speakers || []).map(speakerLabel),
    tags: meta.tags || [],
    summary: meta.summary || "",
    gslides_url: meta.gslides_url || null,
    duration_minutes: meta.duration_minutes ?? null,
    transcript: Boolean(extras.hasTranscript || meta.transcript),
    issue: meta.issue ?? null,
    hasPdf: extras.hasPdf,
    hasRecap: extras.hasRecap,
    hasTranscript: extras.hasTranscript,
    extractStatus: extras.extractStatus,
    slidesText: extras.slidesText || "",
    recapText: extras.recapText || "",
    transcriptText: extras.transcriptText || "",
    path: `talks/${slug}`,
  };
}

export async function rebuildIndex({ extract = true } = {}) {
  const slugs = await listTalkDirs();
  const talks = [];
  const warnings = [];
  for (const slug of slugs) {
    try {
      talks.push(await ingestTalk(slug, { extract }));
    } catch (err) {
      warnings.push({ slug, error: String(err.message || err) });
    }
  }
  talks.sort((a, b) => String(b.date).localeCompare(String(a.date)) || a.slug.localeCompare(b.slug));

  let previous = null;
  try {
    previous = JSON.parse(await readFile(INDEX_PATH, "utf8"));
  } catch {
    previous = null;
  }
  if (
    previous &&
    JSON.stringify(previous.talks) === JSON.stringify(talks) &&
    JSON.stringify(previous.warnings || []) === JSON.stringify(warnings)
  ) {
    return previous;
  }

  const index = { generatedAt: new Date().toISOString(), talks, warnings };
  await mkdir(TALKS_DIR, { recursive: true });
  await writeFile(INDEX_PATH, JSON.stringify(index, null, 2) + "\n", "utf8");
  return index;
}
