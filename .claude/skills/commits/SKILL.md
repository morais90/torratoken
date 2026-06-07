---
name: commits
description: "Torra Token commit and branching convention: Conventional Commits in English, atomic commits, branch and PR (never commit to main). Use whenever you create a commit or write a commit message in this repo."
---

# Commits

Conventional Commits, written in **English** like the rest of the code.

```
type(scope): description
```

Keep the subject imperative and short. Add a body to explain the **why** when it isn't obvious.

- **Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`.
- **Scope:** the package or area, such as `core`, `daemon`, `web`, `cli`, `budget`, `fleet`, `sandbox`.
- Enforced by **commitlint** (part of the local gate).

```
✗ fix stuff
✗ atualiza orçamento
✓ feat(budget): stop the pass when the balance reaches the reserve
✓ fix(daemon): serialize runs with a per-project lock
✓ test(fleet): cover the FIFO queue of scheduled projects
```

## Writing the message
- The subject names the **one main change**: the problem solved, not the files touched.
- The body explains **what changed and why** so a reader gets it without opening the diff. Keep
  it pragmatic, a sentence or two, never a paragraph or a file list.
- Skip the body only when the subject already says everything.
- Write with natural punctuation. Avoid em dashes; use commas, periods, or parentheses.
- Respect line length: subject up to 72 chars, and wrap body lines at about 72 (commitlint caps
  the header and body at 100).

## Flow
- **Atomic commits**, one logical change each.
- **Never commit to `main`.** Work on a branch (`feat/...`, `fix/...`, `chore/...`) and deliver
  through a PR. Squash on merge to keep history clean.
- Commit only with a green gate (see the `acceptance-gate` skill).
- **No `Co-Authored-By` trailer**, not even on commits made by Claude.
