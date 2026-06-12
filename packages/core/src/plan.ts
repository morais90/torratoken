export type Plan = "pro" | "max-5x" | "max-20x"

const MONTHLY_CREDIT_USD: Record<Plan, number> = {
  pro: 20,
  "max-5x": 100,
  "max-20x": 200,
}

export function monthlyCreditUsd(plan: Plan): number {
  return MONTHLY_CREDIT_USD[plan]
}
