export type RunRequest = {
  agent: string
  worktreePath: string
  capUsd: number
}

export type RunResult =
  | { status: "delivered"; diff: string; costUsd: number }
  | { status: "discarded"; reason: string; costUsd: number }
  | { status: "aborted"; reason: string; costUsd: number }

export interface Sandbox {
  run(request: RunRequest): Promise<RunResult>
}
