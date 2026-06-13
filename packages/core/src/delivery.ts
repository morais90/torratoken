/**
 * The values here cross into host-side `git` and GitHub calls run with the
 * operator's credentials, so by the time a request reaches `deliver` they are
 * trusted: `repoUrl` has an allow-listed scheme and `branch` is a valid git
 * refname (e.g. `torra/<runId>-<agent>`). The adapter validates them at the
 * boundary before any privileged call, to avoid git argument injection.
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
