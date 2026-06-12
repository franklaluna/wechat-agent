import { db } from "../db.js";
import { v4 as uuidv4 } from "uuid";

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "agent";
  content: string;
  type: "text" | "voice";
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
  messages?: Message[];
}

// Find or create conversation for a user
export function getActiveConversation(userId: string): Conversation {
  const existing = db
    .prepare(
      `SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(userId) as Conversation | undefined;

  if (existing) return existing;

  const id = uuidv4();
  db.prepare(`INSERT INTO conversations (id, user_id) VALUES (?, ?)`).run(
    id,
    userId
  );
  return { id, user_id: userId, created_at: new Date().toISOString() };
}

export function addMessage(
  conversationId: string,
  role: "user" | "agent",
  content: string,
  type: "text" | "voice" = "text"
): Message {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, role, content, type, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, conversationId, role, content, type, now);
  return { id, conversation_id: conversationId, role, content, type, created_at: now };
}

export function getConversations(
  page: number = 1,
  limit: number = 20
): { conversations: Conversation[]; total: number } {
  const total = (
    db.prepare(`SELECT COUNT(*) as count FROM conversations`).get() as {
      count: number;
    }
  ).count;

  const offset = (page - 1) * limit;
  const conversations = db
    .prepare(`SELECT * FROM conversations ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(limit, offset) as Conversation[];

  return { conversations, total };
}

export function getConversationMessages(
  conversationId: string
): Message[] {
  return db
    .prepare(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`
    )
    .all(conversationId) as Message[];
}
