export type Repo = {
  owner: string
  repo: string
}

const SCP = /^[^@]+@([^:/]+):(.+)$/
const SCHEME = /^(https|ssh):\/\/[^/]+\//

/**
 * Accepts only GitHub `https://` and ssh (`git@github.com:…` / `ssh://…`)
 * URLs. The scheme check keeps a crafted `remote` like `ext::sh -c …` or
 * `file://…` from reaching a push; pinning the host to github.com keeps the
 * push target and the Octokit PR target from diverging.
 */
export function isAllowedRepoUrl(repoUrl: string): boolean {
  return hostOf(repoUrl)?.toLowerCase() === "github.com"
}

function hostOf(repoUrl: string): string | null {
  const scp = SCP.exec(repoUrl)
  if (scp) {
    return scp[1] ?? null
  }

  return /^(?:https|ssh):\/\/(?:[^@/]+@)?([^/:]+)/.exec(repoUrl)?.[1] ?? null
}

/**
 * A valid git branch refname, conservative on purpose. Rejects the argument
 * injection and refspec traversal vectors (leading `-`, `..`, `//`, control
 * characters, the special set git forbids in refs).
 */
export function isValidBranch(branch: string): boolean {
  if (branch === "" || branch.startsWith("-") || branch.endsWith("/")) {
    return false
  }

  if (branch.includes("..") || branch.includes("//") || branch.includes("@{")) {
    return false
  }

  if (branch.endsWith(".lock")) {
    return false
  }

  return /^[A-Za-z0-9._/-]+$/.test(branch)
}

export function parseRepo(repoUrl: string): Repo {
  if (!isAllowedRepoUrl(repoUrl)) {
    throw new Error(`unsupported repo URL: ${repoUrl}`)
  }

  const path = repoPath(repoUrl).replace(/\.git$/, "")
  const segments = path.split("/").filter(Boolean)
  const [owner, repo] = segments.length === 2 ? segments : []

  if (!owner || !repo) {
    throw new Error(`cannot parse owner/repo from: ${repoUrl}`)
  }

  return { owner, repo }
}

function repoPath(repoUrl: string): string {
  const scp = SCP.exec(repoUrl)
  if (scp) {
    return scp[2] ?? ""
  }

  return repoUrl.replace(SCHEME, "")
}
