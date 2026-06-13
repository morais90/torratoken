import { type BurnBudget, recordSpend, runBudgetUsd } from "./budget"
import type { Delivery, DeliveryResult } from "./delivery"
import type { RunResult, Sandbox } from "./sandbox"
import type { Workspaces } from "./workspaces"

export type Agent = {
  name: string
  prompt: string
}

export type PassInput = {
  budget: BurnBudget
  agents: Agent[]
  perAgentCapUsd: number
  repoUrl: string
  runId: string
  verify: string[]
}

export type PassRun = {
  agent: string
  result: RunResult
  delivery?: DeliveryResult
}

export type PassOutcome = {
  runs: PassRun[]
  budget: BurnBudget
}

export type PassDeps = {
  workspaces: Workspaces
  sandbox: Sandbox
  delivery: Delivery
}

export async function runPass(input: PassInput, deps: PassDeps): Promise<PassOutcome> {
  let budget = input.budget
  const runs: PassRun[] = []

  for (const agent of input.agents) {
    const capUsd = runBudgetUsd(budget, input.perAgentCapUsd)
    if (capUsd <= 0) {
      break
    }

    const run = await runAgent(input, agent, capUsd, deps)

    runs.push(run)
    budget = recordSpend(budget, run.result.costUsd)
  }

  return { runs, budget }
}

function runAgent(
  input: PassInput,
  agent: Agent,
  capUsd: number,
  deps: PassDeps,
): Promise<PassRun> {
  const request = { repoUrl: input.repoUrl, runId: `${input.runId}-${agent.name}` }

  return deps.workspaces.withWorkspace(request, async (workspace) => {
    const result = await deps.sandbox.run({
      worktreePath: workspace.path,
      prompt: agent.prompt,
      capUsd,
      verify: input.verify,
    })

    if (result.status !== "delivered") {
      return { agent: agent.name, result }
    }

    const delivery = await deps.delivery.deliver({
      repoUrl: input.repoUrl,
      branch: workspace.branch,
      worktreePath: workspace.path,
      agent: agent.name,
    })

    return { agent: agent.name, result, delivery }
  })
}
