/**
 * E2E-06: WebSocket Real-time Updates
 * E2E-07: Task Status Tracking
 *
 * Covers: WebSocket connection, real-time message delivery, task state transitions.
 * Invariants: INV-8 (WebSocket message format)
 */

import { test, expect } from '@playwright/test';
import { mockAllAPIs, simulateWeChatMessage } from '../utils/mock-server';
import { TEST_USER, TEST_MESSAGES } from '../fixtures/test-data';

test.describe('WebSocket Real-time Updates', () => {

  test('E2E-06a: WebSocket connects on page load', async ({ page }) => {
    await mockAllAPIs(page);

    // Listen for WebSocket connection
    const wsPromise = page.waitForEvent('websocket', { timeout: 10_000 });
    await page.goto('/');
    const ws = await wsPromise;

    expect(ws.url()).toContain('ws');
  });

  test('E2E-06b: new messages arrive via WebSocket in real-time', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Wait for WebSocket
    const ws = await page.waitForEvent('websocket', { timeout: 10_000 });

    // Collect WebSocket frames
    const frames: string[] = [];
    ws.on('framereceived', (frame) => {
      if (frame.payload) frames.push(frame.payload.toString());
    });

    // Trigger a message
    await simulateWeChatMessage(TEST_MESSAGES.simple, TEST_USER.wechatOpenId);

    // Wait a bit for WebSocket messages
    await page.waitForTimeout(2000);

    // Should have received at least one frame about the new message
    const messageFrames = frames.filter(f => f.includes('message') || f.includes('content'));
    expect(messageFrames.length).toBeGreaterThan(0);
  });

  test('E2E-06c: task_update events arrive via WebSocket', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    const ws = await page.waitForEvent('websocket', { timeout: 10_000 });

    const taskFrames: string[] = [];
    ws.on('framereceived', (frame) => {
      const payload = frame.payload?.toString() || '';
      if (payload.includes('task_update')) taskFrames.push(payload);
    });

    // Trigger a task
    await simulateWeChatMessage(TEST_MESSAGES.scriptTask, TEST_USER.wechatOpenId);
    await page.waitForTimeout(3000);

    // Should have task status updates
    expect(taskFrames.length).toBeGreaterThan(0);

    // Parse and verify task_update format matches INV-8
    for (const frame of taskFrames) {
      const parsed = JSON.parse(frame);
      expect(parsed).toHaveProperty('event', 'task_update');
      expect(parsed.data).toHaveProperty('id');
      expect(parsed.data).toHaveProperty('status');
      expect(['pending', 'running', 'completed', 'failed']).toContain(parsed.data.status);
    }
  });

  test('E2E-07: task status progresses through expected states', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Trigger a task
    await simulateWeChatMessage(TEST_MESSAGES.scriptTask, TEST_USER.wechatOpenId);

    // Track task statuses from the task monitor UI
    const taskStatuses: string[] = [];

    // Poll task monitor for status changes
    for (let i = 0; i < 10; i++) {
      const statusElements = page.locator('[data-testid="task-status"]');
      const count = await statusElements.count();
      if (count > 0) {
        const latestStatus = await statusElements.last().textContent();
        if (latestStatus && !taskStatuses.includes(latestStatus)) {
          taskStatuses.push(latestStatus);
        }
      }
      await page.waitForTimeout(500);
    }

    // Should have seen at least one status
    expect(taskStatuses.length).toBeGreaterThan(0);
  });
});
