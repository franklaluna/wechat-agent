import { useState } from 'react';
import { postAgentConfig } from '../services/api';
import type { AgentType, AgentConfigRequest } from '../types/api';

const AGENT_OPTIONS: { value: AgentType; label: string }[] = [
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'codex', label: 'Codex' },
  { value: 'openclaw', label: 'OpenClaw' },
];

export function AgentConfig() {
  const [agent, setAgent] = useState<AgentType>('claude-code');
  const [apiKey, setApiKey] = useState('');
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const config: AgentConfigRequest = {
        default_agent: agent,
        deepseek_api_key: apiKey,
        auto_dispatch: autoDispatch,
      };
      await postAgentConfig(config);
      setMsg('配置已保存');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="agent-config" onSubmit={handleSubmit}>
      <h2>Agent 配置</h2>

      <label>
        默认 Agent
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value as AgentType)}
        >
          {AGENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        DeepSeek API Key
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          autoComplete="off"
        />
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={autoDispatch}
          onChange={(e) => setAutoDispatch(e.target.checked)}
        />
        自动分派任务
      </label>

      <button type="submit" disabled={saving}>
        {saving ? '保存中...' : '保存配置'}
      </button>

      {msg && (
        <p className="config-msg" role="status">
          {msg}
        </p>
      )}
    </form>
  );
}
