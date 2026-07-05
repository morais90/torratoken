import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)

export async function git(args: string[], cwd?: string): Promise<string> {
  // Harden every host-side git call: fail fast instead of blocking on a
  // credential prompt, and stop a planted hook or an `ext::` URL from running as
  // the operator.
  const hardening = ["-c", "core.hooksPath=/dev/null", "-c", "protocol.ext.allow=never"]
  const { stdout } = await run("git", [...hardening, ...args], {
    cwd,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  })

  return stdout.trim()
}
