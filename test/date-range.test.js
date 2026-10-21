import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DATE_RANGE_PARAM_KEYS,
  buildDateRangeUrlParams,
  countDays,
  createPresetRange,
  fromIsoDate,
  parseDateRangeParams,
  resolvePreset,
} from "../src/date-range/date-range.js";

describe("resolvePreset", () => {
  it("resolves presets against the given day", () => {
    assert.deepEqual(resolvePreset("today", "2026-10-15"), { from: "2026-10-15", to: "2026-10-15" });
    assert.deepEqual(resolvePreset("thisMonth", "2026-10-15"), { from: "2026-10-01", to: "2026-10-15" });
    assert.deepEqual(resolvePreset("lastMonth", "2026-10-15"), { from: "2026-09-01", to: "2026-09-30" });
    assert.deepEqual(resolvePreset("last7Days", "2026-10-15"), { from: "2026-10-09", to: "2026-10-15" });
    assert.deepEqual(resolvePreset("allTime", "2026-10-15"), { from: null, to: null });
    assert.equal(resolvePreset("unknown", "2026-10-15"), null);
  });

  it("starts weeks on Monday", () => {
    // 2026-10-15 is a Thursday
    assert.deepEqual(resolvePreset("thisWeek", "2026-10-15"), { from: "2026-10-12", to: "2026-10-15" });
  });
});

describe("parseDateRangeParams", () => {
  it("reads a preset, a custom range or nothing", () => {
    assert.equal(parseDateRangeParams({ range: "thisMonth" }, { defaultPreset: null }).preset, "thisMonth");
    assert.deepEqual(
      parseDateRangeParams(new URLSearchParams("date_from=2026-09-02&date_to=2026-09-10"), { defaultPreset: null }),
      { preset: "custom", from: "2026-09-02", to: "2026-09-10" },
    );
    assert.equal(parseDateRangeParams({}, { defaultPreset: null }), null);
  });

  it("swaps reversed dates and ignores invalid ones", () => {
    assert.deepEqual(
      parseDateRangeParams({ date_from: "2026-09-10", date_to: "2026-09-02" }, { defaultPreset: null }),
      { preset: "custom", from: "2026-09-02", to: "2026-09-10" },
    );
    assert.equal(parseDateRangeParams({ date_from: "2026-02-31", date_to: "2026-03-01" }, { defaultPreset: null }), null);
  });

  it("reads a single day as an open range", () => {
    assert.deepEqual(
      parseDateRangeParams({ date_from: "2026-09-02" }, { defaultPreset: null }),
      { preset: "custom", from: "2026-09-02", to: null },
    );
    assert.deepEqual(
      parseDateRangeParams(new URLSearchParams("date_to=2026-09-10"), { defaultPreset: null }),
      { preset: "custom", from: null, to: "2026-09-10" },
    );
    assert.equal(parseDateRangeParams({ date_from: "2026-02-31" }, { defaultPreset: null }), null);
    assert.equal(parseDateRangeParams({ date_from: "2026-09-02" }, { defaultPreset: null, allowOpenRange: false }), null);
  });

  it("reads includeEmpty from the empty key, only next to a range", () => {
    const keys = { preset: "updated_range", from: "updated_from", to: "updated_to", empty: "updated_empty" };

    assert.deepEqual(
      parseDateRangeParams({ updated_from: "2026-10-10", updated_empty: "1" }, { defaultPreset: null, keys }),
      { preset: "custom", from: "2026-10-10", to: null, includeEmpty: true },
    );
    assert.equal(parseDateRangeParams({ updated_range: "thisMonth", updated_empty: "1" }, { defaultPreset: null, keys }).includeEmpty, true);
    assert.equal("includeEmpty" in parseDateRangeParams({ updated_from: "2026-10-10", updated_empty: "0" }, { defaultPreset: null, keys }), false);
    assert.equal(parseDateRangeParams({ updated_empty: "1" }, { defaultPreset: null, keys }), null);
    // Without an empty key the param is not read
    assert.equal("includeEmpty" in parseDateRangeParams({ date_from: "2026-10-10", date_empty: "1" }, { defaultPreset: null }), false);
  });
});

describe("buildDateRangeUrlParams", () => {
  it("keeps presets by key and custom ranges by dates", () => {
    assert.deepEqual(buildDateRangeUrlParams(createPresetRange("thisMonth"), { defaultPreset: null }), {
      range: "thisMonth",
      date_from: null,
      date_to: null,
    });
    assert.deepEqual(
      buildDateRangeUrlParams({ preset: "custom", from: "2026-09-02", to: "2026-09-10" }, { defaultPreset: null }),
      { range: null, date_from: "2026-09-02", date_to: "2026-09-10" },
    );
    assert.deepEqual(
      buildDateRangeUrlParams({ preset: "custom", from: "2026-09-02", to: null }, { defaultPreset: null }),
      { range: null, date_from: "2026-09-02", date_to: null },
    );
    assert.deepEqual(buildDateRangeUrlParams(null), { range: null, date_from: null, date_to: null });
  });

  it("writes includeEmpty to the empty key", () => {
    const keys = { ...DATE_RANGE_PARAM_KEYS, empty: "date_empty" };

    assert.deepEqual(
      buildDateRangeUrlParams({ preset: "custom", from: "2026-10-10", to: null, includeEmpty: true }, { defaultPreset: null, keys }),
      { range: null, date_from: "2026-10-10", date_to: null, date_empty: "1" },
    );
    assert.equal(buildDateRangeUrlParams({ preset: "thisMonth", from: "2026-10-01", to: "2026-10-31" }, { defaultPreset: null, keys }).date_empty, null);
    assert.equal(buildDateRangeUrlParams(null, { keys }).date_empty, null);
    // No dates, no empty: "All time" lists them anyway
    assert.equal(buildDateRangeUrlParams({ preset: "allTime", from: null, to: null, includeEmpty: true }, { defaultPreset: null, keys }).date_empty, null);
  });
});

describe("date helpers", () => {
  it("counts days inclusively and rejects overflowed dates", () => {
    assert.equal(countDays("2026-09-02", "2026-09-10"), 9);
    assert.equal(fromIsoDate("2026-02-31"), null);
  });
});
