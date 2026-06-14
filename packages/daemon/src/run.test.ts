import type { Agent } from "@torra/core"
import { describe, expect, it } from "vitest"
import { makeRunId, resolveAgents } from "./run"

const agent = (name: string): Agent => ({
  name,
  description: `${name} agent`,
  prompt: `do ${name}`,
})

describe("resolveAgents", () => {
  it("resolves names against the catalog in the requested order", () => {
    const catalog = [agent("test-booster"), agent("doc-writer")]

    expect(resolveAgents(catalog, ["doc-writer", "test-booster"])).toEqual([
      agent("doc-writer"),
      agent("test-booster"),
    ])
  })

  it("throws on an unknown agent name", () => {
    expect(() => resolveAgents([agent("doc-writer")], ["missing"])).toThrow()
  })
})

describe("makeRunId", () => {
  it("combines the repo slug and the timestamp", () => {
    expect(makeRunId("git@github.com:owner/repo.git", 1750000000000)).toBe(
      "github.com-owner-repo-1750000000000",
    )
  })
})
