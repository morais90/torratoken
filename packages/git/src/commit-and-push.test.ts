import { existsSync } from "node:fs"
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { commitAndPush } from "./commit-and-push"
import { git } from "./exec"
import { GitWorkspaces } from "./git-workspaces"

const trash: string[] = []
const operator = { name: "Operator", email: "op@torra.test" }

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
  it("commits with the operator identity and pushes the branch to the remote", async () => {
    const repoUrl = await makeRemote()
    const root = await tempDir("torra-managed-")
    const workspaces = new GitWorkspaces(root)

    await workspaces.withWorkspace({ repoUrl, runId: "run-1-doc-writer" }, async (workspace) => {
      await writeFile(join(workspace.path, "NOTE.md"), "from the agent\n")
      // an agent could plant a spoofed identity in the worktree config
      await git(["config", "user.name", "Agent Spoof"], workspace.path)
      await git(["config", "user.email", "spoof@evil.test"], workspace.path)

      await commitAndPush({
        worktreePath: workspace.path,
        remote: repoUrl,
        branch: workspace.branch,
        message: "torra(doc-writer): apply changes",
        author: operator,
      })
    })

    const files = await git(["ls-tree", "--name-only", "torra/run-1-doc-writer"], repoUrl)
    expect(files.split("\n")).toContain("NOTE.md")

    const author = await git(["log", "-1", "--format=%an <%ae>", "torra/run-1-doc-writer"], repoUrl)
    expect(author).toBe("Operator <op@torra.test>")

    const subject = await git(["log", "-1", "--format=%s", "torra/run-1-doc-writer"], repoUrl)
    expect(subject).toBe("torra(doc-writer): apply changes")
  })

  it("ignores a git hook planted in the agent-controlled worktree", async () => {
    const repoUrl = await makeRemote()
    const root = await tempDir("torra-managed-")
    const hooks = await tempDir("torra-hooks-")
    const sentinel = join(await tempDir("torra-sentinel-"), "PWNED")
    await writeFile(join(hooks, "pre-commit"), `#!/bin/sh\ntouch ${sentinel}\n`)
    await chmod(join(hooks, "pre-commit"), 0o755)
    const workspaces = new GitWorkspaces(root)

    await workspaces.withWorkspace({ repoUrl, runId: "run-1-hook" }, async (workspace) => {
      await writeFile(join(workspace.path, "NOTE.md"), "from the agent\n")
      await git(["config", "core.hooksPath", hooks], workspace.path)

      await commitAndPush({
        worktreePath: workspace.path,
        remote: repoUrl,
        branch: workspace.branch,
        message: "torra(doc-writer): apply changes",
        author: operator,
      })
    })

    expect(existsSync(sentinel)).toBe(false)
    const files = await git(["ls-tree", "--name-only", "torra/run-1-hook"], repoUrl)
    expect(files.split("\n")).toContain("NOTE.md")
  })

  it("commits even when the worktree config forces gpg signing", async () => {
    const repoUrl = await makeRemote()
    const root = await tempDir("torra-managed-")
    const workspaces = new GitWorkspaces(root)

    await workspaces.withWorkspace({ repoUrl, runId: "run-1-gpg" }, async (workspace) => {
      await writeFile(join(workspace.path, "NOTE.md"), "from the agent\n")
      // an agent could force signing with a broken signer to block delivery
      await git(["config", "commit.gpgsign", "true"], workspace.path)
      await git(["config", "gpg.program", "/bin/false"], workspace.path)

      await commitAndPush({
        worktreePath: workspace.path,
        remote: repoUrl,
        branch: workspace.branch,
        message: "torra(doc-writer): apply changes",
        author: operator,
      })
    })

    const files = await git(["ls-tree", "--name-only", "torra/run-1-gpg"], repoUrl)
    expect(files.split("\n")).toContain("NOTE.md")
  })

  it("rejects and pushes nothing when the worktree has no changes", async () => {
    const repoUrl = await makeRemote()
    const root = await tempDir("torra-managed-")
    const workspaces = new GitWorkspaces(root)

    await expect(
      workspaces.withWorkspace({ repoUrl, runId: "run-1-empty" }, (workspace) =>
        commitAndPush({
          worktreePath: workspace.path,
          remote: repoUrl,
          branch: workspace.branch,
          message: "torra: nothing to do",
          author: operator,
        }),
      ),
    ).rejects.toThrow()

    const branches = await git(["branch", "--list", "torra/run-1-empty"], repoUrl)
    expect(branches).toBe("")
  })

  it("rejects when the push target does not exist", async () => {
    const repoUrl = await makeRemote()
    const root = await tempDir("torra-managed-")
    const workspaces = new GitWorkspaces(root)

    await expect(
      workspaces.withWorkspace({ repoUrl, runId: "run-1-bad-remote" }, async (workspace) => {
        await writeFile(join(workspace.path, "NOTE.md"), "from the agent\n")

        await commitAndPush({
          worktreePath: workspace.path,
          remote: join(root, "does-not-exist.git"),
          branch: workspace.branch,
          message: "torra(doc-writer): apply changes",
          author: operator,
        })
      }),
    ).rejects.toThrow()
  })
})
