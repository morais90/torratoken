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
 * This does NOT validate `remote` or `branch` — callers must, before this
 * privileged call. An unvalidated `remote` (e.g. `ext::sh -c …`) or a `branch`
 * starting with `-` is an injection surface. That validation is the delivery
 * adapter's job and does not exist yet.
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
  // `--` stops a `remote` shaped like `--flag` from being parsed as an option.
  await git(
    ["push", "--", request.remote, `HEAD:refs/heads/${request.branch}`],
    request.worktreePath,
  )
}
