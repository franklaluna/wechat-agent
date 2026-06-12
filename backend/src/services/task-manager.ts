import { db } from "../db.js";
import { v4 as uuidv4 } from "uuid";

export type TaskStatus = "pending" | "running" | "completed" | "failed";
export type AgentType = "claude-code" | "codex" | "openclaw";

export interface Task {
  id: string;
  user_id: string;
  conversation_id: string | null;
  status: TaskStatus;
  agent_type: AgentType | null;
  input: string;
  output: string | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export function createTask(
  userId: string,
  input: string,
  conversationId?: string
): Task {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO tasks (id, user_id, conversation_id, status, input, created_at)
     VALUES (?, ?, ?, 'pending', ?, ?)`
  ).run(id, userId, conversationId || null, input, now);
  return {
    id,
    user_id: userId,
    conversation_id: conversationId || null,
    status: "pending",
    agent_type: null,
    input,
    output: null,
    error: null,
    created_at: now,
    started_at: null,
    completed_at: null,
  };
}

export function updateTask(
  taskId: string,
  updates: Partial<Pick<Task, "status" | "agent_type" | "output" | "error" | "started_at" | "completed_at">>
): Task | null {
  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as
    | Task
    | undefined;
  if (!task) return null;

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return task;

  values.push(taskId);
  db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );

  return { ...task, ...updates } as Task;
}

export function getTask(taskId: string): Task | undefined {
  return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as
    | Task
    | undefined;
}

export function getTasks(userId?: string): Task[] {
  if (userId) {
    return db
      .prepare(`SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`)
      .all(userId) as Task[];
  }
  return db
    .prepare(`SELECT * FROM tasks ORDER BY created_at DESC`)
    .all() as Task[];
}
