import type { Agent } from "./agent"

export type RunRequest = {
  worktreePath: string
  gitDir: string
  agent: Agent
  capUsd: number
  verify: string[]
}

export type RunResult =
  | { status: "delivered"; diff: string; costUsd: number }
  | { status: "discarded"; reason: string; costUsd: number }
  | { status: "aborted"; reason: string; costUsd: number }

export interface Sandbox {
  run(request: RunRequest): Promise<RunResult>
}
