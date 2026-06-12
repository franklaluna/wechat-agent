import type {
  QRCodeResponse,
  ConversationsResponse,
  TasksResponse,
  AgentConfigRequest,
} from '../types/api';

const BASE = '/api';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export function fetchQRCode(): Promise<QRCodeResponse> {
  return request<QRCodeResponse>(`${BASE}/qrcode`);
}

export function fetchConversations(
  page = 1,
  limit = 20,
): Promise<ConversationsResponse> {
  return request<ConversationsResponse>(
    `${BASE}/conversations?page=${page}&limit=${limit}`,
  );
}

export function fetchTasks(): Promise<TasksResponse> {
  return request<TasksResponse>(`${BASE}/tasks`);
}

export function postAgentConfig(config: AgentConfigRequest): Promise<void> {
  return request<void>(`${BASE}/agent/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}
