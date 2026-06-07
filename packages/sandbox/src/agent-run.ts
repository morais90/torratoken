import type { AgentRun } from "./classify"

type AgentResult = {
  subtype: string
  total_cost_usd: number
}

export function toAgentRun(result: AgentResult): AgentRun {
  const costUsd = result.total_cost_usd

  if (result.subtype === "success") {
    return { costUsd, aborted: false }
  }

  return { costUsd, aborted: true, abortReason: result.subtype }
}
