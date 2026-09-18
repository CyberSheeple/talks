export function formatTalkDate(date, datePrecision) {
  const [year, month, day] = String(date).split("-").map(Number);
  if (datePrecision === "day" && day) {
    return new Date(Date.UTC(year, month - 1, day)).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return new Date(Date.UTC(year, month - 1, day || 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function monthKey(date) {
  return String(date).slice(0, 7);
}

export function speakerNames(talk) {
  if (Array.isArray(talk.speakerLabels) && talk.speakerLabels.length) {
    return talk.speakerLabels.join(", ");
  }
  return (talk.speakers || [])
    .map((s) => (typeof s === "string" ? s : s.display || s.github || ""))
    .filter(Boolean)
    .join(", ");
}
