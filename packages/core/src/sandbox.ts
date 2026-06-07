export type RunRequest = {
  worktreePath: string
  prompt: string
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
