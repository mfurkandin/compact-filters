import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { DateRangePanel, DateRangePicker, FilterBar } from "../dist/index.js";

// Smoke tests against the build output, run `npm run build` first

const filters = [
  { key: "status", label: "Durum", options: [{ value: "paid", label: "Ödenmiş" }], defaultValue: "all" },
  { key: "date", label: "Tarih Aralığı", type: "dateRange", defaultValue: null },
];

describe("FilterBar", () => {
  it("renders active filters as chips", () => {
    const html = renderToString(
      h(FilterBar, {
        filters,
        values: { status: "paid", date: { preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" }, q: "" },
        search: { key: "q", placeholder: "Ara..." },
      }),
    );

    assert.match(html, /Filtrele/);
    assert.match(html, /Ödenmiş/);
    assert.match(html, /Bu ay/);
    assert.match(html, /Ara\.\.\./);
  });

  it("hides filters on their default value", () => {
    const html = renderToString(h(FilterBar, { filters, values: { status: "all", date: null } }));

    assert.doesNotMatch(html, /Ödenmiş/);
    assert.doesNotMatch(html, /Temizle/);
  });

  it("uses English texts and label overrides", () => {
    const html = renderToString(
      h(FilterBar, {
        locale: "en",
        labels: { filter: "Refine" },
        filters,
        values: { date: { preset: "last7Days", from: "2026-10-09", to: "2026-10-15" } },
      }),
    );

    assert.match(html, /Refine/);
    assert.match(html, /Last 7 days/);
    assert.match(html, /Clear/);
  });

  it("shows custom ranges as dates", () => {
    const html = renderToString(
      h(FilterBar, { filters, values: { date: { preset: "custom", from: "2026-09-02", to: "2026-09-10" } } }),
    );

    assert.match(html, /02\.09\.2026 – 10\.09\.2026/);
  });

  it("shows custom ranges in the given date format", () => {
    const values = { date: { preset: "custom", from: "2026-09-02", to: "2026-09-10" } };

    assert.match(renderToString(h(FilterBar, { filters, values, dateFormat: "iso" })), /2026-09-02 – 2026-09-10/);
    assert.match(
      renderToString(h(FilterBar, { filters, values, dateFormat: (date) => date.replaceAll("-", "/") })),
      /2026\/09\/02 – 2026\/09\/10/,
    );
  });

  it("shows open ranges with their single day", () => {
    const openFilters = filters.map((filter) => (filter.type === "dateRange" ? { ...filter, allowOpenRange: true } : filter));

    assert.match(
      renderToString(h(FilterBar, { filters: openFilters, values: { date: { preset: "custom", from: "2026-10-01", to: null } } })),
      /01\.10\.2026 ve sonrası/,
    );
    assert.match(
      renderToString(
        h(FilterBar, { locale: "en", dateFormat: "iso", filters: openFilters, values: { date: { preset: "custom", from: null, to: "2026-10-31" } } }),
      ),
      /Until 2026-10-31/,
    );
  });
});

describe("DateRangePicker", () => {
  it("renders the trigger with the applied preset", () => {
    const html = renderToString(
      h(DateRangePicker, { value: { preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" }, onChange: () => {} }),
    );

    assert.match(html, /Bu ay/);
    assert.match(html, /01\.10\.2026/);
  });

  it("renders the trigger dates in the given date format", () => {
    const html = renderToString(
      h(DateRangePicker, { value: { preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" }, dateFormat: "iso" }),
    );

    assert.match(html, /2026-10-01/);
    assert.match(html, /2026-10-15/);
    assert.doesNotMatch(html, /01\.10\.2026/);
  });

  it("renders the trigger with an open range", () => {
    const html = renderToString(h(DateRangePicker, { value: { preset: "custom", from: "2026-10-01", to: null }, allowOpenRange: true }));

    assert.match(html, /01\.10\.2026 ve sonrası/);
  });

  it("falls back to the placeholder without a value", () => {
    assert.match(renderToString(h(DateRangePicker, { value: null, locale: "en" })), /Date Range/);
  });
});

describe("DateRangePanel", () => {
  const applyDisabled = (html) => /<button[^>]*disabled=""[^>]*>Uygula<\/button>/.test(html);

  it("applies a single day only with allowOpenRange", () => {
    const value = { preset: "custom", from: "2026-10-01", to: null };

    assert.equal(applyDisabled(renderToString(h(DateRangePanel, { value }))), true);
    assert.equal(applyDisabled(renderToString(h(DateRangePanel, { value, allowOpenRange: true }))), false);
    assert.equal(applyDisabled(renderToString(h(DateRangePanel, { value: { preset: "custom", from: null, to: null }, allowOpenRange: true }))), true);
  });

  it("limits the days to today unless maxDate is null", () => {
    const value = { preset: "custom", from: "2026-10-01", to: null };

    assert.match(renderToString(h(DateRangePanel, { value })), /type="date"[^>]*max="\d{4}-\d{2}-\d{2}"/);
    assert.doesNotMatch(renderToString(h(DateRangePanel, { value, maxDate: null })), /max="/);
    assert.match(renderToString(h(DateRangePanel, { value, maxDate: "2027-12-31" })), /max="2027-12-31"/);
  });

  it("opens on the start day of an open range", () => {
    const html = renderToString(h(DateRangePanel, { value: { preset: "custom", from: "2027-03-10", to: null }, allowOpenRange: true, maxDate: null }));

    assert.match(html, /10 Mart 2027/);
  });
});
