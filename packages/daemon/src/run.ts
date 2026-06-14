import { loadAgents } from "@torra/agents"
import {
  type Agent,
  type Coordinator,
  createCoordinator,
  meteredBudgetProvider,
  type PassOutcome,
} from "@torra/core"
import { commitAndPush, GitWorkspaces, mirrorKey } from "@torra/git"
import { createGitHubDelivery, ghToken, octokitPullRequests, operatorIdentity } from "@torra/github"
import { DevcontainerSandbox } from "@torra/sandbox"
import { CcusageMeter } from "@torra/usage"
import type { Config } from "./config"

/** Resolves a project's agent names against the loaded catalog, in order. */
export function resolveAgents(catalog: Agent[], names: string[]): Agent[] {
  return names.map((name) => {
    const agent = catalog.find((candidate) => candidate.name === name)
    if (!agent) {
      throw new Error(`unknown agent: ${name}`)
    }
    return agent
  })
}

/** A filesystem- and refname-safe run id, unique per repo and moment. */
export function makeRunId(repoUrl: string, now: number): string {
  return `${mirrorKey(repoUrl)}-${now}`
}

/** Wires the real adapters behind the coordinator from config. */
export async function buildCoordinator(config: Config): Promise<Coordinator> {
  return createCoordinator({
    budget: meteredBudgetProvider(
      { plan: config.plan, reserveUsd: config.reserveUsd },
      new CcusageMeter(),
    ),
    workspaces: new GitWorkspaces(config.managedRoot),
    sandbox: new DevcontainerSandbox(),
    delivery: createGitHubDelivery({
      commitAndPush,
      openPullRequest: octokitPullRequests(await ghToken()),
      author: await operatorIdentity(),
    }),
  })
}

/** Runs every configured project once, serially, through the coordinator. */
export async function runProjectsOnce(config: Config, now: number): Promise<PassOutcome[]> {
  const catalog = await loadAgents(config.agentsDir)
  const coordinator = await buildCoordinator(config)

  const outcomes: PassOutcome[] = []
  for (const project of config.projects) {
    outcomes.push(
      await coordinator.runProject({
        runId: makeRunId(project.repoUrl, now),
        repoUrl: project.repoUrl,
        agents: resolveAgents(catalog, project.agents),
        perAgentCapUsd: config.perAgentCapUsd,
        verify: project.verify,
      }),
    )
  }

  return outcomes
}
