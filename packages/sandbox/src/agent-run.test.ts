import { describe, expect, it } from "vitest"
import { toAgentRun } from "./agent-run"

describe("toAgentRun", () => {
  it("maps a successful run, keeping its cost", () => {
    expect(toAgentRun({ subtype: "success", total_cost_usd: 0.1 })).toEqual({
      costUsd: 0.1,
      aborted: false,
    })
  })

  it("treats any non-success subtype as an abort, still counting the cost", () => {
    expect(toAgentRun({ subtype: "error_max_budget_usd", total_cost_usd: 0.2 })).toEqual({
      costUsd: 0.2,
      aborted: true,
      abortReason: "error_max_budget_usd",
    })
  })
})
