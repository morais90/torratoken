import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import type { RunRequest, RunResult, Sandbox } from "@torra/core"
import { toAgentRun } from "./agent-run"
import { classifyRun, type Verification } from "./classify"
import { exec } from "./exec"

const DEVCONTAINER_CLI = ["--yes", "@devcontainers/cli"]

function devcontainerConfig(worktreePath: string): string {
  return JSON.stringify(
    {
      name: "torra-run",
      image: "mcr.microsoft.com/devcontainers/javascript-node:24-bookworm",
      features: { "ghcr.io/anthropics/devcontainer-features/claude-code:1": {} },
      mounts: [`source=${worktreePath},target=/repo,type=bind,consistency=cached`],
      postCreateCommand: "cd runner && npm install",
    },
    null,
    2,
  )
}

const RUNNER_PACKAGE = JSON.stringify(
  {
    name: "torra-runner",
    private: true,
    type: "module",
    dependencies: { "@anthropic-ai/claude-agent-sdk": "latest" },
  },
  null,
  2,
)

const RUNNER_SCRIPT = `import { query } from "@anthropic-ai/claude-agent-sdk"

let result
for await (const message of query({
  prompt: process.env.TORRA_PROMPT,
  options: { cwd: process.env.TORRA_CWD, permissionMode: "bypassPermissions", maxTurns: 30 },
})) {
  if (message.type === "result") result = message
}

process.stdout.write(
  JSON.stringify({ subtype: result?.subtype, total_cost_usd: result?.total_cost_usd ?? 0 }),
)
`

export class DevcontainerSandbox implements Sandbox {
  async run(request: RunRequest): Promise<RunResult> {
    const harness = await mkdtemp(join(tmpdir(), "torra-"))

    try {
      await this.scaffold(harness, request.worktreePath)
      await exec("npx", [...DEVCONTAINER_CLI, "up", "--workspace-folder", harness])

      const agent = await this.runAgent(harness, request.prompt)
      const diff = await this.diff(request.worktreePath)
      const verification = await this.runVerify(harness, request.verify)

      return classifyRun(agent, diff, verification)
    } finally {
      await this.teardown(harness)
    }
  }

  private async scaffold(harness: string, worktreePath: string): Promise<void> {
    const devcontainer = join(harness, ".devcontainer")
    await mkdir(devcontainer, { recursive: true })
    await writeFile(join(devcontainer, "devcontainer.json"), devcontainerConfig(worktreePath))

    const runner = join(harness, "runner")
    await mkdir(runner, { recursive: true })
    await writeFile(join(runner, "package.json"), RUNNER_PACKAGE)
    await writeFile(join(runner, "runner.mjs"), RUNNER_SCRIPT)
  }

  private async runAgent(harness: string, prompt: string) {
    const runner = `/workspaces/${basename(harness)}/runner/runner.mjs`
    const token = process.env.CLAUDE_CODE_OAUTH_TOKEN ?? ""

    const result = await exec("npx", [
      ...DEVCONTAINER_CLI,
      "exec",
      "--workspace-folder",
      harness,
      "--remote-env",
      `TORRA_PROMPT=${prompt}`,
      "--remote-env",
      "TORRA_CWD=/repo",
      "--remote-env",
      `CLAUDE_CODE_OAUTH_TOKEN=${token}`,
      "node",
      runner,
    ])

    return toAgentRun(JSON.parse(result.stdout))
  }

  private async diff(worktreePath: string): Promise<string> {
    const result = await exec("git", ["-C", worktreePath, "diff"])
    return result.stdout
  }

  private async runVerify(harness: string, commands: string[]): Promise<Verification> {
    for (const command of commands) {
      const result = await exec("npx", [
        ...DEVCONTAINER_CLI,
        "exec",
        "--workspace-folder",
        harness,
        "bash",
        "-lc",
        `cd /repo && ${command}`,
      ])

      if (result.code !== 0) {
        return { passed: false, detail: `verification failed: ${command}` }
      }
    }

    return { passed: true }
  }

  private async teardown(harness: string): Promise<void> {
    const ids = await this.containerIds(harness)
    if (ids.length > 0) {
      await exec("docker", ["rm", "-f", ...ids]).catch(() => undefined)
    }

    await rm(harness, { recursive: true, force: true })
  }

  private async containerIds(harness: string): Promise<string[]> {
    const result = await exec("docker", [
      "ps",
      "-aq",
      "--filter",
      `label=devcontainer.local_folder=${harness}`,
    ])

    return result.stdout
      .split("\n")
      .map((id) => id.trim())
      .filter(Boolean)
  }
}
