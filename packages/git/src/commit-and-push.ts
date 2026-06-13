import { git } from "./exec"

export type CommitAndPushRequest = {
  worktreePath: string
  remote: string
  branch: string
  message: string
}

/**
 * Commits everything in the worktree and pushes the branch to the remote.
 * Runs host-side with the operator's git identity and credentials; the commit
 * is authored by their configured `user.name`/`user.email`.
 */
export async function commitAndPush(request: CommitAndPushRequest): Promise<void> {
  await git(["add", "--all"], request.worktreePath)
  await git(["commit", "--message", request.message], request.worktreePath)
  await git(["push", request.remote, `HEAD:refs/heads/${request.branch}`], request.worktreePath)
}
