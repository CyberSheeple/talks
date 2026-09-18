import test from "node:test";
import assert from "node:assert/strict";
import { searchTalks } from "../src/search.js";
import { formatTalkDate, speakerNames } from "../src/format.js";

const talks = [
  {
    slug: "a",
    title: "SillyCTF recap",
    date: "2026-04-01",
    datePrecision: "month",
    speakerLabels: ["joevdotme"],
    tags: ["ctf"],
    summary: "What we solved",
    slidesText: "web 400 crypto 200 export pdf",
    recapText: "",
    transcriptText: "then we bounced off the heap challenge",
  },
  {
    slug: "b",
    title: "How to add a talk",
    date: "2026-09-01",
    speakerLabels: ["CyberSheeple"],
    tags: ["meta"],
    summary: "Issue form",
    slidesText: "drag the pdf into github issues",
    recapText: "friends should not need git",
    transcriptText: "",
  },
];

test("empty query returns all talks", () => {
  assert.equal(searchTalks(talks, "").length, 2);
});

test("search hits slide text and titles", () => {
  const pdf = searchTalks(talks, "pdf");
  assert.equal(pdf[0].talk.slug, "b");
  const ctf = searchTalks(talks, "sillyctf");
  assert.equal(ctf.length, 1);
  const spoken = searchTalks(talks, "heap");
  assert.equal(spoken[0].talk.slug, "a");
});

test("no match is empty", () => {
  assert.equal(searchTalks(talks, "bananas").length, 0);
});

test("format helpers", () => {
  assert.equal(formatTalkDate("2026-04-01", "month"), "April 2026");
  assert.equal(speakerNames({ speakerLabels: ["joevdotme"] }), "joevdotme");
});
