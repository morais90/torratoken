type MonthlyEntry = {
  period: string
  totalCost: number
}

type MonthlyReport = {
  monthly: MonthlyEntry[]
}

export function monthKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function consumedForMonth(reportJson: string, month: string): number {
  const report = JSON.parse(reportJson) as MonthlyReport
  const entry = report.monthly.find((m) => m.period === month)

  return entry?.totalCost ?? 0
}
