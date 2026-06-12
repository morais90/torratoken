import { describe, expect, it } from "vitest"
import { availableToBurn } from "./budget"
import { meteredBudgetProvider } from "./metered-budget-provider"
import type { UsageMeter } from "./usage-meter"

const meterReading = (consumedUsd: number): UsageMeter => ({
  consumedThisMonth: () => Promise.resolve(consumedUsd),
})

describe("meteredBudgetProvider", () => {
  it("turns the plan into the monthly credit and reads the consumed spend", async () => {
    const provider = meteredBudgetProvider({ plan: "max-5x", reserveUsd: 15 }, meterReading(40))

    const budget = await provider.current()

    expect(budget).toEqual({ creditUsd: 100, consumedUsd: 40, reserveUsd: 15 })
  })

  it("reflects fresh consumption on each read", async () => {
    let consumed = 10
    const provider = meteredBudgetProvider(
      { plan: "pro", reserveUsd: 5 },
      { consumedThisMonth: () => Promise.resolve(consumed) },
    )

    expect(availableToBurn(await provider.current())).toBe(5)

    consumed = 18
    expect(availableToBurn(await provider.current())).toBe(0)
  })
})
