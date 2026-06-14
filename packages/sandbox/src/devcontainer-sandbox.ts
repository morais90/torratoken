import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import type { Agent, RunRequest, RunResult, Sandbox } from "@torra/core"
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

const RUNNER_SCRIPT = `import { readFileSync } from "node:fs"
import { query } from "@anthropic-ai/claude-agent-sdk"

const { name, ...definition } = JSON.parse(
  readFileSync(new URL("./agent.json", import.meta.url), "utf8"),
)

// Never let the agent delegate: a target-planted agent must stay inert.
definition.disallowedTools = [...(definition.disallowedTools ?? []), "Agent"]

let result
for await (const message of query({
  prompt: "Carry out your instructions on the repository in the working directory, then stop.",
  options: {
    cwd: process.env.TORRA_CWD,
    permissionMode: "bypassPermissions",
    settingSources: [],
    // Reliable turn cap at the options level (the agent's own maxTurns is a
    // hint); never leave an unattended run unbounded.
    maxTurns: definition.maxTurns ?? 30,
    agents: { [name]: definition },
    agent: name,
  },
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
      await this.scaffold(harness, request.worktreePath, request.agent)
      await exec("npx", [...DEVCONTAINER_CLI, "up", "--workspace-folder", harness])

      const agentRun = await this.runAgent(harness)
      const diff = await this.diff(request.worktreePath)
      const verification = await this.runVerify(harness, request.verify)

      return classifyRun(agentRun, diff, verification)
    } finally {
      await this.teardown(harness)
    }
  }

  private async scaffold(harness: string, worktreePath: string, agent: Agent): Promise<void> {
    const devcontainer = join(harness, ".devcontainer")
    await mkdir(devcontainer, { recursive: true })
    await writeFile(join(devcontainer, "devcontainer.json"), devcontainerConfig(worktreePath))

    const runner = join(harness, "runner")
    await mkdir(runner, { recursive: true })
    await writeFile(join(runner, "package.json"), RUNNER_PACKAGE)
    await writeFile(join(runner, "runner.mjs"), RUNNER_SCRIPT)
    // The agent definition goes in a file, not an env var: its prompt is
    // multi-line and would not survive --remote-env parsing.
    await writeFile(join(runner, "agent.json"), JSON.stringify(agent))
  }

  private async runAgent(harness: string) {
    const runner = `/workspaces/${basename(harness)}/runner/runner.mjs`
    const token = process.env.CLAUDE_CODE_OAUTH_TOKEN ?? ""

    const result = await exec("npx", [
      ...DEVCONTAINER_CLI,
      "exec",
      "--workspace-folder",
      harness,
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
