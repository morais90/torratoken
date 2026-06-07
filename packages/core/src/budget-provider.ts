import type { BurnBudget } from "./budget"

export interface BudgetProvider {
  current(): Promise<BurnBudget>
}
