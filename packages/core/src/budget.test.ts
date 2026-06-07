import { describe, expect, it } from "vitest"
import { availableToBurn, recordSpend, runBudgetUsd } from "./budget"

describe("availableToBurn", () => {
  it("returns what's left after the reserve", () => {
    expect(availableToBurn({ creditUsd: 100, consumedUsd: 30, reserveUsd: 20 })).toBe(50)
  })

  it("never goes negative once the reserve is reached", () => {
    expect(availableToBurn({ creditUsd: 100, consumedUsd: 90, reserveUsd: 20 })).toBe(0)
  })
})

describe("runBudgetUsd", () => {
  it("caps the run at the per-run limit when there is plenty left", () => {
    expect(runBudgetUsd({ creditUsd: 100, consumedUsd: 0, reserveUsd: 20 }, 10)).toBe(10)
  })

  it("shrinks to what's available when the budget is the tighter limit", () => {
    expect(runBudgetUsd({ creditUsd: 100, consumedUsd: 75, reserveUsd: 20 }, 10)).toBe(5)
  })

  it("is zero when nothing is left to burn", () => {
    expect(runBudgetUsd({ creditUsd: 100, consumedUsd: 90, reserveUsd: 20 }, 10)).toBe(0)
  })
})

describe("recordSpend", () => {
  it("adds the spend to what's already consumed", () => {
    const after = recordSpend({ creditUsd: 100, consumedUsd: 30, reserveUsd: 20 }, 5)
    expect(after.consumedUsd).toBe(35)
  })

  it("leaves the original budget unchanged", () => {
    const before = { creditUsd: 100, consumedUsd: 30, reserveUsd: 20 }
    recordSpend(before, 5)
    expect(before.consumedUsd).toBe(30)
  })
})
