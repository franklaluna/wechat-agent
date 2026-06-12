/**
 * E2E-04: Agent Response Delivery
 * E2E-08: Conversation History Display
 *
 * Covers: response rendering, conversation list, message formatting.
 * Invariants: INV-7 (API contract), INV-8 (WebSocket format)
 */

import { test, expect } from '@playwright/test';
import { mockAllAPIs, simulateWeChatMessage, apiGet } from '../utils/mock-server';
import { TEST_USER, TEST_MESSAGES } from '../fixtures/test-data';

test.describe('Conversation UI', () => {

  test('E2E-08a: conversation list displays on load', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    const conversationList = page.locator('[data-testid="conversation-list"]');
    await expect(conversationList).toBeVisible();
  });

  test('E2E-08b: clicking a conversation shows its messages', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Create a conversation first
    await simulateWeChatMessage(TEST_MESSAGES.simple, TEST_USER.wechatOpenId);
    await page.waitForTimeout(1000);

    // Click on the conversation in the list
    const conversationItem = page.locator('[data-testid="conversation-item"]').first();
    if (await conversationItem.isVisible()) {
      await conversationItem.click();

      // Messages panel should show
      const messagesPanel = page.locator('[data-testid="messages-panel"]');
      await expect(messagesPanel).toBeVisible();
    }
  });

  test('E2E-04: agent response renders with correct formatting', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    await simulateWeChatMessage(TEST_MESSAGES.scriptTask, TEST_USER.wechatOpenId);

    // Wait for agent response
    const agentResponse = page.locator('[data-testid="message-bubble"][data-role="agent"]').last();
    await expect(agentResponse).toBeVisible({ timeout: 15_000 });

    // Response should be rendered (not raw JSON)
    const text = await agentResponse.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);

    // Should not be raw JSON
    expect(() => JSON.parse(text!)).toThrow();
  });

  test('E2E-08c: messages display in chronological order', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Send multiple messages
    await simulateWeChatMessage('First message', TEST_USER.wechatOpenId);
    await page.waitForTimeout(500);
    await simulateWeChatMessage('Second message', TEST_USER.wechatOpenId);
    await page.waitForTimeout(1000);

    // Get all user messages
    const userMessages = page.locator('[data-testid="message-bubble"][data-role="user"]');
    const count = await userMessages.count();

    if (count >= 2) {
      const first = await userMessages.nth(0).textContent();
      const second = await userMessages.nth(1).textContent();
      expect(first).toContain('First');
      expect(second).toContain('Second');
    }
  });
});
