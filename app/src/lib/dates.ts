// Parses a Postgres timestamp string into a Date. Neon returns `timestamp`
// columns (schema uses mode:"string") as UTC wall-clock with a space separator
// and no zone, e.g. "2026-07-08 14:58:25.043541". `new Date()` on that form is
// unreliable — Safari returns Invalid Date, and V8 treats it as LOCAL time,
// shifting every value by the viewer's offset. Normalize to ISO UTC first.
export function parseDbTimestamp(value: string): Date {
  if (!value) return new Date(NaN);
  const s = value.includes("T") ? value : value.replace(" ", "T");
  const hasZone = /[zZ]$|[+-]\d\d:?\d\d$/.test(s);
  return new Date(hasZone ? s : s + "Z");
}

export function formatDateTime(value: string): string {
  const d = parseDbTimestamp(value);
  return isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export function formatDate(value: string): string {
  const d = parseDbTimestamp(value);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}
