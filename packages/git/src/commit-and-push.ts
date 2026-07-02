import { git } from "./exec"

export type CommitAndPushRequest = {
  worktreePath: string
  gitDir: string
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
 * Git targets the trusted `gitDir` with `--git-dir`/`--work-tree`, so an agent
 * that replaced the worktree's `.git` can't redirect it. The author is pinned
 * on the commit to win over any `user.name`/`user.email` in config, and
 * `--no-gpg-sign` keeps `commit.gpgsign` from blocking it. Fails when the
 * worktree has no changes.
 *
 * Does not validate `remote` or `branch`; the delivery adapter must, before
 * this privileged call.
 */
export async function commitAndPush(request: CommitAndPushRequest): Promise<void> {
  const scope = ["--git-dir", request.gitDir, "--work-tree", request.worktreePath]

  await git([...scope, "add", "--all"])
  await git([
    ...scope,
    "-c",
    `user.name=${request.author.name}`,
    "-c",
    `user.email=${request.author.email}`,
    "commit",
    "--no-gpg-sign",
    "--message",
    request.message,
  ])
  // `--` stops a `remote` shaped like `--flag` from being parsed as an option.
  await git([...scope, "push", "--", request.remote, `HEAD:refs/heads/${request.branch}`])
}
