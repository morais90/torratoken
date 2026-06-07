---
name: code-quality
description: Torra Token's code standards — strict TypeScript, a pure core with ports & adapters, no overengineering. Use whenever you write or edit TypeScript in this repo, design a type/module/interface, wire dependencies, handle errors or async, or review code for quality.
---

# Code quality

Write code that reads like the code around it, models the domain in its types, and keeps the core
free of infrastructure.

## Foundation: pure core, ports & adapters
Domain logic is pure and deterministic; all side effects and nondeterminism — the Claude API, the
Sandbox/container, git, GitHub, SQLite, the clock, randomness, IDs — live behind interfaces at the
edges. This keeps the core lean and directly testable.

**Dependency direction:** `core` depends on nothing; `daemon` / `web` / `cli` depend on `core`;
infrastructure sits behind interfaces (`Sandbox`, `BudgetProvider`, the store, git, GitHub).

## TypeScript
- **Strict, always.** No loose `any` — reach for `unknown` plus narrowing, or precise types.
- **Make illegal states unrepresentable.** Model domain state as a discriminated union so the
  compiler rules out impossible combinations:

```ts
type Run =
  | { status: "queued" }
  | { status: "running"; startedAt: Date }
  | { status: "delivered"; pr: PullRequest; costUsd: number }
  | { status: "discarded"; reason: string; costUsd: number }
  | { status: "aborted"; reason: string; costUsd: number }
```

- **Parse, don't validate, at the edge.** Validate config and external input with `zod` at the
  boundary; the core only ever sees values that are already typed and trusted.

## Errors & async
- Handle edges on purpose; **never swallow errors**.
- Pick the right shape: `throw` for the genuinely exceptional; a typed result for expected
  outcomes (a failed verification is a domain outcome, not an exception).
- No floating promises; cancellation flows through `AbortSignal` (matches the Agent SDK).

## State
- Prefer immutability; avoid shared mutable state — especially in the serial coordinator and the
  budget accounting, where the running balance changes in one place, deterministically.

## Observability & security
- **Structured logging** (pino) with context (`runId`, `project`). No `console.log` in shipped
  code.
- **Security is part of the code:** never log a secret; credentials never cross into the sandbox;
  push and PR happen host-side only.

## Simplicity
- Keep the core lean — delegate heavy infrastructure to mature frameworks; don't reinvent what
  works.
- No overengineering (YAGNI). Earn an abstraction with the rule of three. Small modules, single
  responsibility, composition over inheritance.

## Style
- **Biome** is the single source of truth for lint and formatting — run `pnpm check`, don't fight
  it.
- Use the domain's language in names: pass, run, burn, reserve, fleet, project.
- Comment only when it earns its place — the **why**, not the **what**.
