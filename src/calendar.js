export function zonedDate(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now);
  return Object.fromEntries(parts.filter(p => ['year', 'month', 'day'].includes(p.type)).map(p => [p.type, Number(p.value)]));
}

export function unlockLimit(now, edition) {
  const local = zonedDate(now, edition.timeZone);
  const monthDifference = (local.year - edition.year) * 12 + local.month - edition.month;
  if (monthDifference < 0) return 0;
  if (monthDifference > 0) return 31;
  return Math.min(31, local.day + 1);
}

export function canReveal(day, now, edition) {
  return Number.isInteger(day) && day >= 1 && day <= 31 && day <= unlockLimit(now, edition);
}

export function storageKey(edition) { return `nuestro-octubre:${edition.year}-${edition.month}:v1`; }

export function normalizeState(raw) {
  const clean = list => [...new Set((Array.isArray(list) ? list : []).filter(d => Number.isInteger(d) && d >= 1 && d <= 31))];
  const revealed = clean(raw?.revealed);
  return { revealed, watched: clean(raw?.watched).filter(d => revealed.includes(d)) };
}

export function readState(storage, edition) {
  try { return normalizeState(JSON.parse(storage.getItem(storageKey(edition)))); }
  catch { return normalizeState(null); }
}

export function writeState(storage, edition, state) {
  try { storage.setItem(storageKey(edition), JSON.stringify(normalizeState(state))); return true; }
  catch { return false; }
}
