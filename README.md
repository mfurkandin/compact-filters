# compact-filters

A compact, dynamic filter bar and date range picker for React. Built on [Radix UI](https://www.radix-ui.com/) and styled with Tailwind CSS v4 using [shadcn/ui](https://ui.shadcn.com/) theme tokens, so it picks up your app's colors, radius and dark mode.

```
[⚲ Filter (2) ▾] [✉ Status: Paid ▾ ×] [📅 Date Range: This month ▾ ×] [🔍 Search...          ] Clear
```

- **Dynamic:** describe your filters as data, the bar does the rest
- **Compact:** only active filters take space, the rest wait in the "Filter" menu
- **Date ranges:** presets (today, this month, last 30 days…), custom ranges with a two-month calendar
- **URL-friendly:** helpers to keep date ranges in the query string, presets keep rolling with "today"
- **Accessible:** keyboard navigation, focus management, ARIA labels
- **Turkish and English** texts built in, every text can be overridden

## Installation

```sh
npm install compact-filters
```

Peer dependencies (most shadcn/ui apps already have them):

```sh
npm install react radix-ui lucide-react clsx tailwind-merge
```

### Tailwind CSS

The components are styled with Tailwind classes. Let Tailwind scan the package by adding one line to your global CSS:

```css
@import "tailwindcss";
@source "../node_modules/compact-filters/dist";
```

The path is relative to the CSS file. Colors come from the shadcn/ui CSS variables (`--primary`, `--muted`, `--accent`, `--popover`, `--input`, `--ring`…); if your app uses shadcn/ui, there is nothing else to set up.

## Quick start

```jsx
"use client";

import { useState } from "react";
import { FilterBar } from "compact-filters";
import { CalendarDays, CircleDollarSign } from "lucide-react";

const filters = [
  {
    key: "status",
    label: "Status",
    icon: CircleDollarSign,
    defaultValue: "all",
    options: [
      { value: "paid", label: "Paid" },
      { value: "unpaid", label: "Unpaid" },
    ],
  },
  { key: "date", label: "Date Range", icon: CalendarDays, type: "dateRange", defaultValue: null },
];

export function Invoices() {
  const [values, setValues] = useState({ status: "all", date: null, q: "" });

  return (
    <FilterBar
      locale="en"
      filters={filters}
      values={values}
      onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      search={{ key: "q", placeholder: "Search invoices" }}
    />
  );
}
```

`onChange` receives only the changed keys (`{ status: "paid" }`), or every key at once when the user clicks "Clear". Map them to your API query however you like.

## FilterBar

| Prop | Type | Description |
|---|---|---|
| `filters` | `Filter[]` | Filter definitions, see below |
| `values` | `object` | Current value of each filter, by `key` (and the search key) |
| `onChange` | `(patch) => void` | Called with the changed keys |
| `search` | `{ key, placeholder? }` | Optional search input inside the bar |
| `locale` | `"tr"` \| `"en"` | Built-in texts and date formats, default `"tr"` |
| `labels` | `object` | Overrides for built-in texts, see [Texts](#texts) |
| `className` | `string` | Extra classes for the bar |

### Filter types

**Select** (default)

| Field | Description |
|---|---|
| `key` | Key in `values` and `onChange` |
| `label` | Shown in the menu and on the chip |
| `icon` | Optional icon component, e.g. from `lucide-react` |
| `options` | `[{ value, label }]` |
| `defaultValue` | The "not filtering" value, e.g. `"all"`. A filter on its default value has no chip. Do not list it in `options`, removing the chip already means "all" |
| `searchable` | Show a search box in the options. Automatic above 8 options |

**Date range**

| Field | Description |
|---|---|
| `type` | `"dateRange"` |
| `defaultValue` | `null` |
| `presets` | Optional subset of `DATE_RANGE_PRESETS`, e.g. without `ALL_PRESET` |

A date range value is `{ preset, from, to }`: `preset` is a preset key or `"custom"`, `from` and `to` are inclusive `YYYY-MM-DD` dates in local time.

## DateRangePicker

The same date range UI as a standalone button, e.g. for a dashboard.

```jsx
import { DateRangePicker, createPresetRange } from "compact-filters";

const [range, setRange] = useState(() => createPresetRange("last30Days"));

<DateRangePicker value={range} onChange={setRange} resetPreset="last30Days" locale="en" />
```

| Prop | Type | Description |
|---|---|---|
| `value` | `{ preset, from, to } \| null` | Applied range |
| `onChange` | `(range) => void` | Called on "Apply" |
| `presets` | `{ key, label? }[]` | Preset list, default `DATE_RANGE_PRESETS` |
| `allowCustom` | `boolean` | Show "Custom", default `true` |
| `clearable` | `boolean` | Show "Clear", which calls `onChange(null)` |
| `resetPreset` | `string` | Show "Reset" back to this preset |
| `minDate` / `maxDate` | `string` | Selectable bounds, `maxDate` defaults to today (`null` for no limit) |
| `align` | `"start"` \| `"center"` \| `"end"` | Popover alignment, default `"end"` |
| `locale`, `labels` | | Same as FilterBar |

`DateRangePanel` (the popover content without the button) is exported too, for building your own trigger.

## Keeping filters in the URL

Date ranges are plain data, so the query string is a good home for them. The helpers have no framework dependency and are also available from `compact-filters/date-range`, which is safe for server code.

```js
import { buildDateRangeUrlParams, parseDateRangeParams } from "compact-filters/date-range";

// ?range=thisMonth  or  ?date_from=2026-10-01&date_to=2026-10-15
const range = parseDateRangeParams(searchParams, { defaultPreset: null });
// → { preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" } or null

const params = buildDateRangeUrlParams(range, { defaultPreset: null });
// → { range: "thisMonth", date_from: null, date_to: null }, null means "remove from the URL"
```

Presets are stored by key and resolved against today on every read, so a shared "this month" link keeps meaning "this month". Pass `keys: { preset, from, to }` to use other parameter names.

Other helpers: `createPresetRange`, `resolvePreset`, `isPresetKey`, `countDays`, `addDays`, `addMonths`, `startOfWeek`, `startOfMonth`, `endOfMonth`, `toIsoDate`, `fromIsoDate`, `isIsoDate`, `todayIso`, and the constants `DATE_RANGE_PRESETS`, `ALL_PRESET`, `CUSTOM_PRESET`, `DATE_RANGE_PARAM_KEYS`.

## Texts

Turkish (`tr`, default) and English (`en`) are built in. Any text can be overridden with `labels`, preset names under `presets`:

```jsx
<FilterBar labels={{ filter: "Refine", presets: { last7Days: "Past week" } }} />
```

All keys are listed in [`src/labels.js`](src/labels.js) and exported as `DEFAULT_LABELS`. For another language, pass a full `labels` object.

## Next.js

The main entry starts with `"use client"`, so the components work in the App Router; render them from a client component. `compact-filters/date-range` has no directive and can be used in server components and route handlers.

## Development

```sh
npm install
npm test        # builds, then runs unit and render tests
npm run build   # dist/index.js and dist/date-range.js
```

The source is plain JavaScript and JSX in `src/`, bundled with esbuild by `scripts/build.js`. Peer dependencies stay external.

## Publishing

1. Set the version: `npm version patch` (or `minor` / `major`)
2. `npm publish` (runs the tests and the build first)

To publish under an npm organization, rename the package (e.g. `@turkpin/compact-filters`) and add `"publishConfig": { "access": "public" }`.

## License

[MIT](LICENSE)
