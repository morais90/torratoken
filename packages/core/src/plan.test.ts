import { describe, expect, it } from "vitest"
import { monthlyCreditUsd } from "./plan"

describe("monthlyCreditUsd", () => {
  it("maps each subscription plan to its Agent SDK credit", () => {
    expect(monthlyCreditUsd("pro")).toBe(20)
    expect(monthlyCreditUsd("max-5x")).toBe(100)
    expect(monthlyCreditUsd("max-20x")).toBe(200)
  })
})
