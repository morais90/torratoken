import type { Delivery, DeliveryRequest, DeliveryResult } from "@torra/core"
import type { CommitAndPushRequest } from "@torra/git"
import type { OpenPullRequest } from "./pull-request"
import { isAllowedRepoUrl, isValidBranch, parseRepo } from "./repo"

export type GitHubDeliveryDeps = {
  commitAndPush: (request: CommitAndPushRequest) => Promise<void>
  openPullRequest: OpenPullRequest
  author: { name: string; email: string }
}

/**
 * Delivers an agent's branch as a GitHub pull request. This is the trust
 * boundary the `Delivery` port documents: it validates the repo URL and the
 * branch refname before the privileged commit/push, then opens the PR.
 */
export function createGitHubDelivery(deps: GitHubDeliveryDeps): Delivery {
  return {
    async deliver(request: DeliveryRequest): Promise<DeliveryResult> {
      if (!isAllowedRepoUrl(request.repoUrl)) {
        throw new Error(`unsupported repo URL: ${request.repoUrl}`)
      }

      if (!isValidBranch(request.branch)) {
        throw new Error(`unsafe branch: ${request.branch}`)
      }

      const { owner, repo } = parseRepo(request.repoUrl)
      const title = `torra(${request.agent}): apply changes`

      await deps.commitAndPush({
        worktreePath: request.worktreePath,
        remote: request.repoUrl,
        branch: request.branch,
        message: title,
        author: deps.author,
      })

      const { url } = await deps.openPullRequest({
        owner,
        repo,
        head: request.branch,
        title,
        body: `Prepared automatically by the ${request.agent} agent.`,
      })

      return { pullRequestUrl: url }
    },
  }
}
