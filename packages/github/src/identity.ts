import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)

/**
 * Reads the operator's git identity from the global config — a trusted source,
 * outside the agent-controlled worktree. The delivery commit is pinned to it.
 */
export async function operatorIdentity(): Promise<{ name: string; email: string }> {
  const [name, email] = await Promise.all([
    run("git", ["config", "--global", "user.name"]),
    run("git", ["config", "--global", "user.email"]),
  ])

  return { name: name.stdout.trim(), email: email.stdout.trim() }
}

/** The GitHub token from the operator's existing `gh` login. */
export async function ghToken(): Promise<string> {
  const { stdout } = await run("gh", ["auth", "token"])

  return stdout.trim()
}
