# Torra Token

Turns the Claude subscription's **monthly agent-usage credit** into useful, low-risk work:
autonomous agents run on your repositories and deliver improvements as **Pull Requests**.

> Specs live (temporarily) in `docs/` and will be removed once the code reflects them:
> `PLAN.md` (concept) · `TECH_PLAN.md` (technical) · `UX_PLAN.md` (UX).

## Architecture

Monorepo (`pnpm` + `turborepo`):
- `core` — domain logic (budget, fleet coordination, run lifecycle, ledger)
- `daemon` — scheduler + coordinator + local API
- `web` — the UI (the living "Brasa" scene)
- `cli` — the `torra` commands

**Keep the core lean:** heavy infrastructure (containers, the agent engine, git, PRs, usage
measurement) is delegated to mature frameworks.

## Models
- Development: `claude-opus-4-8`.
- Product agents: a cheap model per manifest (`haiku`/`sonnet`) for trivial tasks.

## Commands
*(scripts defined during scaffolding)*
- `pnpm install` · `pnpm test` · `pnpm check` (Biome) · `pnpm typecheck` · `pnpm build`

## Development standards

These live as **skills** (reinforceable in any session) under `.claude/skills/`:
- `testing` — behavior, never implementation
- `code-quality` — strict TS, ports & adapters, lean core, no overengineering
- `acceptance-gate` — what must be green before "done"
- `commits` — Conventional Commits (English, branch + PR)

When something comes out wrong during development, reinforce the matching skill.
