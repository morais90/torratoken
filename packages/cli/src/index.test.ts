import { describe, expect, it } from "vitest"
import { budgetLine } from "./index"

describe("budgetLine", () => {
  it("formats the amount still available to burn", () => {
    expect(budgetLine({ creditUsd: 100, consumedUsd: 30, reserveUsd: 20 })).toBe(
      "available to burn: $50.00",
    )
  })
})
