# CyberSheeple talks

Archive of monthly internal knowledge-share decks. Most of them already live in Google Slides. This repo is not a slide-authoring kit: people export a PDF, attach it to a GitHub Issue, and CI extracts the words on the slides so the catalog can search them.

The talks were mostly live and unscripted. Do not generate a fake speaker script and treat it as what was said. Search is the on-screen text. A short recap is optional. A spoken transcript is an enhancement when you have captions or a recording you transcribed elsewhere.

Catalog (once DNS/Pages are on): [talks.hackers.nyc](https://talks.hackers.nyc)

## Submit a talk (the easy path)

Friends should not need git or Node.

1. In Google Slides: **File → Download → PDF Document (.pdf)**. Do not use Print → Save as PDF — that often rasterizes text and search cannot read it.
2. Open **[Submit a talk](https://github.com/CyberSheeple/talks/issues/new?template=submit-talk.yml)**.
3. Month and year of the talk. Day is optional; the catalog will show “April 2026” instead of inventing a date.
4. Who presented: `@github` usernames, aliases, or IRL names.
5. Drag the PDF into the slides field (GitHub issue attachments cap around 25MB).

## GitHub org

Canonical repo: **[CyberSheeple/talks](https://github.com/CyberSheeple/talks)** (public).

Still needed in the GitHub UI:

1. Create a `talk` label (the issue form applies it). Ingest also runs if the issue title starts with `[talk]`.
2. Enable Issues if they are off.
3. Enable Pages from `main` `/`.
4. DNS: CNAME `talks.hackers.nyc` → `cybersheeple.github.io`, same pattern as `hackerpost.hackers.nyc`.

If the PDF is larger than 25MB, open a PR and drop `slides.pdf` into a new folder under `talks/` instead. The same extract job still runs.

## Layout

```
talks/
  2026-09-01-how-to-add-a-talk/
    talk.json        # title, date, datePrecision, speakers, …
    slides.pdf       # Google Slides export
    slides.md        # CI-generated, searchable
    recap.md         # optional short writeup
    transcript.md    # optional spoken text, same Slide N headings
```

`datePrecision` is `"month"` when the day was omitted (`YYYY-MM-01` is only a sort key) and `"day"` when a real day was given.

Speakers are objects: `{ "display": "joevdotme", "github": "joevdotme" }` or `{ "display": "Alice" }`.

## Local catalog

```bash
npm install
npm test
npm run ingest
npm start
```

Then open [http://127.0.0.1:43141](http://127.0.0.1:43141). The site is static HTML/CSS/ES modules, same hosting model as [hackers.nyc](https://hackers.nyc): GitHub Pages, no build step.

Maintainer helpers:

```bash
npm run new-talk -- --title "SillyCTF recap" --month 2026-04 --day 12 --speakers "@joevdotme, DullPointer"
# drop slides.pdf into the printed folder, then:
npm run ingest
npm run align -- 2026-04-12-sillyctf-recap captions.vtt
```

`align` maps a `.vtt`, `.srt`, or plain script onto `## Slide N` using word overlap with `slides.md`. Audio does not belong in git. Transcribe elsewhere (local Whisper, YouTube captions, Otter), then align.

## GitHub Pages

This repo is meant to publish from `main` `/` (not `/docs`). `CNAME` is `talks.hackers.nyc`. Point a DNS CNAME at `cybersheeple.github.io`, same pattern as `hackerpost.hackers.nyc`. Local preview does not wait on that DNS.

`.nojekyll` is required so GitHub Pages does not swallow `_template`.

## What this is not

- Not Next.js, not a CMS, not Google Slides OAuth
- Not auto-merge from issues
- Not a Whisper pipeline
