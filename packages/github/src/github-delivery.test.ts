import type { CommitAndPushRequest } from "@torra/git"
import { describe, expect, it } from "vitest"
import { createGitHubDelivery } from "./github-delivery"
import type { OpenPullRequestInput } from "./pull-request"

const author = { name: "Operator", email: "op@torra.test" }

const recording = () => {
  const pushes: CommitAndPushRequest[] = []
  const pulls: OpenPullRequestInput[] = []
  const deps = {
    author,
    commitAndPush: (request: CommitAndPushRequest) => {
      pushes.push(request)
      return Promise.resolve()
    },
    openPullRequest: (input: OpenPullRequestInput) => {
      pulls.push(input)
      return Promise.resolve({ url: "https://github.com/owner/repo/pull/7" })
    },
  }
  return { deps, pushes, pulls }
}

const request = {
  repoUrl: "git@github.com:owner/repo.git",
  branch: "torra/run-1-doc-writer",
  worktreePath: "/work/run-1-doc-writer",
  gitDir: "/git/run-1-doc-writer",
  agent: "doc-writer",
}

describe("createGitHubDelivery", () => {
  it("commits, pushes, and opens a pull request for the agent", async () => {
    const { deps, pushes, pulls } = recording()

    const result = await createGitHubDelivery(deps).deliver(request)

    expect(pushes).toEqual([
      {
        worktreePath: "/work/run-1-doc-writer",
        gitDir: "/git/run-1-doc-writer",
        remote: "git@github.com:owner/repo.git",
        branch: "torra/run-1-doc-writer",
        message: "torra(doc-writer): apply changes",
        author,
      },
    ])
    expect(pulls).toEqual([
      {
        owner: "owner",
        repo: "repo",
        head: "torra/run-1-doc-writer",
        title: "torra(doc-writer): apply changes",
        body: "Prepared automatically by the doc-writer agent.",
      },
    ])
    expect(result).toEqual({ pullRequestUrl: "https://github.com/owner/repo/pull/7" })
  })

  it("rejects an unsafe branch before touching the repo", async () => {
    const { deps, pushes, pulls } = recording()

    await expect(createGitHubDelivery(deps).deliver({ ...request, branch: "-x" })).rejects.toThrow()
    expect(pushes).toEqual([])
    expect(pulls).toEqual([])
  })

  it("rejects an unsupported repo URL before touching the repo", async () => {
    const { deps, pushes, pulls } = recording()

    await expect(
      createGitHubDelivery(deps).deliver({ ...request, repoUrl: "ext::sh -c evil" }),
    ).rejects.toThrow()
    expect(pushes).toEqual([])
    expect(pulls).toEqual([])
  })
})
