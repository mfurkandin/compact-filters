/**
 * Date range helpers shared by the DateRangePicker, URL state and list query params.
 *
 * Dates are kept as local "YYYY-MM-DD" strings so values survive URL round-trips
 * without timezone shifts. Preset ranges are stored by key (e.g. `range=last30Days`)
 * and resolved against "today" on every read, so a shared link keeps rolling.
 */

export const DATE_RANGE_PARAM_KEYS = {
  preset: "range",
  from: "date_from",
  to: "date_to",
};

export const CUSTOM_PRESET = "custom";

// No dates: no date limit. Not "all", which URL helpers treat as "no filter" and drop.
export const ALL_PRESET = "allTime";

// Labels come from labels.js (`presets`), so a consumer can rename or translate them
export const DATE_RANGE_PRESETS = [
  { key: ALL_PRESET },
  { key: "today" },
  { key: "yesterday" },
  { key: "thisWeek" },
  { key: "lastWeek" },
  { key: "thisMonth" },
  { key: "lastMonth" },
  { key: "thisYear" },
  { key: "lastYear" },
  { key: "last7Days" },
  { key: "last14Days" },
  { key: "last30Days" },
  { key: "last60Days" },
  { key: "last90Days" },
  { key: "last180Days" },
  { key: "last365Days" },
];

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function pad(value) {
  return String(value).padStart(2, "0");
}

export function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Parse "YYYY-MM-DD" into a local Date at noon (noon avoids DST edge cases).
 */
export function fromIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);

  // Reject overflowed values such as 2026-02-31.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

export function isIsoDate(value) {
  return fromIsoDate(value) !== null;
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function addDays(value, days) {
  const date = fromIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function addMonths(value, months) {
  const date = fromIsoDate(value);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toIsoDate(date);
}

// Weeks start on Monday
export function startOfWeek(value) {
  return addDays(value, -((fromIsoDate(value).getDay() + 6) % 7));
}

export function startOfMonth(value) {
  return `${value.slice(0, 7)}-01`;
}

export function endOfMonth(value) {
  const date = fromIsoDate(startOfMonth(value));
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12));
}

/**
 * Inclusive day count between two ISO dates (same day → 1).
 */
export function countDays(from, to) {
  const start = fromIsoDate(from);
  const end = fromIsoDate(to);

  if (!start || !end) {
    return 0;
  }

  return Math.round((end - start) / 86_400_000) + 1;
}

export function resolvePreset(key, today = todayIso()) {
  const year = Number(today.slice(0, 4));

  switch (key) {
    case ALL_PRESET:
      return { from: null, to: null };
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case "thisWeek":
      return { from: startOfWeek(today), to: today };
    case "lastWeek": {
      const previousWeek = addDays(startOfWeek(today), -7);
      return { from: previousWeek, to: addDays(previousWeek, 6) };
    }
    case "thisMonth":
      return { from: startOfMonth(today), to: today };
    case "lastMonth": {
      const previousMonth = addMonths(startOfMonth(today), -1);
      return { from: previousMonth, to: endOfMonth(previousMonth) };
    }
    case "thisYear":
      return { from: `${year}-01-01`, to: today };
    case "lastYear":
      return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    case "last7Days":
      return { from: addDays(today, -6), to: today };
    case "last14Days":
      return { from: addDays(today, -13), to: today };
    case "last30Days":
      return { from: addDays(today, -29), to: today };
    case "last60Days":
      return { from: addDays(today, -59), to: today };
    case "last90Days":
      return { from: addDays(today, -89), to: today };
    case "last180Days":
      return { from: addDays(today, -179), to: today };
    case "last365Days":
      return { from: addDays(today, -364), to: today };
    default:
      return null;
  }
}

export function isPresetKey(key) {
  return DATE_RANGE_PRESETS.some((preset) => preset.key === key);
}

/**
 * Build a full range value `{ preset, from, to }` from a preset key.
 */
export function createPresetRange(key, today = todayIso()) {
  const resolved = resolvePreset(key, today);
  return resolved ? { preset: key, ...resolved } : null;
}

function readSourceParam(source, key) {
  if (!source) {
    return undefined;
  }

  if (typeof source.get === "function") {
    return source.get(key) ?? undefined;
  }

  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Read a range value from URLSearchParams or a Next.js searchParams object.
 *
 * - `range=<preset>` wins and is resolved against today.
 * - `date_from` + `date_to` produce a custom range.
 * - `date_from` or `date_to` alone produces an open range, e.g. `{ from, to: null }` (`allowOpenRange: false` ignores it).
 * - Otherwise `defaultPreset` is used (pass null to allow "no range").
 * - With a `keys.empty` key, `<empty>=1` adds `includeEmpty: true` to the range (see `emptyValues`).
 */
export function parseDateRangeParams(source, options = {}) {
  const range = parseDateRange(source, options);
  const emptyKey = options.keys?.empty;

  if (range && emptyKey && readSourceParam(source, emptyKey) === "1") {
    return { ...range, includeEmpty: true };
  }

  return range;
}

function parseDateRange(source, options) {
  const { defaultPreset = "last30Days", keys = DATE_RANGE_PARAM_KEYS, allowOpenRange = true } = options;
  const preset = readSourceParam(source, keys.preset);

  if (preset && isPresetKey(preset)) {
    return createPresetRange(preset);
  }

  const from = readSourceParam(source, keys.from);
  const to = readSourceParam(source, keys.to);

  if (isIsoDate(from) && isIsoDate(to)) {
    return from <= to
      ? { preset: CUSTOM_PRESET, from, to }
      : { preset: CUSTOM_PRESET, from: to, to: from };
  }

  // Only when the other side is missing: an invalid one still drops the range
  if (allowOpenRange && isIsoDate(from) && !to) {
    return { preset: CUSTOM_PRESET, from, to: null };
  }

  if (allowOpenRange && isIsoDate(to) && !from) {
    return { preset: CUSTOM_PRESET, from: null, to };
  }

  return defaultPreset ? createPresetRange(defaultPreset) : null;
}

/**
 * URL params for a range value. Presets are stored by key only; the default
 * preset is removed from the URL entirely to keep links clean.
 */
export function buildDateRangeUrlParams(range, options = {}) {
  const params = buildRangeUrlParams(range, options);
  const emptyKey = options.keys?.empty;

  // Records without a date, kept only next to a range
  if (emptyKey) {
    params[emptyKey] = range?.includeEmpty ? "1" : null;
  }

  return params;
}

function buildRangeUrlParams(range, options) {
  const { defaultPreset = "last30Days", keys = DATE_RANGE_PARAM_KEYS } = options;

  if (!range) {
    return { [keys.preset]: null, [keys.from]: null, [keys.to]: null };
  }

  if (range.preset && range.preset !== CUSTOM_PRESET) {
    return {
      [keys.preset]: range.preset === defaultPreset ? null : range.preset,
      [keys.from]: null,
      [keys.to]: null,
    };
  }

  return { [keys.preset]: null, [keys.from]: range.from, [keys.to]: range.to };
}
