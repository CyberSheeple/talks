#!/usr/bin/env node
import { copyFile, mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { parseIssueForm, extractPdfUrl, isBlankOptional } from "./lib/issue-form.mjs";
import { parseMonthYear, parseDay, buildTalkDate, formatTalkDate } from "./lib/date.mjs";
import { parseSpeakers } from "./lib/speakers.mjs";
import { talkFolderName } from "./lib/slug.mjs";
import { TALKS_DIR, listTalkDirs, readTalkJson } from "./lib/index.mjs";

export async function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      event: { type: "string" },
      "body-file": { type: "string" },
      body: { type: "string" },
      out: { type: "string" },
      apply: { type: "boolean", default: false },
      from: { type: "string" },
      pdf: { type: "string" },
    },
    allowPositionals: false,
  });

  const parsed = values.from
    ? JSON.parse(await readFile(values.from, "utf8"))
    : await parseFromInputs(values);

  if (values.out) {
    await writeFile(values.out, JSON.stringify(parsed, null, 2) + "\n", "utf8");
  } else if (!values.apply) {
    process.stdout.write(JSON.stringify(parsed, null, 2) + "\n");
  }

  if (values.apply) {
    if (parsed.error) {
      console.error(parsed.error);
      process.exitCode = 1;
      return parsed;
    }
    const result = await applyTalk(parsed, values.pdf);
    console.log(JSON.stringify(result, null, 2));
    return result;
  }
  return parsed;
}

const isCli = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli) {
  await main();
}

async function parseFromInputs(opts) {
  let body = opts.body || "";
  let issueNumber = null;
  let issueTitle = "";
  if (opts.event) {
    const event = JSON.parse(await readFile(opts.event, "utf8"));
    const issue = event.issue || event;
    body = issue.body || "";
    issueNumber = issue.number ?? null;
    issueTitle = issue.title || "";
  } else if (opts["body-file"]) {
    body = await readFile(opts["body-file"], "utf8");
  }
  return parseIssue(body, { issueNumber, issueTitle });
}

export function parseIssue(body, { issueNumber = null, issueTitle = "" } = {}) {
  try {
    const raw = parseIssueForm(body);
    const title = String(raw.title || "").trim() || cleanIssueTitle(issueTitle);
    if (!title) throw new Error("Talk title is required.");
    if (isBlankOptional(raw.monthYear)) throw new Error("Month / year is required.");
    const monthYear = parseMonthYear(raw.monthYear);
    const day = isBlankOptional(raw.day) ? null : parseDay(raw.day);
    const { date, datePrecision } = buildTalkDate({ ...monthYear, day });
    if (isBlankOptional(raw.speakers)) throw new Error("Who presented is required.");
    const speakers = parseSpeakers(raw.speakers);
    const pdfUrl = extractPdfUrl(raw.slides);
    if (!pdfUrl) {
      throw new Error(
        "Could not find a PDF attachment. Drag the exported .pdf into the PDF slides field (GitHub will paste a link).",
      );
    }
    const summary = isBlankOptional(raw.summary) ? "" : String(raw.summary).trim();
    const gslides = isBlankOptional(raw.gslidesUrl) ? null : String(raw.gslidesUrl).trim();
    const slug = talkFolderName(date, title);
    return {
      ok: true,
      title,
      date,
      datePrecision,
      speakers,
      summary,
      gslides_url: gslides,
      pdfUrl,
      issue: issueNumber,
      slug,
      folder: `talks/${slug}`,
      branch: `talk/${slug}`,
      prTitle: `talk: ${title}`,
    };
  } catch (err) {
    return { ok: false, error: String(err.message || err), issue: issueNumber };
  }
}

function cleanIssueTitle(title) {
  return String(title || "")
    .replace(/^\[talk\]\s*/i, "")
    .trim();
}

async function applyTalk(parsed, pdfPath) {
  let slug = parsed.slug;
  const existing = await findByIssue(parsed.issue);
  if (existing) slug = existing;

  let dir = join(TALKS_DIR, slug);
  if (!existing) {
    let n = 2;
    while (await exists(dir)) {
      slug = `${parsed.slug}-${n}`;
      dir = join(TALKS_DIR, slug);
      n += 1;
    }
  }

  await mkdir(dir, { recursive: true });
  const meta = {
    title: parsed.title,
    date: parsed.date,
    datePrecision: parsed.datePrecision,
    speakers: parsed.speakers,
    tags: [],
    summary: parsed.summary || "",
    gslides_url: parsed.gslides_url || null,
    duration_minutes: null,
    transcript: false,
    issue: parsed.issue ?? null,
  };
  await writeFile(join(dir, "talk.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
  await writeFile(
    join(dir, "README.md"),
    `# ${meta.title}\n\n- **When:** ${formatTalkDate(meta.date, meta.datePrecision)}\n- **Who:** ${meta.speakers.map((s) => s.display).join(", ")}\n- **Slides:** \`slides.pdf\`\n${meta.issue ? `- **Issue:** #${meta.issue}\n` : ""}`,
    "utf8",
  );
  if (pdfPath) {
    await copyFile(pdfPath, join(dir, "slides.pdf"));
  }
  return { slug, folder: `talks/${slug}`, branch: `talk/${slug}`, updated: Boolean(existing) };
}

async function findByIssue(issueNumber) {
  if (!issueNumber) return null;
  for (const slug of await listTalkDirs()) {
    try {
      const meta = await readTalkJson(slug);
      if (meta.issue === issueNumber) return slug;
    } catch {
      /* skip */
    }
  }
  return null;
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
