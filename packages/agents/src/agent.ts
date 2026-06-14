import type { Agent } from "@torra/core"
import matter from "gray-matter"
import { z } from "zod"

const frontmatter = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  model: z.string().min(1).optional(),
  tools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  effort: z.union([z.enum(["low", "medium", "high", "xhigh", "max"]), z.number()]).optional(),
  maxTurns: z.number().int().positive().optional(),
})

/**
 * Parses a `.claude/agents/*.md` file: YAML frontmatter holds the definition's
 * fields and the markdown body is the agent's system prompt.
 */
export function parseAgent(markdown: string): Agent {
  const { data, content } = matter(markdown)
  const meta = frontmatter.parse(data)
  const prompt = content.trim()

  if (prompt === "") {
    throw new Error(`agent "${meta.name}" has an empty prompt body`)
  }

  return { ...meta, prompt }
}
