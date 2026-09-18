import { parseSlideMarkdown } from "./slides.mjs";

const STOP = new Set([
  "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "is", "it", "we",
  "you", "this", "that", "with", "at", "as", "be", "by", "from", "are", "was",
]);

export function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((t) => t.length > 1 && !STOP.has(t)) ?? [];
}

export function parseCaptions(raw, filename = "") {
  const text = String(raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  if (/^## Slide\s+\d+/m.test(text)) {
    return parseSlideMarkdown(text).map((s) => ({
      slide: s.page,
      text: s.text,
      start: null,
    }));
  }
  const lower = filename.toLowerCase();
  if (lower.endsWith(".vtt") || text.startsWith("WEBVTT")) return parseVtt(text);
  if (lower.endsWith(".srt") || /^\d+\n\d{2}:\d{2}/.test(text)) return parseSrt(text);
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({ slide: null, text: block, start: null }));
}

function parseVtt(text) {
  const chunks = [];
  const blocks = text.replace(/^WEBVTT.*\n/, "").split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length === 0) continue;
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) {
      const body = lines.filter((l) => !/^\d+$/.test(l)).join(" ").trim();
      if (body) chunks.push({ slide: null, text: body, start: null });
      continue;
    }
    const start = timeLine.split("-->")[0].trim();
    const body = lines
      .filter((l) => l !== timeLine && !/^\d+$/.test(l))
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (body) chunks.push({ slide: null, text: body, start });
  }
  return chunks;
}

function parseSrt(text) {
  const chunks = [];
  const blocks = text.split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;
    let i = 0;
    if (/^\d+$/.test(lines[0])) i = 1;
    const timeLine = lines[i] || "";
    const start = timeLine.includes("-->") ? timeLine.split("-->")[0].trim().replace(",", ".") : null;
    const body = lines.slice(i + 1).join(" ").trim();
    if (body) chunks.push({ slide: null, text: body, start });
  }
  return chunks;
}

export function scoreChunk(chunkTokens, slideTokens) {
  if (chunkTokens.length === 0) return 0;
  const set = new Set(slideTokens);
  let hit = 0;
  for (const t of chunkTokens) if (set.has(t)) hit++;
  return hit / chunkTokens.length + hit * 0.05;
}

export function alignChunksToSlides(chunks, slides) {
  if (slides.length === 0) return [];
  if (chunks.every((c) => c.slide != null)) {
    return mergeBySlide(chunks, slides.length);
  }

  const slideTokens = slides.map((s) => tokenize(s.text));
  let last = 1;
  const assigned = [];
  for (const chunk of chunks) {
    let bestSlide = last;
    let best = -1;
    for (let i = 0; i < slides.length; i++) {
      const page = slides[i].page;
      if (page < last) continue;
      const score = scoreChunk(tokenize(chunk.text), slideTokens[i]);
      if (score > best) {
        best = score;
        bestSlide = page;
      }
    }
    if (best <= 0) bestSlide = last;
    last = bestSlide;
    assigned.push({ ...chunk, slide: bestSlide });
  }
  return mergeBySlide(assigned, slides.length);
}

function mergeBySlide(chunks, slideCount) {
  const bySlide = new Map();
  for (const chunk of chunks) {
    const page = chunk.slide || 1;
    if (!bySlide.has(page)) bySlide.set(page, []);
    const stamp = chunk.start ? `<!-- ${chunk.start} -->\n` : "";
    bySlide.get(page).push(stamp + chunk.text.trim());
  }
  const out = [];
  const max = Math.max(slideCount, ...bySlide.keys(), 1);
  for (let page = 1; page <= max; page++) {
    out.push({
      page,
      text: (bySlide.get(page) || []).join("\n\n").trim(),
    });
  }
  return out;
}

export function transcriptMarkdown(aligned) {
  return aligned
    .map((s) => `## Slide ${s.page}\n\n${s.text || "_(no spoken text assigned)_"}\n`)
    .join("\n")
    .trim() + "\n";
}
