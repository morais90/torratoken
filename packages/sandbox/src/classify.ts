import type { RunResult } from "@torra/core"

export type AgentRun = {
  costUsd: number
  aborted: boolean
  abortReason?: string
}

export type Verification = {
  passed: boolean
  detail?: string
}

export function classifyRun(agent: AgentRun, diff: string, verification: Verification): RunResult {
  if (agent.aborted) {
    return { status: "aborted", reason: agent.abortReason ?? "run aborted", costUsd: agent.costUsd }
  }

  if (diff.trim() === "") {
    return { status: "discarded", reason: "no changes produced", costUsd: agent.costUsd }
  }

  if (!verification.passed) {
    return {
      status: "discarded",
      reason: verification.detail ?? "verification failed",
      costUsd: agent.costUsd,
    }
  }

  return { status: "delivered", diff, costUsd: agent.costUsd }
}
