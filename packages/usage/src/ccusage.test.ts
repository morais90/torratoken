import { describe, expect, it } from "vitest"
import { consumedForMonth, monthKey } from "./ccusage"

const report = JSON.stringify({
  monthly: [
    { period: "2026-05", totalCost: 80.5 },
    { period: "2026-06", totalCost: 42.25 },
  ],
})

describe("monthKey", () => {
  it("formats a date as a zero-padded YYYY-MM key", () => {
    expect(monthKey(new Date(2026, 5, 12))).toBe("2026-06")
    expect(monthKey(new Date(2026, 0, 1))).toBe("2026-01")
  })
})

describe("consumedForMonth", () => {
  it("returns the total cost of the matching month", () => {
    expect(consumedForMonth(report, "2026-06")).toBe(42.25)
  })

  it("treats a month with no usage as zero", () => {
    expect(consumedForMonth(report, "2026-07")).toBe(0)
  })
})
