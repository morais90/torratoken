/**
 * Measures how much of the monthly Agent SDK credit has been consumed.
 *
 * The figure is conservative: it counts every measured Claude usage in the
 * current billing month, so the burn budget never overstates what is left.
 */
export interface UsageMeter {
  consumedThisMonth(): Promise<number>
}
