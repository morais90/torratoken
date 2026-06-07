import { describe, expect, it } from "vitest"
import { classifyRun } from "./classify"

describe("classifyRun", () => {
  it("delivers when changes pass verification", () => {
    const result = classifyRun({ costUsd: 0.1, aborted: false }, "diff --git a b", {
      passed: true,
    })
    expect(result).toEqual({ status: "delivered", diff: "diff --git a b", costUsd: 0.1 })
  })

  it("discards when the agent produced no changes", () => {
    const result = classifyRun({ costUsd: 0.1, aborted: false }, "   ", { passed: true })
    expect(result).toMatchObject({ status: "discarded", costUsd: 0.1 })
  })

  it("discards when verification fails but still counts the cost", () => {
    const result = classifyRun({ costUsd: 0.2, aborted: false }, "diff", {
      passed: false,
      detail: "tests failed",
    })
    expect(result).toEqual({ status: "discarded", reason: "tests failed", costUsd: 0.2 })
  })

  it("aborts and still counts the cost", () => {
    const result = classifyRun({ costUsd: 0.05, aborted: true, abortReason: "cap exceeded" }, "", {
      passed: true,
    })
    expect(result).toEqual({ status: "aborted", reason: "cap exceeded", costUsd: 0.05 })
  })
})
