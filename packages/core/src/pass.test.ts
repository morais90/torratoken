import { describe, expect, it } from "vitest"
import type { BurnBudget } from "./budget"
import { runPass } from "./pass"
import type { RunResult, Sandbox } from "./sandbox"

const delivered = (costUsd: number): RunResult => ({ status: "delivered", diff: "x", costUsd })

const fakeSandbox = (results: RunResult[]): Sandbox => {
  const queue = [...results]
  return {
    run: () => {
      const next = queue.shift()
      if (!next) {
        throw new Error("fakeSandbox: out of results")
      }
      return Promise.resolve(next)
    },
  }
}

const budget = (consumedUsd: number): BurnBudget => ({
  creditUsd: 100,
  consumedUsd,
  reserveUsd: 20,
})

describe("runPass", () => {
  it("runs each agent in order and debits the budget", async () => {
    const sandbox = fakeSandbox([delivered(10), delivered(5)])

    const outcome = await runPass(
      {
        budget: budget(0),
        agents: [
          { name: "doc-writer", prompt: "..." },
          { name: "test-booster", prompt: "..." },
        ],
        perAgentCapUsd: 50,
        worktreePath: "/repo",
        verify: [],
      },
      sandbox,
    )

    expect(outcome.runs.map((run) => run.agent)).toEqual(["doc-writer", "test-booster"])
    expect(outcome.budget.consumedUsd).toBe(15)
  })

  it("stops before the next agent once the reserve is reached", async () => {
    const sandbox = fakeSandbox([delivered(80)])

    const outcome = await runPass(
      {
        budget: budget(0),
        agents: [
          { name: "first", prompt: "..." },
          { name: "second", prompt: "..." },
        ],
        perAgentCapUsd: 80,
        worktreePath: "/repo",
        verify: [],
      },
      sandbox,
    )

    expect(outcome.runs.map((run) => run.agent)).toEqual(["first"])
  })

  it("debits the cost even when a run is discarded", async () => {
    const sandbox = fakeSandbox([{ status: "discarded", reason: "no changes", costUsd: 3 }])

    const outcome = await runPass(
      {
        budget: budget(0),
        agents: [{ name: "doc-writer", prompt: "..." }],
        perAgentCapUsd: 50,
        worktreePath: "/repo",
        verify: [],
      },
      sandbox,
    )

    expect(outcome.budget.consumedUsd).toBe(3)
  })
})
