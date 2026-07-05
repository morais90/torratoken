import { loadConfig } from "./config"
import { runProjectsOnce } from "./run"

/**
 * One-shot entry: `node main.js <config.json>` runs every configured project
 * once. The scheduler that calls this on a cron is a later piece.
 */
async function main(): Promise<void> {
  const path = process.argv[2]
  if (!path) {
    throw new Error("usage: torra-daemon <config.json>")
  }

  const config = await loadConfig(path)
  const outcomes = await runProjectsOnce(config, Date.now())

  for (const outcome of outcomes) {
    for (const run of outcome.runs) {
      const where = run.delivery?.pullRequestUrl ?? run.deliveryError ?? run.result.status
      console.log(`${run.agent}: ${where}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
