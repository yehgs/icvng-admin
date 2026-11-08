// admin/src/components/campaign/campaignUtils.js
// Pure helpers for the Seasonal Campaigns admin: time-zone-correct date inputs,
// client-side contrast hints (the SERVER is still the authority), and constants.

export const CAMPAIGN_TYPES = ["BLACK_FRIDAY", "CHRISTMAS", "CUSTOM"];
export const STATUSES = ["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "ENDED", "ARCHIVED"];
export const EFFECTS = ["NONE", "SNOWFALL", "SPARKLE", "SUBTLE_PARTICLES"];
export const FONTS = ["DEFAULT", "SERIF", "SANS"];
export const BLOCK_TYPES = ["HERO", "PROMO_STRIP", "FEATURED_PRODUCTS", "FEATURED_CATEGORIES", "GIFT_COLLECTION", "COUNTDOWN"];
export const THEME_COLOR_FIELDS = [
  "backgroundColor", "surfaceColor", "primaryColor", "secondaryColor", "accentColor",
  "textColor", "mutedTextColor", "badgeBackground", "badgeText",
];

export const STATUS_STYLE = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
  PAUSED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  ENDED: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  ARCHIVED: "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400",
};

export const HEX = /^#[0-9a-fA-F]{6}$/;

// ── time zones ────────────────────────────────────────────────────────────────
// <input type="datetime-local"> has no zone. Campaign dates are authored in the
// CAMPAIGN's timezone (its country's), so convert explicitly rather than using
// the admin's browser zone — an IT admin in Abuja scheduling a Rome campaign
// must get Rome midnight.
function zoneParts(date, timeZone) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

/** ISO instant → "YYYY-MM-DDTHH:mm" wall-clock in `timeZone` (for datetime-local). */
export function isoToZonedInput(iso, timeZone) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const z = zoneParts(d, timeZone || "UTC");
  const p = (n) => String(n).padStart(2, "0");
  return `${z.y}-${p(z.mo)}-${p(z.d)}T${p(z.h)}:${p(z.mi)}`;
}

/** "YYYY-MM-DDTHH:mm" wall-clock in `timeZone` → ISO instant. */
export function zonedInputToIso(local, timeZone) {
  if (!local) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return "";
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  // Two passes settle DST edges.
  let utc = guess;
  for (let i = 0; i < 2; i++) {
    const z = zoneParts(new Date(utc), timeZone || "UTC");
    const asUtc = Date.UTC(z.y, z.mo - 1, z.d, z.h, z.mi, z.s);
    utc += guess - asUtc;
  }
  return new Date(utc).toISOString();
}

export function formatInZone(iso, timeZone, locale) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale || undefined, { timeZone: timeZone || "UTC", dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

// ── contrast (hint only; server enforces) ───────────────────────────────────
const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
export function contrastRatio(a, b) {
  if (!HEX.test(a) || !HEX.test(b)) return null;
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
// MUST mirror server/utils/campaignTheme.js CONTRAST_PAIRS (fg, bg, min).
export const CONTRAST_PAIRS = [
  ["textColor", "backgroundColor", 4.5],
  ["textColor", "surfaceColor", 4.5],
  ["mutedTextColor", "backgroundColor", 4.5],
  ["mutedTextColor", "surfaceColor", 4.5],
  ["badgeText", "badgeBackground", 4.5],
];
export function contrastIssues(theme) {
  const out = [];
  for (const [fg, bg, min] of CONTRAST_PAIRS) {
    const r = contrastRatio(theme?.[fg], theme?.[bg]);
    if (r !== null && r < min) out.push({ fg, bg, ratio: r, min });
  }
  return out;
}

export const slugify = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export const money = (n, currency = "NGN") => {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(n) || 0); } catch { return `${currency} ${n}`; }
};
