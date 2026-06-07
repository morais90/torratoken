---
name: commits
description: Torra Token's commit & branching convention — Conventional Commits in English, atomic commits, branch + PR (never commit to main). Use whenever you create a commit or write a commit message in this repo.
---

# Commits

Conventional Commits, written in **English** like the rest of the code.

```
type(scope): description
```

Imperative and short; add a body to explain the **why** when it isn't obvious.

- **Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`.
- **Scope:** the package or area — `core`, `daemon`, `web`, `cli`, `budget`, `fleet`, `sandbox`.
- Enforced by **commitlint** (part of the local gate).

```
✗ fix stuff
✗ atualiza orçamento
✓ feat(budget): stop the pass when the balance reaches the reserve
✓ fix(daemon): serialize runs with a per-project lock
✓ test(fleet): cover the FIFO queue of scheduled projects
```

## Writing the message
- The subject names the **one main change** — the problem solved, not the files touched.
- Write it naturally; **don't enumerate files** or list every edit, even when a commit spans many.
- Use the body only for the **why** or important context — never as a file inventory.
- Respect line length: subject ≤ 72 chars; wrap body lines at ~72 (commitlint caps header
  and body at 100).

## Flow
- **Atomic commits** — one logical change each.
- **Never commit to `main`.** Work on a branch (`feat/…`, `fix/…`, `chore/…`) and deliver through
  a PR; squash on merge to keep history clean.
- Commit only with a green gate (see the `acceptance-gate` skill).
- **No `Co-Authored-By` trailer** — not even on commits made by Claude.
