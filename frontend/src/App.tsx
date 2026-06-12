import { useState, useCallback } from 'react';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { ConversationHistory } from './components/ConversationHistory';
import { TaskMonitor } from './components/TaskMonitor';
import { AgentConfig } from './components/AgentConfig';
import { useWebSocket } from './hooks/useWebSocket';
import type { Message, Task, WSMessageEvent, WSTaskUpdateEvent } from './types/api';

type Tab = 'dashboard' | 'conversations' | 'tasks' | 'config';

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [qrScanned, setQrScanned] = useState(false);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);
  const [liveTasks, setLiveTasks] = useState<Map<string, Task>>(new Map());

  const handleMessage = useCallback((data: WSMessageEvent) => {
    setLiveMessages((prev) => [
      ...prev,
      {
        ...data,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  const handleTaskUpdate = useCallback((data: WSTaskUpdateEvent) => {
    setLiveTasks((prev) => {
      const next = new Map(prev);
      const existing = next.get(data.id);
      next.set(data.id, {
        id: data.id,
        status: data.status,
        output: data.output,
        agent_type: existing?.agent_type ?? 'claude-code',
        input: existing?.input ?? '',
        created_at: existing?.created_at ?? new Date().toISOString(),
        completed_at:
          data.status === 'completed' || data.status === 'failed'
            ? new Date().toISOString()
            : existing?.completed_at ?? '',
      });
      return next;
    });
  }, []);

  const handleQRScanned = useCallback(() => {
    setQrScanned(true);
  }, []);

  const wsStatus = useWebSocket({
    onMessage: handleMessage,
    onTaskUpdate: handleTaskUpdate,
    onQRScanned: handleQRScanned,
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: '仪表盘' },
    { key: 'conversations', label: '对话' },
    { key: 'tasks', label: '任务' },
    { key: 'config', label: '配置' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <h1>WeAgent</h1>
        <span
          className={`ws-status ws-status--${wsStatus}`}
          aria-label={`WebSocket ${wsStatus}`}
        >
          {wsStatus === 'open' ? '已连接' : '未连接'}
        </span>
      </header>

      <nav className="tab-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={activeTab === tab.key ? 'tab--active' : 'tab'}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            <QRCodeDisplay scanned={qrScanned} />
            <TaskMonitor liveTasks={liveTasks} />
          </div>
        )}
        {activeTab === 'conversations' && (
          <ConversationHistory realtimeMessages={liveMessages} />
        )}
        {activeTab === 'tasks' && <TaskMonitor liveTasks={liveTasks} />}
        {activeTab === 'config' && <AgentConfig />}
      </main>
    </div>
  );
}
