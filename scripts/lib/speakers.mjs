const GITHUB_RE = /^@?([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)$/;

export function parseSpeakers(raw) {
  const value = String(raw ?? "").trim();
  if (!value) {
    throw new Error("Who presented is required.");
  }

  const parts = value
    .split(/[,;&/]| and /i)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error("Who presented is required.");
  }

  return parts.map(parseOneSpeaker);
}

export function parseOneSpeaker(raw) {
  const value = String(raw ?? "").trim();
  if (!value) {
    throw new Error("Empty speaker name.");
  }

  const tagged = value.match(/^@([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)$/);
  if (tagged) {
    return { display: tagged[1], github: tagged[1] };
  }

  const githubMatch = GITHUB_RE.exec(value);
  if (githubMatch && !value.includes(" ") && value === value.toLowerCase()) {
    return { display: githubMatch[1], github: githubMatch[1] };
  }

  return { display: value };
}

export function speakerLabel(speaker) {
  if (!speaker) return "";
  if (typeof speaker === "string") return speaker.replace(/^@/, "");
  return speaker.display || speaker.github || "";
}

export function speakerGithub(speaker) {
  if (!speaker) return null;
  if (typeof speaker === "string") {
    const tagged = speaker.match(/^@?([A-Za-z0-9-]+)$/);
    return tagged ? tagged[1] : null;
  }
  return speaker.github || null;
}
