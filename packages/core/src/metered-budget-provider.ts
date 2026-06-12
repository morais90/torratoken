import type { BurnBudget } from "./budget"
import type { BudgetProvider } from "./budget-provider"
import { monthlyCreditUsd, type Plan } from "./plan"
import type { UsageMeter } from "./usage-meter"

export type BudgetSettings = {
  plan: Plan
  reserveUsd: number
}

export function meteredBudgetProvider(settings: BudgetSettings, meter: UsageMeter): BudgetProvider {
  return {
    async current(): Promise<BurnBudget> {
      const consumedUsd = await meter.consumedThisMonth()

      return {
        creditUsd: monthlyCreditUsd(settings.plan),
        consumedUsd,
        reserveUsd: settings.reserveUsd,
      }
    },
  }
}
