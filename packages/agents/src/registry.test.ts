import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { loadAgents } from "./registry"

const trash: string[] = []

afterEach(async () => {
  await Promise.all(trash.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe("loadAgents", () => {
  it("loads every agent file in name order and ignores non-markdown", async () => {
    const dir = await mkdtemp(join(tmpdir(), "torra-agents-"))
    trash.push(dir)
    await writeFile(
      join(dir, "doc-writer.md"),
      "---\nname: doc-writer\ndescription: docs\n---\nwrite docs\n",
    )
    await writeFile(
      join(dir, "test-booster.md"),
      "---\nname: test-booster\ndescription: tests\n---\nadd tests\n",
    )
    await writeFile(join(dir, "README.txt"), "ignored")

    const agents = await loadAgents(dir)

    expect(agents).toEqual([
      { name: "doc-writer", description: "docs", prompt: "write docs" },
      { name: "test-booster", description: "tests", prompt: "add tests" },
    ])
  })
})
