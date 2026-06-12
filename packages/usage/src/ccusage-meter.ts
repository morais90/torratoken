import { execFile } from "node:child_process"
import { promisify } from "node:util"
import type { UsageMeter } from "@torra/core"
import { consumedForMonth, monthKey } from "./ccusage"

const run = promisify(execFile)

/**
 * Reads the current month's spend from ccusage, which aggregates Claude's
 * local usage logs. Run through npx so the host needs nothing pre-installed.
 */
export class CcusageMeter implements UsageMeter {
  async consumedThisMonth(): Promise<number> {
    const { stdout } = await run("npx", ["--yes", "ccusage@latest", "monthly", "--json"], {
      maxBuffer: 16 * 1024 * 1024,
    })

    return consumedForMonth(stdout, monthKey(new Date()))
  }
}
