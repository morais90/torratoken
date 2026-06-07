---
name: pr
description: "How we write pull requests in Torra Token: a natural Context/Solution description a reviewer can act on. Use when opening a PR or writing/editing a PR description."
---

# Pull requests

Write the PR for the reviewer, with enough to understand the change and review it well without
reverse-engineering the diff. Use the template: **Context**, then **Solution**.

## Context
The problem or need, in plain language: what was wrong or missing, and why it matters now. Lead
with the *why*, and give only the background a reviewer actually needs.

## Solution
What the PR does about it and the approach taken. Call out:

- the key decisions or trade-offs worth a reviewer's attention (only the relevant ones);
- anything risky, deliberately left out, or planned as a follow-up;
- how it was verified, such as tests added or how to check it by hand.

## Good practices
- **Why before what.** A reviewer who understands the problem reviews the solution better.
- **Natural and pragmatic.** Prose, not a file inventory. Leave out technical detail that isn't
  relevant to understanding the solution (the diff has it).
- **Natural punctuation.** Avoid em dashes; use commas, periods, or parentheses.
- **One logical change per PR.** Small PRs get better reviews, so split unrelated work.
- **Self-review the diff** before asking for review; don't make the reviewer find your typos.
- **Link** the issue or PR it relates to, when there is one.
- For UI changes, include a screenshot or short clip.
- **Title** follows Conventional Commits (`type(scope): description`), like a commit subject.

Completeness over length: say what's needed, no more. Same spirit as the `commits` skill.
