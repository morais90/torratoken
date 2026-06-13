/**
 * These values cross into host-side `git` and GitHub calls run with the
 * operator's credentials, so an implementation MUST validate them before any
 * privileged call: `repoUrl` to an allow-listed scheme and `branch` to a valid
 * git refname (e.g. `torra/<runId>-<agent>`), to avoid git argument injection.
 * No implementation exists yet, so nothing validates them today.
 */
export type DeliveryRequest = {
  repoUrl: string
  branch: string
  worktreePath: string
  agent: string
}

export type DeliveryResult = {
  pullRequestUrl: string
}

/**
 * Turns an agent's delivered changes into a pull request. Runs host-side,
 * outside the sandbox, so it can commit the worktree, push the branch, and
 * open the PR with the operator's own git and GitHub credentials.
 */
export interface Delivery {
  deliver(request: DeliveryRequest): Promise<DeliveryResult>
}
