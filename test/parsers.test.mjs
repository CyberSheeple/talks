import test from "node:test";
import assert from "node:assert/strict";
import { parseMonthYear, parseDay, buildTalkDate, formatTalkDate } from "../scripts/lib/date.mjs";
import { parseSpeakers, speakerLabel } from "../scripts/lib/speakers.mjs";
import { slugifyTitle, talkFolderName } from "../scripts/lib/slug.mjs";
import { parseIssueForm, extractPdfUrl } from "../scripts/lib/issue-form.mjs";
import { parseIssue } from "../scripts/issue-ingest.mjs";
import { pagesToMarkdown, parseSlideMarkdown, extractStatus, normalizePageText } from "../scripts/lib/slides.mjs";
import { parseCaptions, alignChunksToSlides, tokenize } from "../scripts/lib/align.mjs";

test("parseMonthYear understands ISO and names", () => {
  assert.deepEqual(parseMonthYear("2026-04"), { year: 2026, month: 4 });
  assert.deepEqual(parseMonthYear("April 2026"), { year: 2026, month: 4 });
  assert.deepEqual(parseMonthYear("sep 2025"), { year: 2025, month: 9 });
  assert.deepEqual(parseMonthYear("4/2026"), { year: 2026, month: 4 });
});

test("day is optional and invalid days fail", () => {
  assert.equal(parseDay(""), null);
  assert.equal(parseDay("12"), 12);
  assert.throws(() => parseDay("40"));
});

test("buildTalkDate records precision", () => {
  assert.deepEqual(buildTalkDate({ year: 2026, month: 4, day: null }), {
    date: "2026-04-01",
    datePrecision: "month",
  });
  assert.deepEqual(buildTalkDate({ year: 2026, month: 4, day: 12 }), {
    date: "2026-04-12",
    datePrecision: "day",
  });
  assert.equal(formatTalkDate("2026-04-01", "month"), "April 2026");
  assert.equal(formatTalkDate("2026-04-12", "day"), "April 12, 2026");
});

test("speakers keep github logins and freeform names", () => {
  assert.deepEqual(parseSpeakers("@joevdotme, DullPointer, Joe V"), [
    { display: "joevdotme", github: "joevdotme" },
    { display: "DullPointer" },
    { display: "Joe V" },
  ]);
  assert.equal(speakerLabel({ display: "joevdotme", github: "joevdotme" }), "joevdotme");
});

test("slugify", () => {
  assert.equal(slugifyTitle("SillyCTF 2 recap"), "sillyctf-2-recap");
  assert.equal(talkFolderName("2026-04-01", "SillyCTF 2 recap"), "2026-04-01-sillyctf-2-recap");
});

test("issue form parse + pdf url", () => {
  const body = `### Talk title

SillyCTF 2 recap

### Month / year

April 2026

### Day (optional)

_No response_

### Who presented

@joevdotme, DullPointer

### PDF slides

[deck.pdf](https://github.com/user-attachments/files/123456/deck.pdf)

### Summary

What we solved.

### Google Slides URL (optional)

https://docs.google.com/presentation/d/abc
`;
  const parsed = parseIssue(body, { issueNumber: 7 });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.title, "SillyCTF 2 recap");
  assert.equal(parsed.date, "2026-04-01");
  assert.equal(parsed.datePrecision, "month");
  assert.equal(parsed.speakers[0].github, "joevdotme");
  assert.equal(parsed.pdfUrl, "https://github.com/user-attachments/files/123456/deck.pdf");
  assert.equal(parsed.issue, 7);
  assert.equal(parsed.gslides_url, "https://docs.google.com/presentation/d/abc");
});

test("issue form fails without pdf", () => {
  const body = `### Talk title
X
### Month / year
2026-04
### Who presented
@a
### PDF slides
please see slack
`;
  const parsed = parseIssue(body);
  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /PDF/);
});

test("extractPdfUrl from raw github attachment", () => {
  const url = extractPdfUrl("https://github.com/user-attachments/files/99/hi.pdf extra");
  assert.equal(url, "https://github.com/user-attachments/files/99/hi.pdf");
});

test("parseIssueForm splits headings", () => {
  const raw = parseIssueForm("### Talk title\n\nHello\n\n### Month / year\n\n2026-09\n");
  assert.equal(raw.title, "Hello");
  assert.equal(raw.monthYear, "2026-09");
});

test("slides markdown roundtrip", () => {
  const md = pagesToMarkdown([
    { page: 1, text: "Hello" },
    { page: 2, text: "World" },
  ]);
  assert.match(md, /## Slide 1/);
  const parsed = parseSlideMarkdown(md);
  assert.equal(parsed[1].text, "World");
  assert.equal(extractStatus([{ page: 1, text: "" }], true), "empty");
  assert.equal(extractStatus([], false), "missing");
  assert.equal(normalizePageText(" a \n\n\n b "), "a\n\n b");
});

test("align captions to slides by word overlap, monotonic", () => {
  const slides = [
    { page: 1, text: "export google slides pdf" },
    { page: 2, text: "open the github issue form" },
    { page: 3, text: "ci extracts searchable text" },
  ];
  const vtt = `WEBVTT

00:00:00.000 --> 00:00:03.000
First we export from Google Slides as a PDF

00:00:03.000 --> 00:00:06.000
Then open the GitHub issue form and attach it

00:00:06.000 --> 00:00:09.000
CI extracts searchable text for the catalog
`;
  const chunks = parseCaptions(vtt, "talk.vtt");
  assert.equal(chunks.length, 3);
  const aligned = alignChunksToSlides(chunks, slides);
  assert.equal(aligned[0].page, 1);
  assert.match(aligned[0].text, /export from Google/i);
  assert.match(aligned[1].text, /issue form/i);
  assert.match(aligned[2].text, /searchable text/i);
  assert.ok(tokenize("the CI extracts").includes("extracts"));
});

test("pre-headed transcript passes through", () => {
  const md = "## Slide 1\n\nsaid one\n\n## Slide 2\n\nsaid two\n";
  const chunks = parseCaptions(md, "script.md");
  assert.equal(chunks[0].slide, 1);
  const aligned = alignChunksToSlides(chunks, [
    { page: 1, text: "one" },
    { page: 2, text: "two" },
  ]);
  assert.match(aligned[1].text, /said two/);
});
