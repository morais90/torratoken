import { availableToBurn, type BurnBudget } from "@torra/core"

export function budgetLine(budget: BurnBudget): string {
  return `available to burn: $${availableToBurn(budget).toFixed(2)}`
}
