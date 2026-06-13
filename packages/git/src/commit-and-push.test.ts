import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { commitAndPush } from "./commit-and-push"
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
  await git(["add", "."], work)
  await git(["-c", "user.email=t@t.dev", "-c", "user.name=torra", "commit", "-m", "init"], work)
  await git(["push", "origin", "main"], work)

  return bare
}

afterEach(async () => {
  await Promise.all(trash.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe("commitAndPush", () => {
  it("commits the worktree and pushes the branch to the remote", async () => {
    const repoUrl = await makeRemote()
    const root = await tempDir("torra-managed-")
    const workspaces = new GitWorkspaces(root)

    await workspaces.withWorkspace({ repoUrl, runId: "run-1-doc-writer" }, async (workspace) => {
      await writeFile(join(workspace.path, "NOTE.md"), "from the agent\n")
      await git(["config", "user.email", "t@t.dev"], workspace.path)
      await git(["config", "user.name", "torra"], workspace.path)

      await commitAndPush({
        worktreePath: workspace.path,
        remote: repoUrl,
        branch: workspace.branch,
        message: "torra(doc-writer): apply changes",
      })
    })

    const branches = await git(["branch", "--list", "torra/run-1-doc-writer"], repoUrl)
    expect(branches).toContain("torra/run-1-doc-writer")

    const files = await git(["ls-tree", "--name-only", "torra/run-1-doc-writer"], repoUrl)
    expect(files.split("\n")).toContain("NOTE.md")

    const subject = await git(["log", "-1", "--format=%s", "torra/run-1-doc-writer"], repoUrl)
    expect(subject).toBe("torra(doc-writer): apply changes")
  })
})
