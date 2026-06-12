import { join } from "node:path"

/**
 * A filesystem-safe slug for a repo URL. SSH and HTTPS forms of the same
 * repo collapse to the same key, so they share one mirror.
 */
export function mirrorKey(repoUrl: string): string {
  return repoUrl
    .replace(/^[a-z]+:\/\//i, "")
    .replace(/^[^@/]+@/, "")
    .replace(/\.git$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function mirrorDir(root: string, repoUrl: string): string {
  return join(root, "mirrors", `${mirrorKey(repoUrl)}.git`)
}

export function worktreeDir(root: string, runId: string): string {
  return join(root, "worktrees", runId)
}

export function workspaceBranch(runId: string): string {
  return `torra/${runId}`
}
