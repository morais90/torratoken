import { git } from "./exec"

export type CommitAndPushRequest = {
  worktreePath: string
  remote: string
  branch: string
  message: string
}

/**
 * Stages everything in the worktree, commits it, and pushes the current HEAD
 * to `refs/heads/<branch>` on the remote. Runs host-side with the operator's
 * git credentials.
 *
 * The commit is authored by whatever git identity is configured for the
 * worktree, so the caller must ensure `user.name`/`user.email` are set.
 * Callers must also guarantee there are changes to commit: a delivered run
 * always has a diff, and an empty worktree makes `git commit` fail.
 */
export async function commitAndPush(request: CommitAndPushRequest): Promise<void> {
  await git(["add", "--all"], request.worktreePath)
  await git(["commit", "--message", request.message], request.worktreePath)
  await git(["push", request.remote, `HEAD:refs/heads/${request.branch}`], request.worktreePath)
}
