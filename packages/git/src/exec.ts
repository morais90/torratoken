import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)

export async function git(args: string[], cwd?: string): Promise<string> {
  const { stdout } = await run("git", args, { cwd, maxBuffer: 64 * 1024 * 1024 })

  return stdout.trim()
}
