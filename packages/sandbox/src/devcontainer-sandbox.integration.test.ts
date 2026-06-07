import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { DevcontainerSandbox } from "./devcontainer-sandbox"
import { exec } from "./exec"

const enabled = process.env.TORRA_INTEGRATION === "1"

describe.skipIf(!enabled)("DevcontainerSandbox (integration)", () => {
  it("runs an agent in a container and returns the diff", async () => {
    const repo = await mkdtemp(join(tmpdir(), "torra-repo-"))
    await writeFile(join(repo, "index.js"), "function soma(a, b) {\n  return a + b\n}\n")
    await exec("git", ["-C", repo, "init", "-q"])
    await exec("git", ["-C", repo, "add", "."])
    await exec("git", [
      "-C",
      repo,
      "-c",
      "user.email=spike@torra.local",
      "-c",
      "user.name=spike",
      "commit",
      "-qm",
      "init",
    ])

    const sandbox = new DevcontainerSandbox()
    const result = await sandbox.run({
      worktreePath: repo,
      prompt: "Add a JSDoc comment above the soma function in index.js. Only edit the file.",
      capUsd: 1,
      verify: [],
    })

    expect(result.status).toBe("delivered")
    if (result.status === "delivered") {
      expect(result.diff).toContain("soma")
    }

    await rm(repo, { recursive: true, force: true })
  }, 600_000)
})
