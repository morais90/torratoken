import { spawn } from "node:child_process"

export type ExecResult = {
  stdout: string
  stderr: string
  code: number
}

export type ExecOptions = {
  cwd?: string
  env?: Record<string, string>
}

export function exec(
  command: string,
  args: string[],
  options: ExecOptions = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    })

    let stdout = ""
    let stderr = ""

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    child.on("error", reject)

    child.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? 1 })
    })
  })
}
