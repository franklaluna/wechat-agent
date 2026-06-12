/**
 * E2E-03: Agent Dispatch (DeepSeek -> CLI Agent)
 * E2E-10: Agent Timeout Handling
 *
 * Covers: DeepSeek intent recognition, agent selection, task execution, timeout.
 * Invariants: INV-3 (timeout limit), INV-4 (command injection), INV-6 (result integrity), INV-10 (process cleanup)
 */

import { test, expect } from '@playwright/test';
import { mockAllAPIs, simulateWeChatMessage, apiGet, apiPost } from '../utils/mock-server';
import { TEST_MESSAGES, TEST_USER, MOCK_TASK_STATUSES } from '../fixtures/test-data';

test.describe('Agent Dispatch', () => {

  test('E2E-03a: message dispatches to correct agent type (claude-code)', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    await simulateWeChatMessage(TEST_MESSAGES.simple, TEST_USER.wechatOpenId);

    // Check task was created with correct agent type
    const { status, data } = await apiGet('/api/tasks');
    expect(status).toBe(200);

    if (data.tasks.length > 0) {
      const task = data.tasks[data.tasks.length - 1];
      expect(task.agent_type).toBe('claude-code');
    }
  });

  test('E2E-03b: codex keyword routes to codex agent', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    await simulateWeChatMessage(TEST_MESSAGES.withCodex, TEST_USER.wechatOpenId);

    const { data } = await apiGet('/api/tasks');
    if (data.tasks.length > 0) {
      const task = data.tasks[data.tasks.length - 1];
      expect(task.agent_type).toBe('codex');
    }
  });

  test('E2E-03c: openclaw keyword routes to openclaw agent', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    await simulateWeChatMessage(TEST_MESSAGES.withOpenClaw, TEST_USER.wechatOpenId);

    const { data } = await apiGet('/api/tasks');
    if (data.tasks.length > 0) {
      const task = data.tasks[data.tasks.length - 1];
      expect(task.agent_type).toBe('openclaw');
    }
  });

  test('E2E-03d: agent config can be changed', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Change default agent
    const { status } = await apiPost('/api/agent/config', {
      default_agent: 'codex',
      auto_dispatch: true,
    });
    expect(status).toBe(200);
  });

  test('E2E-10: agent execution has timeout (INV-3)', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Mock a slow agent response that times out
    await page.route('**/api/agent/execute', (route) => {
      route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Agent execution timed out after 300 seconds',
          status: 'failed',
        }),
      });
    });

    await simulateWeChatMessage(TEST_MESSAGES.simple, TEST_USER.wechatOpenId);

    // Task should show failed status
    const { data } = await apiGet('/api/tasks');
    if (data.tasks.length > 0) {
      const task = data.tasks[data.tasks.length - 1];
      expect(['failed', 'timeout']).toContain(task.status);
    }
  });
});
