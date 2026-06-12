import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import type { Workspace, WorkspaceRequest, Workspaces } from "@torra/core"
import { git } from "./exec"
import { mirrorDir, workspaceBranch, worktreeDir } from "./layout"

/**
 * Backs each pass with a local mirror of the repo and a throwaway git
 * worktree. The mirror is fetched incrementally and reused across passes;
 * only the worktree is created and removed per run.
 */
export class GitWorkspaces implements Workspaces {
  constructor(private readonly root: string) {}

  async withWorkspace<T>(
    request: WorkspaceRequest,
    use: (workspace: Workspace) => Promise<T>,
  ): Promise<T> {
    const mirror = await this.syncMirror(request.repoUrl)
    const path = worktreeDir(this.root, request.runId)
    const branch = workspaceBranch(request.runId)
    const base = await git(["symbolic-ref", "--short", "HEAD"], mirror)

    await mkdir(dirname(path), { recursive: true })
    await git(["worktree", "add", "-b", branch, path, base], mirror)

    try {
      return await use({ path, branch })
    } finally {
      await git(["worktree", "remove", "--force", path], mirror).catch(() => {})
      await git(["branch", "-D", branch], mirror).catch(() => {})
    }
  }

  private async syncMirror(repoUrl: string): Promise<string> {
    const dir = mirrorDir(this.root, repoUrl)

    if (existsSync(dir)) {
      await git(["fetch", "--prune"], dir)
      return dir
    }

    await mkdir(dirname(dir), { recursive: true })
    await git(["clone", "--mirror", repoUrl, dir])

    return dir
  }
}
