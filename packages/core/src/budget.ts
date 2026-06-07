export type BurnBudget = {
  /** The plan's monthly agent-usage credit, in USD. */
  creditUsd: number
  /** How much of the credit has been consumed this month, in USD. */
  consumedUsd: number
  /** The margin we never burn into, in USD. */
  reserveUsd: number
}

/** How much of the monthly credit is still safe to burn right now, in USD. */
export function availableToBurn({ creditUsd, consumedUsd, reserveUsd }: BurnBudget): number {
  return Math.max(0, creditUsd - consumedUsd - reserveUsd)
}
