---
name: acceptance-gate
description: Torra Token's acceptance gate — what must be green before a change ships (typecheck + Biome + tests + build). Use before you call a change done, before committing, before opening a PR, or when deciding whether a change is ready.
---

# Acceptance gate

**Nothing broken ships.** Before you call a change done — or commit it — run the gate:

```sh
pnpm validate   # typecheck + Biome + tests + build
```

`validate` is the single source of truth: the pre-commit hook and CI both run it, so local and CI
can't drift. If it fails, fix it before moving on; never commit with a red gate.

## Definition of done
A change isn't done just because it compiles and passes:
- new behavior has a test (see the `testing` skill);
- no orphan TODOs, commented-out code, leftover debug logging, or secrets;
- docs or skills updated when a standard or command changed;
- you've read your own diff.

## Process
- Don't bypass the gate (`--no-verify`) without a recorded reason.
- Keep the gate fast — a slow gate is one nobody runs.
- One logical change at a time; keep PRs small.

> The product's agents have their own verification gate (build/test/lint inside the container) —
> same idea, different place. This skill is about our own codebase.
