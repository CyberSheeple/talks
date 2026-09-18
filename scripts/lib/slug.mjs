const KEEP = /[a-z0-9]+/g;

export function slugifyTitle(title) {
  const words = String(title ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/['’]/g, "")
    .match(KEEP);
  if (!words || words.length === 0) return "talk";
  return words.join("-").slice(0, 80).replace(/-+$/g, "");
}

export function talkFolderName(date, title) {
  return `${date}-${slugifyTitle(title)}`;
}
