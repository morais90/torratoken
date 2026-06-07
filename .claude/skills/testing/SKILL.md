---
name: testing
description: Torra Token's testing standards — test behavior not implementation, integration-first, minimal mocks, deterministic. Use whenever you write, edit, or review a test, add tests for new behavior, decide what or how to test, pick test doubles/fakes, or write a regression test for a bug.
---

# Testing

We test **behavior**, not implementation. A good test describes what the system does, survives a
refactor, and reads like a small story about a use case.

Tooling: **Vitest** (`pnpm test`).

## Foundation: pure core, fakes at the edges
Domain logic (budget, fleet coordination, run lifecycle) is pure and deterministic, so it's
tested directly. Only the edges sit behind interfaces — the Claude API, the Sandbox/container,
git, GitHub, SQLite, the clock, randomness, IDs. In tests, swap those edges for fakes; everything
inside runs for real.

## What to test
- Test **observable behavior** — public contracts and effects on the system — never internal
  details. A behavior-preserving refactor must not break a test; if it does, the test was coupled
  to the implementation, so fix the test.
- Test at the seam closest to real behavior: the **use case / flow**, not micro-units that mirror
  the code's structure.
- Assert **outcomes and effects**, not internal calls.

```ts
// ✗ coupled to implementation
expect(store.save).toHaveBeenCalledWith(run)

// ✓ asserts the effect
expect(await store.listRuns()).toContainEqual(
  expect.objectContaining({ status: "delivered" }),
)
```

## Test doubles
- Mock only the **external edges**. Prefer **realistic fakes** (in-memory SQLite, a fake Claude
  that returns canned results) over mocks that assert calls — internal collaborators run for real.
- Give each edge interface a **contract test**: one shared suite that every implementation must
  pass. That's what makes a fake trustworthy — it passes the same contract as the real adapter.

## Determinism
- Inject **time, randomness, and IDs**; no `sleep`, no real timers, no flakiness. This matters a
  lot for a scheduling/budget system.

```ts
const clock = fakeClock("2026-06-07T02:00:00Z")
const fleet = makeFleet({ clock, store, budget })
```

- Tests are **isolated and order-independent** — each builds its own world, with no shared global
  state.

## Cover what matters here
The real edges of domain behavior:
- the balance reaching the reserve mid-pass;
- the per-run cap;
- overlapping schedules serializing into a FIFO queue;
- verification failing → run discarded, cost still counted;
- a runaway run getting aborted;
- dedup preventing a repeat.

A bug starts with a failing test that reproduces it — regression first.

## Hygiene
- Name tests by behavior: `"stops the pass when the balance reaches the reserve"`.
- One behavior per test; arrange–act–assert; use small builders for domain data.
- Don't test third-party or framework code — the spike already proved the devcontainer.
- Avoid snapshot tests — brittle and coupled to output.
- Coverage is a signal, not a target: don't chase a percentage, but every domain behavior has a
  test.
