import { describe, expect, it } from "vitest"
import { parseAgent } from "./agent"

const docWriter = `---
name: doc-writer
description: Improves documentation
model: haiku
tools:
  - Read
  - Edit
maxTurns: 20
---
You are a documentation specialist.

Improve docs without changing behavior.
`

describe("parseAgent", () => {
  it("reads the definition from frontmatter and the prompt from the body", () => {
    expect(parseAgent(docWriter)).toEqual({
      name: "doc-writer",
      description: "Improves documentation",
      model: "haiku",
      tools: ["Read", "Edit"],
      maxTurns: 20,
      prompt: "You are a documentation specialist.\n\nImprove docs without changing behavior.",
    })
  })

  it("rejects a definition without a description", () => {
    expect(() => parseAgent("---\nname: x\n---\nbody")).toThrow()
  })

  it("rejects an empty prompt body", () => {
    expect(() => parseAgent("---\nname: x\ndescription: y\n---\n   ")).toThrow()
  })
})
