const FIELD_MAP = {
  "talk title": "title",
  title: "title",
  "month / year": "monthYear",
  "month/year": "monthYear",
  "month and year": "monthYear",
  "day (optional)": "day",
  day: "day",
  "who presented": "speakers",
  speakers: "speakers",
  presenter: "speakers",
  "pdf slides": "slides",
  slides: "slides",
  "pdf (drag the file here)": "slides",
  summary: "summary",
  "summary (optional)": "summary",
  "google slides url": "gslidesUrl",
  "google slides url (optional)": "gslidesUrl",
  "slides url": "gslidesUrl",
};

const PDF_URL_RE =
  /https?:\/\/(?:github\.com\/user-attachments\/files\/\d+\/[^\s)<>]+\.pdf|github\.com\/[\w.-]+\/[\w.-]+\/files\/\d+\/[^\s)<>]+\.pdf|user-images\.githubusercontent\.com\/[^\s)<>]+\.pdf)/gi;

export function parseIssueForm(markdown) {
  const sections = splitSections(String(markdown ?? ""));
  const raw = {};
  for (const [heading, body] of sections) {
    const key = FIELD_MAP[heading.toLowerCase().replace(/:$/, "").trim()];
    if (key) raw[key] = body.trim();
  }
  return raw;
}

function splitSections(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections = [];
  let heading = null;
  let buf = [];
  const flush = () => {
    if (heading != null) sections.push([heading, buf.join("\n").trim()]);
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(/^#{1,3}\s+(.+?)\s*$/);
    if (m) {
      flush();
      heading = m[1].trim();
      continue;
    }
    buf.push(line);
  }
  flush();
  return sections;
}

export function extractPdfUrl(slidesField) {
  const text = String(slidesField ?? "");
  const md = text.match(/\[[^\]]+\.pdf\]\((https?:\/\/[^)\s]+)\)/i);
  if (md) return md[1];
  const urls = text.match(PDF_URL_RE);
  if (urls && urls.length > 0) return urls[0];
  const any = text.match(/https?:\/\/[^\s)<>]+/i);
  if (any && /\.pdf(\?|$)/i.test(any[0])) return any[0];
  return null;
}

export function isBlankOptional(value) {
  const v = String(value ?? "").trim();
  return !v || /^(_no response_|n\/?a|none|-)$/i.test(v);
}
