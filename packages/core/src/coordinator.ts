import { availableToBurn } from "./budget"
import type { BudgetProvider } from "./budget-provider"
import { type Agent, type PassOutcome, runPass } from "./pass"
import type { Sandbox } from "./sandbox"
import type { Workspaces } from "./workspaces"

export type ProjectRun = {
  runId: string
  repoUrl: string
  agents: Agent[]
  perAgentCapUsd: number
  verify: string[]
}

export type CoordinatorDeps = {
  budget: BudgetProvider
  workspaces: Workspaces
  sandbox: Sandbox
}

export type Coordinator = {
  runProject(run: ProjectRun): Promise<PassOutcome>
}

export function createCoordinator(deps: CoordinatorDeps): Coordinator {
  return {
    async runProject(run: ProjectRun): Promise<PassOutcome> {
      const budget = await deps.budget.current()

      if (availableToBurn(budget) <= 0) {
        return { runs: [], budget }
      }

      return runPass(
        {
          budget,
          agents: run.agents,
          perAgentCapUsd: run.perAgentCapUsd,
          repoUrl: run.repoUrl,
          runId: run.runId,
          verify: run.verify,
        },
        { workspaces: deps.workspaces, sandbox: deps.sandbox },
      )
    },
  }
}
