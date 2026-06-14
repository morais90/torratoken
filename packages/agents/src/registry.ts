import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import type { Agent } from "@torra/core"
import { parseAgent } from "./agent"

/**
 * Loads every `*.md` agent definition from a directory (Torra's own catalog,
 * kept out of the target repo). Sorted by filename for a deterministic order.
 */
export async function loadAgents(dir: string): Promise<Agent[]> {
  const files = (await readdir(dir)).filter((file) => file.endsWith(".md")).sort()

  return Promise.all(files.map(async (file) => parseAgent(await readFile(join(dir, file), "utf8"))))
}
