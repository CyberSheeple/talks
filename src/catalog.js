import { formatTalkDate, monthKey, speakerNames } from "./format.js";
import { searchTalks } from "./search.js";

const ISSUE_NEW =
  "https://github.com/CyberSheeple/talks/issues/new?template=submit-talk.yml";
const REPO = "https://github.com/CyberSheeple/talks";

const view = document.getElementById("view");
const heroCmd = document.getElementById("hero-cmd");
const heroBio = document.getElementById("hero-bio");
const hudCount = document.getElementById("hud-count");

let catalog = { talks: [], warnings: [] };
let loadError = null;

init();

async function init() {
  try {
    const res = await fetch("talks/index.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`catalog ${res.status}`);
    catalog = await res.json();
    loadError = null;
  } catch (err) {
    loadError = err;
    catalog = { talks: [] };
  }
  hudCount.textContent = `TALKS: ${catalog.talks.length}`;
  render();
  window.addEventListener("hashchange", render);
}

function route() {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const path = hash.startsWith("/") ? hash : `/${hash}`;
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "add") return { name: "add" };
  if (parts[0] === "talk" && parts[1]) return { name: "talk", slug: decodeURIComponent(parts[1]) };
  return { name: "home", query: new URLSearchParams(path.split("?")[1] || window.location.hash.split("?")[1] || "").get("q") || "" };
}

function render() {
  const r = route();
  if (loadError && r.name !== "add") {
    view.innerHTML = `<div class="error">Could not load talks/index.json. Run <code>npm run ingest</code> and refresh.</div>`;
    return;
  }
  if (r.name === "add") return renderAdd();
  if (r.name === "talk") return renderTalk(r.slug);
  return renderHome();
}

function renderHome() {
  heroCmd.textContent = "ls talks/";
  heroBio.textContent = "CyberSheeple monthly knowledge-share. Search the words that were on the slides.";
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const q = params.get("q") || "";
  const results = searchTalks(catalog.talks, q);
  const grouped = groupByMonth(results.map((r) => r.talk));
  const hitBySlug = new Map(results.map((r) => [r.talk.slug, r.hit]));

  view.innerHTML = `
    <form class="search-row" id="search-form">
      <input class="search-input" id="q" type="search" name="q" value="${escapeAttr(q)}" placeholder="search titles, speakers, slide text…" autocomplete="off">
      <span class="search-meta">${results.length} / ${catalog.talks.length}</span>
    </form>
    ${results.length === 0 ? emptyState(q) : grouped.map((g) => monthSection(g, hitBySlug)).join("")}
  `;

  const form = document.getElementById("search-form");
  const input = document.getElementById("q");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const next = input.value.trim();
    window.location.hash = next ? `/?q=${encodeURIComponent(next)}` : "/";
  });
  let t;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const next = input.value.trim();
      const nextHash = next ? `/?q=${encodeURIComponent(next)}` : "/";
      if (window.location.hash !== `#${nextHash}`) {
          history.replaceState(null, "", `#${nextHash}`);
          render();
          const again = document.getElementById("q");
          if (again) {
            again.focus();
            again.setSelectionRange(again.value.length, again.value.length);
          }
        }
    }, 140);
  });
}

function emptyState(q) {
  if (q) {
    return `<div class="state">No talks matched “${escapeHtml(q)}”. Try a speaker handle, a tag, or a phrase from a slide.</div>`;
  }
  return `<div class="state">No talks in the index yet. <a href="#/add">Add a talk</a> via the GitHub issue form.</div>`;
}

function groupByMonth(talks) {
  const map = new Map();
  for (const talk of talks) {
    const key = monthKey(talk.date);
    if (!map.has(key)) map.set(key, { key, label: formatTalkDate(talk.date, "month"), talks: [] });
    map.get(key).talks.push(talk);
  }
  return [...map.values()];
}

function monthSection(group, hitBySlug) {
  return `
    <section class="month-block">
      <h2 class="month-label">${escapeHtml(group.label)}</h2>
      <div class="bento">
        ${group.talks.map((talk) => talkCard(talk, hitBySlug.get(talk.slug))).join("")}
      </div>
    </section>
  `;
}

function talkCard(talk, hit) {
  const flags = [];
  if (talk.extractStatus === "empty") flags.push(`<span class="flag warn">no extractable text</span>`);
  if (talk.extractStatus === "missing") flags.push(`<span class="flag warn">pdf missing</span>`);
  if (talk.hasTranscript) flags.push(`<span class="flag">transcript</span>`);
  if (talk.hasRecap) flags.push(`<span class="flag magenta">recap</span>`);
  (talk.tags || []).forEach((tag) => flags.push(`<span class="flag">${escapeHtml(tag)}</span>`));
  return `
    <a class="bento-card" href="#/talk/${encodeURIComponent(talk.slug)}">
      <span class="card-kicker">${escapeHtml(formatTalkDate(talk.date, talk.datePrecision))}</span>
      <span class="card-title">${escapeHtml(talk.title)}</span>
      <span class="card-meta">${escapeHtml(speakerNames(talk) || "unknown")}</span>
      ${hit ? `<span class="card-hit">${escapeHtml(hit)}</span>` : talk.summary ? `<span class="card-meta">${escapeHtml(talk.summary)}</span>` : ""}
      <span class="flags">${flags.join("")}</span>
    </a>
  `;
}

