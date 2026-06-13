import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)

export async function git(args: string[], cwd?: string): Promise<string> {
  // Harden every host-side git call. GIT_TERMINAL_PROMPT=0 fails fast instead
  // of blocking on a credential prompt (these run unattended). hooksPath
  // pointed at /dev/null stops a hook planted in an agent-controlled worktree
  // from executing on the host with the operator's credentials.
  const { stdout } = await run("git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  })

  return stdout.trim()
}
