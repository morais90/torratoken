import { readFile } from "node:fs/promises"
import { z } from "zod"

const project = z.object({
  repoUrl: z.string().min(1),
  agents: z.array(z.string().min(1)).min(1),
  verify: z.array(z.string()).default([]),
})

export const configSchema = z.object({
  plan: z.enum(["pro", "max-5x", "max-20x"]),
  reserveUsd: z.number().nonnegative(),
  perAgentCapUsd: z.number().positive(),
  managedRoot: z.string().min(1),
  agentsDir: z.string().min(1),
  projects: z.array(project).min(1),
})

export type Config = z.infer<typeof configSchema>

export async function loadConfig(path: string): Promise<Config> {
  return configSchema.parse(JSON.parse(await readFile(path, "utf8")))
}
