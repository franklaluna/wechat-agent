/**
 * Test data fixtures for E2E tests.
 */

export const TEST_USER = {
  id: 'test-user-001',
  name: 'Test User',
  wechatOpenId: 'oTestUser001',
};

export const TEST_USER_2 = {
  id: 'test-user-002',
  name: 'Another User',
  wechatOpenId: 'oTestUser002',
};

export const TEST_MESSAGES = {
  simple: '你好，请帮我写一个 Python 脚本',
  withCodex: '请用 codex 帮我分析这段代码',
  withOpenClaw: '用 openclaw 处理这个任务',
  empty: '',
  longMessage: '请'.repeat(500),
  injectionAttempt: '你好; rm -rf /',
  scriptTask: '帮我写一个 hello world 程序',
};

export const MOCK_QR_RESPONSE = {
  qr_code_url: 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=MOCK_TICKET_123',
  ticket: 'MOCK_TICKET_123',
  expire_seconds: 300,
};

export const MOCK_AGENT_RESPONSE = {
  task_id: 'task-mock-001',
  status: 'completed',
  output: '任务已完成。输出结果：Hello, World!',
  agent_type: 'claude-code',
  duration_ms: 1500,
};

export const MOCK_TASK_STATUSES = {
  pending: { id: 'task-001', status: 'pending', agent_type: 'claude-code', input: 'test', output: '', created_at: new Date().toISOString() },
  running: { id: 'task-001', status: 'running', agent_type: 'claude-code', input: 'test', output: '', created_at: new Date().toISOString() },
  completed: { id: 'task-001', status: 'completed', agent_type: 'claude-code', input: 'test', output: 'Done', created_at: new Date().toISOString(), completed_at: new Date().toISOString() },
  failed: { id: 'task-001', status: 'failed', agent_type: 'claude-code', input: 'test', output: 'Error: timeout', created_at: new Date().toISOString(), completed_at: new Date().toISOString() },
};
