import { describe, expect, it } from "vitest"
import { canStartRun } from "./index"

describe("canStartRun", () => {
  it("is true while there is budget above the reserve", () => {
    expect(canStartRun({ creditUsd: 100, consumedUsd: 30, reserveUsd: 20 })).toBe(true)
  })

  it("is false once the reserve is reached", () => {
    expect(canStartRun({ creditUsd: 100, consumedUsd: 90, reserveUsd: 20 })).toBe(false)
  })
})
