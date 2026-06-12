import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { git } from "./exec"
import { GitWorkspaces } from "./git-workspaces"

const trash: string[] = []

async function tempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  trash.push(dir)
  return dir
}

async function makeRemote(): Promise<string> {
  const dir = await tempDir("torra-remote-")
  const bare = join(dir, "origin.git")
  const work = join(dir, "work")

  await git(["init", "--bare", "-b", "main", bare])
  await git(["clone", bare, work])
  await writeFile(join(work, "README.md"), "hello\n")
  await commitAll(work, "init")
  await git(["push", "origin", "main"], work)

  return bare
}

async function commitAll(work: string, message: string): Promise<void> {
  await git(["add", "."], work)
  await git(["-c", "user.email=t@t.dev", "-c", "user.name=torra", "commit", "-m", message], work)
}

afterEach(async () => {
  await Promise.all(trash.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe("GitWorkspaces", () => {
  it("checks out the repo into an isolated worktree and tears it down after", async () => {
    const repoUrl = await makeRemote()
    const root = await tempDir("torra-managed-")
    const workspaces = new GitWorkspaces(root)

    const readme = await workspaces.withWorkspace(
      { repoUrl, runId: "run-1" },
      async (workspace) => {
        expect(workspace.branch).toBe("torra/run-1")
        expect(existsSync(workspace.path)).toBe(true)

        return readFile(join(workspace.path, "README.md"), "utf8")
      },
    )

    expect(readme).toContain("hello")
    expect(existsSync(join(root, "worktrees", "run-1"))).toBe(false)
  })

  it("reuses the mirror and fetches new commits on the next pass", async () => {
    const repoUrl = await makeRemote()
    const root = await tempDir("torra-managed-")
    const workspaces = new GitWorkspaces(root)

    await workspaces.withWorkspace({ repoUrl, runId: "first" }, async () => {})

    const clone = join(await tempDir("torra-push-"), "work")
    await git(["clone", repoUrl, clone])
    await writeFile(join(clone, "CHANGES.md"), "second pass\n")
    await commitAll(clone, "add changes")
    await git(["push", "origin", "main"], clone)

    const sawNewFile = await workspaces.withWorkspace({ repoUrl, runId: "second" }, (workspace) =>
      Promise.resolve(existsSync(join(workspace.path, "CHANGES.md"))),
    )

    expect(sawNewFile).toBe(true)
  })
})
