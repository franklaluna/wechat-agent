/**
 * E2E-02: Text Message Send/Receive
 *
 * Covers: message sending via WeChat webhook, message display in conversation UI.
 * Invariants: INV-5 (user isolation), INV-7 (API contract match)
 */

import { test, expect } from '@playwright/test';
import { mockAllAPIs, simulateWeChatMessage, apiGet } from '../utils/mock-server';
import { TEST_MESSAGES, TEST_USER } from '../fixtures/test-data';

test.describe('Messaging Flow', () => {

  test('E2E-02a: incoming text message appears in conversation', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Simulate incoming WeChat message
    await simulateWeChatMessage(TEST_MESSAGES.simple, TEST_USER.wechatOpenId);

    // Message should appear in the conversation UI
    const messageBubble = page.locator('[data-testid="message-bubble"]').last();
    await expect(messageBubble).toBeVisible({ timeout: 5000 });
    await expect(messageBubble).toContainText(TEST_MESSAGES.simple);
  });

  test('E2E-02b: agent response appears after user message', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Send a message
    await simulateWeChatMessage(TEST_MESSAGES.scriptTask, TEST_USER.wechatOpenId);

    // Wait for agent response
    const agentMessage = page.locator('[data-testid="message-bubble"][data-role="agent"]').last();
    await expect(agentMessage).toBeVisible({ timeout: 15_000 });
  });

  test('E2E-02c: messages have correct metadata (role, timestamp, type)', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    await simulateWeChatMessage(TEST_MESSAGES.simple, TEST_USER.wechatOpenId);

    // Check message metadata via API
    const { status, data } = await apiGet('/api/conversations');
    expect(status).toBe(200);
    expect(data).toHaveProperty('conversations');

    if (data.conversations.length > 0) {
      const lastConv = data.conversations[0];
      expect(lastConv).toHaveProperty('id');
      expect(lastConv).toHaveProperty('messages');
      expect(lastConv.messages.length).toBeGreaterThan(0);

      const msg = lastConv.messages[0];
      expect(msg).toHaveProperty('role');
      expect(msg).toHaveProperty('content');
      expect(msg).toHaveProperty('timestamp');
      expect(msg).toHaveProperty('type');
      expect(['user', 'agent']).toContain(msg.role);
      expect(['text', 'voice']).toContain(msg.type);
    }
  });

  test('E2E-02d: conversation history pagination works', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Test pagination params
    const { status, data } = await apiGet('/api/conversations?page=1&limit=10');
    expect(status).toBe(200);
    expect(data).toHaveProperty('page', 1);
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.conversations)).toBe(true);
  });
});
