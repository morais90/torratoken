import { availableToBurn, type BurnBudget } from "@torra/core"

export function canStartRun(budget: BurnBudget): boolean {
  return availableToBurn(budget) > 0
}
