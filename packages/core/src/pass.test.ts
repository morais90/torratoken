import { describe, expect, it } from "vitest"
import type { BurnBudget } from "./budget"
import type { Delivery, DeliveryRequest } from "./delivery"
import { runPass } from "./pass"
import type { RunRequest, RunResult, Sandbox } from "./sandbox"
import type { Workspace, WorkspaceRequest, Workspaces } from "./workspaces"

const delivered = (costUsd: number): RunResult => ({ status: "delivered", diff: "x", costUsd })

const recordingWorkspaces = () => {
  const opened: WorkspaceRequest[] = []
  const workspaces: Workspaces = {
    withWorkspace: <T>(
      request: WorkspaceRequest,
      use: (w: Workspace) => Promise<T>,
    ): Promise<T> => {
      opened.push(request)
      return use({ path: `/work/${request.runId}`, branch: `torra/${request.runId}` })
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

const recordingDelivery = () => {
  const delivered: DeliveryRequest[] = []
  const delivery: Delivery = {
    deliver: (request: DeliveryRequest) => {
      delivered.push(request)
      return Promise.resolve({
        pullRequestUrl: `https://github.com/owner/repo/pull/${delivered.length}`,
      })
    },
  }
  return { delivery, delivered }
}

const budget = (consumedUsd: number): BurnBudget => ({
  creditUsd: 100,
  consumedUsd,
  reserveUsd: 20,
})

const passInput = (consumedUsd: number, agents: { name: string; prompt: string }[]) => ({
  budget: budget(consumedUsd),
  agents,
  perAgentCapUsd: 50,
  repoUrl: "git@github.com:owner/repo.git",
  runId: "run-1",
  verify: [],
})

describe("runPass", () => {
  it("runs each agent in its own workspace and debits the budget", async () => {
    const { workspaces, opened } = recordingWorkspaces()
    const { sandbox, requests } = recordingSandbox([delivered(10), delivered(5)])
    const { delivery } = recordingDelivery()

    const outcome = await runPass(
      passInput(0, [
        { name: "doc-writer", prompt: "a" },
        { name: "test-booster", prompt: "b" },
      ]),
      { workspaces, sandbox, delivery },
    )

    expect(opened.map((o) => o.runId)).toEqual(["run-1-doc-writer", "run-1-test-booster"])
    expect(requests.map((r) => r.worktreePath)).toEqual([
      "/work/run-1-doc-writer",
      "/work/run-1-test-booster",
    ])
    expect(outcome.runs.map((r) => r.agent)).toEqual(["doc-writer", "test-booster"])
    expect(outcome.budget.consumedUsd).toBe(15)
  })

  it("delivers a delivered run from its own worktree and branch", async () => {
    const { workspaces } = recordingWorkspaces()
    const { sandbox } = recordingSandbox([delivered(10)])
    const { delivery, delivered: calls } = recordingDelivery()

    const outcome = await runPass(passInput(0, [{ name: "doc-writer", prompt: "a" }]), {
      workspaces,
      sandbox,
      delivery,
    })

    expect(calls).toEqual([
      {
        repoUrl: "git@github.com:owner/repo.git",
        branch: "torra/run-1-doc-writer",
        worktreePath: "/work/run-1-doc-writer",
        agent: "doc-writer",
      },
    ])
    expect(outcome.runs[0]?.delivery?.pullRequestUrl).toBe("https://github.com/owner/repo/pull/1")
  })

  it("does not deliver a run that produced no pull request", async () => {
    const { workspaces } = recordingWorkspaces()
    const { sandbox } = recordingSandbox([
      { status: "discarded", reason: "no changes", costUsd: 3 },
    ])
    const { delivery, delivered: calls } = recordingDelivery()

    const outcome = await runPass(passInput(0, [{ name: "doc-writer", prompt: "a" }]), {
      workspaces,
      sandbox,
      delivery,
    })

    expect(calls).toEqual([])
    expect(outcome.runs[0]?.delivery).toBeUndefined()
    expect(outcome.budget.consumedUsd).toBe(3)
  })

  it("stops before the next agent once the reserve is reached", async () => {
    const { workspaces, opened } = recordingWorkspaces()
    const { sandbox } = recordingSandbox([delivered(80)])
    const { delivery } = recordingDelivery()

    const outcome = await runPass(
      {
        ...passInput(0, [
          { name: "first", prompt: "a" },
          { name: "second", prompt: "b" },
        ]),
        perAgentCapUsd: 80,
      },
      { workspaces, sandbox, delivery },
    )

    expect(outcome.runs.map((r) => r.agent)).toEqual(["first"])
    expect(opened.map((o) => o.runId)).toEqual(["run-1-first"])
  })
})
