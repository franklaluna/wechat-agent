// Types derived from api-contracts.md — field names must match exactly.

export interface QRCodeResponse {
  qr_code_url: string;
  ticket: string;
  expire_seconds: number;
}

export interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: string; // ISO-8601
  type: 'text' | 'voice';
}

export interface Conversation {
  id: string;
  user_id: string;
  messages: Message[];
  created_at: string; // ISO-8601
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type AgentType = 'claude-code' | 'codex' | 'openclaw';

export interface Task {
  id: string;
  status: TaskStatus;
  agent_type: AgentType;
  input: string;
  output: string;
  created_at: string; // ISO-8601
  completed_at: string; // ISO-8601
}

export interface TasksResponse {
  tasks: Task[];
}

export interface AgentConfigRequest {
  default_agent: AgentType;
  deepseek_api_key: string;
  auto_dispatch: boolean;
}

// WebSocket event payloads (server -> client)
export interface WSMessageEvent {
  role: 'user' | 'agent';
  content: string;
  type: 'text' | 'voice';
}

export interface WSTaskUpdateEvent {
  id: string;
  status: TaskStatus;
  output: string;
}

export interface WSQRScannedEvent {
  user_id: string;
}
