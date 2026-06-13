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
