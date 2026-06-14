import { Octokit } from "@octokit/rest"

export type OpenPullRequestInput = {
  owner: string
  repo: string
  head: string
  title: string
  body: string
}

export type OpenPullRequest = (input: OpenPullRequestInput) => Promise<{ url: string }>

/**
 * Opens the PR against the repo's default branch with Octokit. The base is
 * resolved per call so it works on any repo without extra configuration.
 */
export function octokitPullRequests(token: string): OpenPullRequest {
  const octokit = new Octokit({ auth: token })

  return async ({ owner, repo, head, title, body }) => {
    const { data: repository } = await octokit.repos.get({ owner, repo })
    const { data: pull } = await octokit.pulls.create({
      owner,
      repo,
      head,
      base: repository.default_branch,
      title,
      body,
    })

    return { url: pull.html_url }
  }
}
