import { describe, expect, it } from "vitest"
import { mirrorKey, workspaceBranch } from "./layout"

describe("mirrorKey", () => {
  it("collapses the SSH and HTTPS forms of a repo to the same slug", () => {
    const https = mirrorKey("https://github.com/owner/repo.git")
    const ssh = mirrorKey("git@github.com:owner/repo.git")

    expect(https).toBe("github.com-owner-repo")
    expect(ssh).toBe(https)
  })

  it("keeps the slug free of path separators", () => {
    expect(mirrorKey("https://example.com/a/b/c.git")).toBe("example.com-a-b-c")
  })
})

describe("workspaceBranch", () => {
  it("namespaces the run under a torra branch", () => {
    expect(workspaceBranch("run-1")).toBe("torra/run-1")
  })
})
