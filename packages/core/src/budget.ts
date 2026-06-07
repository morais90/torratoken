export type BurnBudget = {
  creditUsd: number
  consumedUsd: number
  reserveUsd: number
}

export function availableToBurn(budget: BurnBudget): number {
  return Math.max(0, budget.creditUsd - budget.consumedUsd - budget.reserveUsd)
}

export function runBudgetUsd(budget: BurnBudget, perRunCapUsd: number): number {
  return Math.min(perRunCapUsd, availableToBurn(budget))
}

export function recordSpend(budget: BurnBudget, spentUsd: number): BurnBudget {
  return { ...budget, consumedUsd: budget.consumedUsd + spentUsd }
}
