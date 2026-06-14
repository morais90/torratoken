import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk"

/**
 * A Torra agent is the SDK's native `AgentDefinition` plus a name — the runner
 * feeds it straight into `query({ agents, agent })`. Reusing the SDK type keeps
 * us from maintaining a parallel agent shape.
 */
export type Agent = AgentDefinition & { name: string }
