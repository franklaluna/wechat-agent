import { db } from "../db.js";
import { v4 as uuidv4 } from "uuid";

export interface User {
  id: string;
  wechat_openid: string;
  nickname: string | null;
  created_at: string;
  updated_at: string;
}

export function findOrCreateUser(wechatOpenid: string): User {
  const existing = db
    .prepare(`SELECT * FROM users WHERE wechat_openid = ?`)
    .get(wechatOpenid) as User | undefined;

  if (existing) return existing;

  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (id, wechat_openid, created_at, updated_at) VALUES (?, ?, ?, ?)`
  ).run(id, wechatOpenid, now, now);
  return { id, wechat_openid: wechatOpenid, nickname: null, created_at: now, updated_at: now };
}

export function getUser(userId: string): User | undefined {
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId) as
    | User
    | undefined;
}
