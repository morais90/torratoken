export type WorkspaceRequest = {
  repoUrl: string
  runId: string
}

export type Workspace = {
  path: string
  branch: string
}

/**
 * Hands a pass an isolated, ephemeral checkout of a project and tears it
 * down afterwards. Scoped on purpose: the workspace only exists for the
 * duration of `use`, so cleanup cannot be forgotten.
 */
export interface Workspaces {
  withWorkspace<T>(request: WorkspaceRequest, use: (workspace: Workspace) => Promise<T>): Promise<T>
}
