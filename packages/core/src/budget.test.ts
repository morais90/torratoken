import { describe, expect, it } from "vitest"
import { availableToBurn } from "./budget"

describe("availableToBurn", () => {
  it("returns what's left after the reserve", () => {
    expect(availableToBurn({ creditUsd: 100, consumedUsd: 30, reserveUsd: 20 })).toBe(50)
  })

  it("never goes negative once the reserve is reached", () => {
    expect(availableToBurn({ creditUsd: 100, consumedUsd: 90, reserveUsd: 20 })).toBe(0)
  })
})
