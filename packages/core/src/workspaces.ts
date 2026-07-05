export type WorkspaceRequest = {
  repoUrl: string
  runId: string
}

export type Workspace = {
  path: string
  branch: string
  /**
   * The worktree's git directory, captured before the agent runs. Host-side git
   * must target it with `--git-dir` rather than discovering `.git`, which the
   * agent can replace to run its own config, hooks, or filters.
   */
  gitDir: string
}

/**
 * Hands a pass an isolated, ephemeral checkout of a project and tears it
 * down afterwards. Scoped on purpose: the workspace only exists for the
 * duration of `use`, so cleanup cannot be forgotten.
 */
export interface Workspaces {
  withWorkspace<T>(request: WorkspaceRequest, use: (workspace: Workspace) => Promise<T>): Promise<T>
}
