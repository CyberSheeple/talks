const MONTHS = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function pad(n) {
  return String(n).padStart(2, "0");
}

export function parseMonthYear(raw) {
  const value = String(raw ?? "").trim();
  if (!value) {
    throw new Error("Month / year is required.");
  }

  let m = value.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (m) {
    return { year: Number(m[1]), month: Number(m[2]) };
  }

  m = value.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (m) {
    return { year: Number(m[2]), month: Number(m[1]) };
  }

  m = value.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (m) {
    const month = MONTHS[m[1].toLowerCase()];
    if (!month) throw new Error(`Unknown month in "${value}".`);
    return { year: Number(m[2]), month };
  }

  m = value.match(/^(\d{4})\s+([A-Za-z]+)$/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (!month) throw new Error(`Unknown month in "${value}".`);
    return { year: Number(m[1]), month };
  }

  throw new Error(`Could not parse month/year "${value}". Try 2026-04 or April 2026.`);
}

export function parseDay(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 31) {
    throw new Error(`Could not parse day "${value}". Use 1–31, or leave it blank.`);
  }
  return n;
}

export function buildTalkDate({ year, month, day }) {
  if (!Number.isInteger(year) || year < 1990 || year > 2100) {
    throw new Error(`Invalid year "${year}".`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month "${month}".`);
  }
  if (day == null) {
    return {
      date: `${year}-${pad(month)}-01`,
      datePrecision: "month",
    };
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
    throw new Error(`Invalid date ${year}-${pad(month)}-${pad(day)}.`);
  }
  return {
    date: `${year}-${pad(month)}-${pad(day)}`,
    datePrecision: "day",
  };
}

export function formatTalkDate(date, datePrecision) {
  const [year, month, day] = String(date).split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, day || 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  if (datePrecision === "day" && day) {
    return new Date(Date.UTC(year, month - 1, day)).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  return label;
}
