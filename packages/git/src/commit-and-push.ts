import { git } from "./exec"

export type CommitAndPushRequest = {
  worktreePath: string
  remote: string
  branch: string
  message: string
  author: { name: string; email: string }
}

/**
 * Stages everything in the worktree, commits it with the given author, and
 * pushes the current HEAD to `refs/heads/<branch>` on the remote. Runs
 * host-side with the operator's git credentials.
 *
 * The author is pinned on the commit command, so it wins over any
 * `user.name`/`user.email` an agent may have planted in the worktree config;
 * the caller supplies the operator's identity. `--no-gpg-sign` keeps an
 * agent-set `commit.gpgsign` from blocking the commit. Callers must guarantee
 * there are changes: a delivered run always has a diff, and an empty worktree
 * makes `git commit` fail.
 *
 * `remote` and `branch` are trusted here: the delivery adapter validates the
 * repo URL and the refname at its boundary before this privileged call.
 */
export async function commitAndPush(request: CommitAndPushRequest): Promise<void> {
  await git(["add", "--all"], request.worktreePath)
  await git(
    [
      "-c",
      `user.name=${request.author.name}`,
      "-c",
      `user.email=${request.author.email}`,
      "commit",
      "--no-gpg-sign",
      "--message",
      request.message,
    ],
    request.worktreePath,
  )
  await git(["push", request.remote, `HEAD:refs/heads/${request.branch}`], request.worktreePath)
}
