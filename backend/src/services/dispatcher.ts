import { spawn } from "child_process";
import { config } from "../config.js";
import { sanitizeInput } from "../utils/sanitize.js";
import { updateTask, type Task, type AgentType } from "./task-manager.js";
import { wsService } from "./websocket.js";

export interface DispatchResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Dispatch a task to a CLI agent.
 * INV-3: Timeout after agent.timeoutMs (max 5 min)
 * INV-4: Input is sanitized before passing to CLI
 */
export async function dispatchToAgent(
  task: Task,
  agentType: AgentType
): Promise<DispatchResult> {
  // Sanitize input (INV-4)
  const sanitizedInput = sanitizeInput(task.input);

  // Update task status to running
  updateTask(task.id, {
    status: "running",
    agent_type: agentType,
    started_at: new Date().toISOString(),
  });
  wsService.broadcast({
    type: "task_update",
    data: { id: task.id, status: "running" },
  });

  // Get CLI path for agent type
  const cliPath = getAgentCliPath(agentType);

  try {
    const output = await executeCli(cliPath, sanitizedInput, task.id);

    // Update task to completed
    updateTask(task.id, {
      status: "completed",
      output,
      completed_at: new Date().toISOString(),
    });
    wsService.broadcast({
      type: "task_update",
      data: { id: task.id, status: "completed", output },
    });

    return { success: true, output };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Update task to failed
    updateTask(task.id, {
      status: "failed",
      error: errorMessage,
      completed_at: new Date().toISOString(),
    });
    wsService.broadcast({
      type: "task_update",
      data: { id: task.id, status: "failed", output: errorMessage },
    });

    return { success: false, output: "", error: errorMessage };
  }
}

function getAgentCliPath(agentType: AgentType): string {
  switch (agentType) {
    case "claude-code":
      return config.agent.claudeCodePath;
    case "codex":
      return config.agent.codexPath;
    case "openclaw":
      return config.agent.openclawPath;
  }
}

/**
 * Execute a CLI agent with the given input.
 * Uses child_process.spawn with timeout (INV-3).
 * INV-10: Process is properly cleaned up on completion/timeout.
 */
function executeCli(
  cliPath: string,
  input: string,
  taskId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = config.agent.timeoutMs;
    let killed = false;

    const proc = spawn(cliPath, [], {
      stdio: ["pipe", "pipe", "pipe"],
      timeout,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    // Send input to the agent
    proc.stdin.write(input);
    proc.stdin.end();

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
      // Force kill after 5 seconds if SIGTERM doesn't work
      setTimeout(() => proc.kill("SIGKILL"), 5000);
    }, timeout);

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (killed) {
        reject(new Error(`Agent timed out after ${timeout}ms`));
      } else if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(
          new Error(`Agent exited with code ${code}: ${stderr.trim()}`)
        );
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start agent: ${err.message}`));
    });
  });
}

/**
 * Select the best agent type for a task based on content analysis.
 * Used when DeepSeek doesn't specify an agent.
 */
export function selectAgent(taskDescription: string): AgentType {
  const lower = taskDescription.toLowerCase();

  // Code-related tasks → Claude Code
  if (
    lower.includes("code") ||
    lower.includes("代码") ||
    lower.includes("debug") ||
    lower.includes("调试") ||
    lower.includes("refactor") ||
    lower.includes("重构")
  ) {
    return "claude-code";
  }

  // Small code snippets → Codex
  if (
    lower.includes("补全") ||
    lower.includes("snippet") ||
    lower.includes("补丁")
  ) {
    return "codex";
  }

  // Default to Claude Code as the most capable agent
  return "claude-code";
}
