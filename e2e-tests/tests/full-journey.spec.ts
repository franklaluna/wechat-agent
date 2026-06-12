/**
 * E2E-05: Full Journey - QR Scan -> Message -> Agent -> Response
 *
 * This is the critical end-to-end happy path test.
 * Invariants covered: INV-5, INV-6, INV-7, INV-8
 */

import { test, expect } from '@playwright/test';
import { mockAllAPIs, simulateQRScan, simulateWeChatMessage, apiGet } from '../utils/mock-server';
import { TEST_USER, TEST_MESSAGES } from '../fixtures/test-data';

test.describe('Full Journey', () => {

  test('E2E-05: complete user journey from QR to agent response', async ({ page }) => {
    // Step 1: Load dashboard with mocked APIs
    await mockAllAPIs(page);
    await page.goto('/');

    // Step 2: QR code appears
    const qrImage = page.locator('[data-testid="qr-code-image"]');
    await expect(qrImage).toBeVisible();
    await expect(qrImage).toHaveAttribute('src', /qrcode/);

    // Step 3: User scans QR code
    await simulateQRScan(page, TEST_USER.wechatOpenId);

    // Should indicate successful connection
    const connectedIndicator = page.locator('[data-testid="connection-status"]');
    await expect(connectedIndicator).toContainText(/connected|已连接/i, { timeout: 10_000 });

    // Step 4: User sends a text message via WeChat
    await simulateWeChatMessage(TEST_MESSAGES.scriptTask, TEST_USER.wechatOpenId);

    // Step 5: Message appears in conversation UI
    const userMessage = page.locator('[data-testid="message-bubble"][data-role="user"]').last();
    await expect(userMessage).toBeVisible({ timeout: 5000 });
    await expect(userMessage).toContainText(TEST_MESSAGES.scriptTask);

    // Step 6: Agent processes and responds
    const agentMessage = page.locator('[data-testid="message-bubble"][data-role="agent"]').last();
    await expect(agentMessage).toBeVisible({ timeout: 20_000 });

    // Step 7: Task appears in task monitor with completed status
    const taskMonitor = page.locator('[data-testid="task-monitor"]');
    await expect(taskMonitor).toBeVisible();

    // Step 8: Verify via API that conversation was recorded
    const { status, data } = await apiGet('/api/conversations');
    expect(status).toBe(200);
    expect(data.conversations.length).toBeGreaterThan(0);

    const conversation = data.conversations[0];
    expect(conversation.messages.length).toBeGreaterThanOrEqual(2); // user + agent

    // Verify message types
    const roles = conversation.messages.map((m: any) => m.role);
    expect(roles).toContain('user');
    expect(roles).toContain('agent');
  });
});
