function tokens(q) {
  return String(q || "")
    .toLowerCase()
    .match(/[a-z0-9@]+/g) || [];
}

function haystack(talk) {
  return [
    talk.title,
    talk.summary,
    (talk.tags || []).join(" "),
    (talk.speakerLabels || []).join(" "),
    talk.slidesText,
    talk.recapText,
    talk.transcriptText,
  ]
    .join("\n")
    .toLowerCase();
}

export function searchTalks(talks, query) {
  const q = String(query || "").trim();
  if (!q) {
    return talks.map((talk) => ({ talk, score: 0, hit: "" }));
  }
  const terms = tokens(q);
  const results = [];
  for (const talk of talks) {
    const blob = haystack(talk);
    const title = String(talk.title || "").toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 8;
      if ((talk.speakerLabels || []).join(" ").toLowerCase().includes(term)) score += 5;
      if ((talk.tags || []).join(" ").toLowerCase().includes(term)) score += 4;
      if (blob.includes(term)) score += 1;
    }
    if (score === 0) continue;
    results.push({ talk, score, hit: snippet(blob, terms[0], talk) });
  }
  results.sort((a, b) => b.score - a.score || String(b.talk.date).localeCompare(String(a.talk.date)));
  return results;
}

function snippet(blob, term, talk) {
  if (!term) return talk.summary || "";
  const idx = blob.indexOf(term);
  if (idx < 0) return talk.summary || "";
  const start = Math.max(0, idx - 32);
  const slice = blob.slice(start, idx + 64).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + slice + (idx + 64 < blob.length ? "…" : "");
}
