import { describe, expect, it } from "vitest"
import { formatUsd } from "./format"

describe("formatUsd", () => {
  it("formats with two decimals", () => {
    expect(formatUsd(50)).toBe("$50.00")
  })
})
