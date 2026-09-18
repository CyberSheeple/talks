import { readFile } from "node:fs/promises";

export async function extractPdfPages(pdfPath) {
  const { getDocumentProxy, extractText } = await import("unpdf");
  const bytes = new Uint8Array(await readFile(pdfPath));
  const pdf = await getDocumentProxy(bytes);
  const result = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(result.text) ? result.text : [result.text];
  return pages.map((text, i) => ({
    page: i + 1,
    text: normalizePageText(text),
  }));
}

export function normalizePageText(text) {
  return String(text ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function pagesToMarkdown(pages) {
  if (!pages.length) return "";
  return pages
    .map((p) => `## Slide ${p.page}\n\n${p.text || "_(no extractable text)_"}\n`)
    .join("\n")
    .trim() + "\n";
}

export function parseSlideMarkdown(markdown) {
  const text = String(markdown ?? "").replace(/\r\n/g, "\n");
  const parts = text.split(/^## Slide\s+(\d+)\s*$/m);
  const slides = [];
  for (let i = 1; i < parts.length; i += 2) {
    slides.push({
      page: Number(parts[i]),
      text: (parts[i + 1] || "").trim(),
    });
  }
  return slides;
}

export function extractStatus(pages, hasPdf) {
  if (!hasPdf) return "missing";
  const joined = pages.map((p) => p.text).join("").replace(/[\s_\(\)]/g, "");
  const real = pages.some((p) => p.text && p.text !== "_(no extractable text)_" && /[A-Za-z0-9]/.test(p.text));
  if (!real || joined.length < 8) return "empty";
  return "ok";
}
