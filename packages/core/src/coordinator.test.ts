import { describe, expect, it } from "vitest"
import type { BurnBudget } from "./budget"
import type { BudgetProvider } from "./budget-provider"
import { createCoordinator, type ProjectRun } from "./coordinator"
import type { Delivery } from "./delivery"
import type { RunRequest, RunResult, Sandbox } from "./sandbox"
import type { Workspace, WorkspaceRequest, Workspaces } from "./workspaces"

const stubDelivery: Delivery = {
  deliver: () => Promise.resolve({ pullRequestUrl: "https://github.com/owner/repo/pull/1" }),
}

const budgetOf = (consumedUsd: number): BurnBudget => ({
  creditUsd: 100,
  consumedUsd,
  reserveUsd: 20,
})

const fixedBudget = (budget: BurnBudget): BudgetProvider => ({
  current: () => Promise.resolve(budget),
})

const recordingWorkspaces = () => {
  const opened: WorkspaceRequest[] = []
  const workspaces: Workspaces = {
    withWorkspace: <T>(
      request: WorkspaceRequest,
      use: (w: Workspace) => Promise<T>,
    ): Promise<T> => {
      opened.push(request)
      return use({ path: `/managed/worktrees/${request.runId}`, branch: `torra/${request.runId}` })
    },
  }
  return { workspaces, opened }
}

const recordingSandbox = (results: RunResult[]) => {
  const requests: RunRequest[] = []
  const sandbox: Sandbox = {
    run: (request: RunRequest) => {
      requests.push(request)
      const next = results.shift()
      if (!next) {
        throw new Error("recordingSandbox: out of results")
      }
      return Promise.resolve(next)
    },
  }
  return { sandbox, requests }
}

const run: ProjectRun = {
  runId: "run-1",
  repoUrl: "git@github.com:owner/repo.git",
  agents: [{ name: "doc-writer", prompt: "..." }],
  perAgentCapUsd: 50,
  verify: ["pnpm test"],
}

describe("createCoordinator", () => {
  it("runs each agent in its own workspace and feeds its path to the sandbox", async () => {
    const { workspaces, opened } = recordingWorkspaces()
    const { sandbox, requests } = recordingSandbox([
      { status: "delivered", diff: "x", costUsd: 10 },
    ])
    const coordinator = createCoordinator({
      budget: fixedBudget(budgetOf(0)),
      workspaces,
      sandbox,
      delivery: stubDelivery,
    })

    const outcome = await coordinator.runProject(run)

    expect(opened).toEqual([{ repoUrl: run.repoUrl, runId: "run-1-doc-writer" }])
    expect(requests[0]?.worktreePath).toBe("/managed/worktrees/run-1-doc-writer")
    expect(outcome.runs.map((r) => r.agent)).toEqual(["doc-writer"])
    expect(outcome.budget.consumedUsd).toBe(10)
  })

  it("skips the workspace entirely when the budget is exhausted", async () => {
    const { workspaces, opened } = recordingWorkspaces()
    const { sandbox, requests } = recordingSandbox([])
    const coordinator = createCoordinator({
      budget: fixedBudget(budgetOf(80)),
      workspaces,
      sandbox,
      delivery: stubDelivery,
    })

    const outcome = await coordinator.runProject(run)

    expect(opened).toEqual([])
    expect(requests).toEqual([])
    expect(outcome.runs).toEqual([])
    expect(outcome.budget).toEqual(budgetOf(80))
  })
})
