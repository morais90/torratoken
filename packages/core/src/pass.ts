import { type BurnBudget, recordSpend, runBudgetUsd } from "./budget"
import type { RunResult, Sandbox } from "./sandbox"

export type Agent = {
  name: string
  prompt: string
}

export type PassInput = {
  budget: BurnBudget
  agents: Agent[]
  perAgentCapUsd: number
  worktreePath: string
  verify: string[]
}

export type PassRun = {
  agent: string
  result: RunResult
}

export type PassOutcome = {
  runs: PassRun[]
  budget: BurnBudget
}

export async function runPass(input: PassInput, sandbox: Sandbox): Promise<PassOutcome> {
  let budget = input.budget
  const runs: PassRun[] = []

  for (const agent of input.agents) {
    const capUsd = runBudgetUsd(budget, input.perAgentCapUsd)
    if (capUsd <= 0) {
      break
    }

    const result = await sandbox.run({
      worktreePath: input.worktreePath,
      prompt: agent.prompt,
      capUsd,
      verify: input.verify,
    })

    runs.push({ agent: agent.name, result })
    budget = recordSpend(budget, result.costUsd)
  }

  return { runs, budget }
}
