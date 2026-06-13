import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)

export async function git(args: string[], cwd?: string): Promise<string> {
  // GIT_TERMINAL_PROMPT=0 makes git fail fast instead of blocking on a
  // credential prompt: these run unattended, with no terminal to answer.
  const { stdout } = await run("git", args, {
    cwd,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  })

  return stdout.trim()
}
