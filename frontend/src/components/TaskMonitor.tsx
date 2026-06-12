import { useState, useEffect, useCallback } from 'react';
import { fetchTasks } from '../services/api';
import type { Task, TaskStatus } from '../types/api';

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '等待中',
  running: '执行中',
  completed: '已完成',
  failed: '失败',
};

const STATUS_CLASSES: Record<TaskStatus, string> = {
  pending: 'task--pending',
  running: 'task--running',
  completed: 'task--completed',
  failed: 'task--failed',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN');
}

interface Props {
  liveTasks: Map<string, Task>;
}

export function TaskMonitor({ liveTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTasks();
      setTasks(data.tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载任务失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10_000); // Poll every 10s as fallback.
    return () => clearInterval(timer);
  }, [load]);

  // Merge live (WebSocket) tasks with fetched ones.
  const merged = new Map<string, Task>();
  for (const t of tasks) merged.set(t.id, t);
  for (const [id, t] of liveTasks) merged.set(id, t);
  const allTasks = Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (loading && tasks.length === 0) {
    return <div className="task-monitor" aria-busy="true">加载中...</div>;
  }

  if (error) {
    return (
      <div className="task-monitor" role="alert">
        <p>{error}</p>
        <button onClick={load}>重试</button>
      </div>
    );
  }

  return (
    <div className="task-monitor">
      <h2>任务监控</h2>
      {allTasks.length === 0 ? (
        <p className="empty-state">暂无任务</p>
      ) : (
        <div className="task-list">
          {allTasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${STATUS_CLASSES[task.status]}`}
            >
              <div className="task-header">
                <span className="task-id">#{task.id}</span>
                <span className="task-agent">{task.agent_type}</span>
                <span className={`task-status task-status--${task.status}`}>
                  {STATUS_LABELS[task.status]}
                </span>
              </div>
              <div className="task-body">
                <p className="task-input">
                  <strong>输入:</strong> {task.input}
                </p>
                {task.output && (
                  <p className="task-output">
                    <strong>输出:</strong> {task.output}
                  </p>
                )}
              </div>
              <div className="task-footer">
                <time>创建: {formatTime(task.created_at)}</time>
                {task.completed_at && (
                  <time>完成: {formatTime(task.completed_at)}</time>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
