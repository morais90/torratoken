import { describe, expect, it } from "vitest"
import { configSchema } from "./config"

const valid = {
  plan: "max-5x",
  reserveUsd: 5,
  perAgentCapUsd: 1,
  managedRoot: "/tmp/torra",
  agentsDir: "agents",
  projects: [{ repoUrl: "git@github.com:owner/repo.git", agents: ["doc-writer"] }],
}

describe("configSchema", () => {
  it("parses a valid config and defaults verify to an empty list", () => {
    expect(configSchema.parse(valid)).toEqual({
      ...valid,
      projects: [{ repoUrl: "git@github.com:owner/repo.git", agents: ["doc-writer"], verify: [] }],
    })
  })

  it("rejects an unknown plan", () => {
    expect(() => configSchema.parse({ ...valid, plan: "free" })).toThrow()
  })

  it("rejects a config with no projects", () => {
    expect(() => configSchema.parse({ ...valid, projects: [] })).toThrow()
  })
})
