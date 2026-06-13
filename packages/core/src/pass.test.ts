import { describe, expect, it } from "vitest"
import type { BurnBudget } from "./budget"
import type { Delivery, DeliveryRequest } from "./delivery"
import { runPass } from "./pass"
import type { RunRequest, RunResult, Sandbox } from "./sandbox"
import type { Workspace, WorkspaceRequest, Workspaces } from "./workspaces"

const REPO = "git@github.com:owner/repo.git"

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
  const calls: DeliveryRequest[] = []
  const delivery: Delivery = {
    deliver: (request: DeliveryRequest) => {
      calls.push(request)
      return Promise.resolve({
        pullRequestUrl: `https://github.com/owner/repo/pull/${calls.length}`,
      })
    },
  }
  return { delivery, calls }
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
  repoUrl: REPO,
  runId: "run-1",
  verify: [],
})

describe("runPass", () => {
  it("runs each agent in its own workspace and opens a pull request for each", async () => {
    const { workspaces, opened } = recordingWorkspaces()
    const { sandbox, requests } = recordingSandbox([delivered(10), delivered(5)])
    const { delivery, calls } = recordingDelivery()

    const outcome = await runPass(
      passInput(0, [
        { name: "doc-writer", prompt: "a" },
        { name: "test-booster", prompt: "b" },
      ]),
      { workspaces, sandbox, delivery },
    )

    expect(opened).toEqual([
      { repoUrl: REPO, runId: "run-1-doc-writer" },
      { repoUrl: REPO, runId: "run-1-test-booster" },
    ])
    expect(requests).toEqual([
      { worktreePath: "/work/run-1-doc-writer", prompt: "a", capUsd: 50, verify: [] },
      { worktreePath: "/work/run-1-test-booster", prompt: "b", capUsd: 50, verify: [] },
    ])
    expect(calls).toEqual([
      {
        repoUrl: REPO,
        branch: "torra/run-1-doc-writer",
        worktreePath: "/work/run-1-doc-writer",
        agent: "doc-writer",
      },
      {
        repoUrl: REPO,
        branch: "torra/run-1-test-booster",
        worktreePath: "/work/run-1-test-booster",
        agent: "test-booster",
      },
    ])
    expect(outcome).toEqual({
      runs: [
        {
          agent: "doc-writer",
          result: delivered(10),
          delivery: { pullRequestUrl: "https://github.com/owner/repo/pull/1" },
        },
        {
          agent: "test-booster",
          result: delivered(5),
          delivery: { pullRequestUrl: "https://github.com/owner/repo/pull/2" },
        },
      ],
      budget: budget(15),
    })
  })

  it("does not deliver a discarded run", async () => {
    const { workspaces } = recordingWorkspaces()
    const { sandbox } = recordingSandbox([
      { status: "discarded", reason: "no changes", costUsd: 3 },
    ])
    const { delivery, calls } = recordingDelivery()

    const outcome = await runPass(passInput(0, [{ name: "doc-writer", prompt: "a" }]), {
      workspaces,
      sandbox,
      delivery,
    })

    expect(calls).toEqual([])
    expect(outcome).toEqual({
      runs: [
        { agent: "doc-writer", result: { status: "discarded", reason: "no changes", costUsd: 3 } },
      ],
      budget: budget(3),
    })
  })

  it("does not deliver an aborted run", async () => {
    const { workspaces } = recordingWorkspaces()
    const { sandbox } = recordingSandbox([{ status: "aborted", reason: "max turns", costUsd: 4 }])
    const { delivery, calls } = recordingDelivery()

    const outcome = await runPass(passInput(0, [{ name: "doc-writer", prompt: "a" }]), {
      workspaces,
      sandbox,
      delivery,
    })

    expect(calls).toEqual([])
    expect(outcome).toEqual({
      runs: [
        { agent: "doc-writer", result: { status: "aborted", reason: "max turns", costUsd: 4 } },
      ],
      budget: budget(4),
    })
  })

  it("records the spend and keeps going when delivery fails", async () => {
    const { workspaces } = recordingWorkspaces()
    const { sandbox } = recordingSandbox([delivered(10), delivered(5)])
    const delivery: Delivery = {
      deliver: (request: DeliveryRequest) =>
        request.agent === "doc-writer"
          ? Promise.reject(new Error("push rejected"))
          : Promise.resolve({ pullRequestUrl: "https://github.com/owner/repo/pull/2" }),
    }

    const outcome = await runPass(
      passInput(0, [
        { name: "doc-writer", prompt: "a" },
        { name: "test-booster", prompt: "b" },
      ]),
      { workspaces, sandbox, delivery },
    )

    expect(outcome).toEqual({
      runs: [
        { agent: "doc-writer", result: delivered(10), deliveryError: "push rejected" },
        {
          agent: "test-booster",
          result: delivered(5),
          delivery: { pullRequestUrl: "https://github.com/owner/repo/pull/2" },
        },
      ],
      budget: budget(15),
    })
  })

  it("stops before the next agent once the reserve is reached", async () => {
    const { workspaces, opened } = recordingWorkspaces()
    const { sandbox } = recordingSandbox([delivered(80)])
    const { delivery, calls } = recordingDelivery()

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

    expect(opened).toEqual([{ repoUrl: REPO, runId: "run-1-first" }])
    expect(calls).toEqual([
      {
        repoUrl: REPO,
        branch: "torra/run-1-first",
        worktreePath: "/work/run-1-first",
        agent: "first",
      },
    ])
    expect(outcome).toEqual({
      runs: [
        {
          agent: "first",
          result: delivered(80),
          delivery: { pullRequestUrl: "https://github.com/owner/repo/pull/1" },
        },
      ],
      budget: budget(80),
    })
  })
})