function renderTalk(slug) {
  const talk = catalog.talks.find((t) => t.slug === slug);
  if (!talk) {
    heroCmd.textContent = "cat talks/" + slug;
    heroBio.textContent = "Talk not in the index.";
    view.innerHTML = `<div class="state">Unknown talk. <a href="#/">Back to catalog</a>.</div>`;
    return;
  }
  heroCmd.textContent = `cat talks/${slug}`;
  heroBio.textContent = talk.summary || "Monthly knowledge-share deck.";
  const pdfUrl = `${talk.path}/slides.pdf`;
  const warn =
    talk.extractStatus === "empty"
      ? `<div class="error">This PDF has no extractable text. Re-export with File → Download → PDF Document so search can read the slides.</div>`
      : talk.extractStatus === "missing"
        ? `<div class="error">slides.pdf is missing from this folder.</div>`
        : "";

  view.innerHTML = `
    <article class="talk-head">
      <span class="card-kicker">${escapeHtml(formatTalkDate(talk.date, talk.datePrecision))}</span>
      <h2>${escapeHtml(talk.title)}</h2>
      <p class="card-meta">${escapeHtml(speakerNames(talk))}${talk.tags?.length ? " · " + talk.tags.map(escapeHtml).join(", ") : ""}</p>
    </article>
    <div class="actions">
      ${talk.hasPdf ? `<a class="btn" href="${pdfUrl}">open pdf</a>` : ""}
      ${talk.gslides_url ? `<a class="btn" href="${escapeAttr(talk.gslides_url)}" target="_blank" rel="noopener">google slides</a>` : ""}
      <a class="btn" href="${REPO}/tree/main/${talk.path}">source</a>
      <a class="btn" href="#/">catalog</a>
    </div>
    ${warn}
    ${talk.hasPdf ? `<iframe class="pdf-frame" title="Slides PDF" src="${pdfUrl}"></iframe>` : ""}
    <div id="talk-body"><p class="state">loading slide text…</p></div>
  `;

  loadTalkBody(talk);
}

async function loadTalkBody(talk) {
  const body = document.getElementById("talk-body");
  if (!body) return;
  const [slides, recap, transcript] = await Promise.all([
    fetchText(`${talk.path}/slides.md`),
    fetchText(`${talk.path}/recap.md`),
    fetchText(`${talk.path}/transcript.md`),
  ]);
  body.innerHTML = `
    ${section("Recap", recap ? `<div class="prose">${escapeHtml(recap).replace(/\n/g, "<br>")}</div>` : "")}
    ${section("Slide text", slides ? renderSlides(slides) : `<div class="state">No slides.md yet. CI writes it after ingest.</div>`)}
    ${section("Spoken transcript", transcript ? renderSlides(transcript) : "")}
  `;
}

function section(title, inner) {
  if (!inner) return "";
  return `<h3 class="section-title">${title}</h3>${inner}`;
}

function renderSlides(md) {
  const parts = String(md).split(/^## Slide\s+(\d+)\s*$/m);
  if (parts.length < 3) {
    return `<pre class="slide-block">${escapeHtml(md)}</pre>`;
  }
  let html = "";
  for (let i = 1; i < parts.length; i += 2) {
    html += `<section class="slide-block"><h3>Slide ${escapeHtml(parts[i])}</h3><pre>${escapeHtml((parts[i + 1] || "").trim())}</pre></section>`;
  }
  return html;
}

function renderAdd() {
  heroCmd.textContent = "open issues/new";
  heroBio.textContent = "Friends should not need git. Export a PDF and fill the issue form.";
  view.innerHTML = `
    <div class="prose">
      <p>These talks were mostly live and unscripted. The archive stores the deck, not a reconstructed teleprompter.</p>
      <ol>
        <li>In Google Slides: <strong>File → Download → PDF Document (.pdf)</strong>. Skip Print-to-PDF.</li>
        <li>Open the <a href="${ISSUE_NEW}">Submit a talk</a> issue form.</li>
        <li>Month/year is enough. Day is optional.</li>
        <li>Who presented: <code>@github</code>, an alias, or a real name.</li>
        <li>Drag the PDF into the slides field. GitHub attachments cap around 25MB.</li>
      </ol>
      <p>A draft pull request is opened. CI extracts per-slide text into <code>slides.md</code> so the catalog can search it. Nothing merges until someone looks at it.</p>
      <p>Optional later: a short <code>recap.md</code>, or captions you align with <code>npm run align -- &lt;slug&gt; captions.vtt</code>. Do not invent a script of the room.</p>
      <p><a class="btn" href="${ISSUE_NEW}">Submit a talk</a></p>
    </div>
  `;
}

async function fetchText(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
