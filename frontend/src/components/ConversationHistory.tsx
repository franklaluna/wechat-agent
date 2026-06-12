import { useState, useEffect, useCallback } from 'react';
import { fetchConversations } from '../services/api';
import type { Conversation, Message } from '../types/api';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN');
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`message ${isUser ? 'message--user' : 'message--agent'}`}>
      <span className="message-role">{isUser ? '用户' : 'Agent'}</span>
      <span className="message-content">{msg.content}</span>
      {msg.type === 'voice' && <span className="message-badge">语音</span>}
      <time className="message-time">{formatTime(msg.timestamp)}</time>
    </div>
  );
}

interface Props {
  realtimeMessages: Message[];
}

export function ConversationHistory({ realtimeMessages }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchConversations(p);
      setConversations(data.conversations);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载对话失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  if (loading && conversations.length === 0) {
    return <div className="conversations" aria-busy="true">加载中...</div>;
  }

  if (error) {
    return (
      <div className="conversations" role="alert">
        <p>{error}</p>
        <button onClick={() => load(page)}>重试</button>
      </div>
    );
  }

  return (
    <div className="conversations">
      <h2>对话历史</h2>

      {/* Realtime messages from WebSocket */}
      {realtimeMessages.length > 0 && (
        <div className="conversation-item conversation-item--live">
          <h3>实时消息</h3>
          {realtimeMessages.map((msg, i) => (
            <MessageBubble key={`rt-${i}`} msg={msg} />
          ))}
        </div>
      )}

      {conversations.length === 0 && realtimeMessages.length === 0 ? (
        <p className="empty-state">暂无对话记录</p>
      ) : (
        conversations.map((conv) => (
          <div key={conv.id} className="conversation-item">
            <div className="conversation-header">
              <span>用户: {conv.user_id}</span>
              <time>{formatTime(conv.created_at)}</time>
            </div>
            {conv.messages.map((msg, i) => (
              <MessageBubble key={`${conv.id}-${i}`} msg={msg} />
            ))}
          </div>
        ))
      )}

      {/* Pagination */}
      {total > 20 && (
        <nav className="pagination" aria-label="对话分页">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </button>
          <span>第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </nav>
      )}
    </div>
  );
}
