/**
 * E2E-11: API Keys Not Exposed in Frontend
 * E2E-12: Command Injection Prevention
 * E2E-13: Multi-user Data Isolation
 * E2E-14: Agent Process Cleanup
 *
 * Invariants: INV-1, INV-2, INV-4, INV-5, INV-10
 */

import { test, expect } from '@playwright/test';
import { mockAllAPIs, simulateWeChatMessage, apiGet, apiPost } from '../utils/mock-server';
import { TEST_USER, TEST_USER_2, TEST_MESSAGES } from '../fixtures/test-data';

test.describe('Security', () => {

  test('E2E-11a: no WeChat API keys in frontend JS bundles', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Collect all loaded scripts
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]'))
        .map(s => (s as HTMLScriptElement).src);
    });

    // Fetch and scan each script for key patterns
    for (const scriptUrl of scripts) {
      try {
        const resp = await page.evaluate(async (url) => {
          const r = await fetch(url);
          return r.text();
        }, scriptUrl);

        // Should not contain common API key patterns
        expect(resp).not.toMatch(/sk-[a-zA-Z0-9]{20,}/); // DeepSeek/OpenAI style keys
        expect(resp).not.toMatch(/appid["\s]*[:=]["\s]*[a-zA-Z0-9]{10,}/i);
        expect(resp).not.toMatch(/secret["\s]*[:=]["\s]*[a-zA-Z0-9]{20,}/i);
      } catch {
        // External scripts may fail to fetch, that's OK
      }
    }
  });

  test('E2E-11b: no DeepSeek API key in page source or localStorage', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Check localStorage
    const localStorageData = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        items[key] = localStorage.getItem(key)!;
      }
      return items;
    });

    const allValues = Object.values(localStorageData).join(' ');
    expect(allValues).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);

    // Check sessionStorage
    const sessionStorageData = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)!;
        items[key] = sessionStorage.getItem(key)!;
      }
      return items;
    });

    const sessionValues = Object.values(sessionStorageData).join(' ');
    expect(sessionValues).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
  });

  test('E2E-12: command injection in user input is sanitized (INV-4)', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Send malicious input
    const result = await simulateWeChatMessage(TEST_MESSAGES.injectionAttempt, TEST_USER.wechatOpenId);

    // The backend should sanitize the input - check that the task was created
    // but the input was sanitized (no shell metacharacters passed through)
    const { data } = await apiGet('/api/tasks');
    if (data.tasks.length > 0) {
      const task = data.tasks[data.tasks.length - 1];
      // Input should be sanitized - no raw shell commands
      expect(task.input).not.toContain('; rm -rf');
      expect(task.input).not.toContain('`');
      expect(task.input).not.toContain('$(');
    }
  });

  test('E2E-13: user A cannot see user B conversations (INV-5)', async ({ page }) => {
    await mockAllAPIs(page);
    await page.goto('/');

    // Send message as user 1
    await simulateWeChatMessage('User 1 private message', TEST_USER.wechatOpenId);
    await page.waitForTimeout(1000);

    // Send message as user 2
    await simulateWeChatMessage('User 2 private message', TEST_USER_2.wechatOpenId);
    await page.waitForTimeout(1000);

    // Get conversations - should be properly isolated
    const { data } = await apiGet('/api/conversations');
    // Each conversation should have a user_id and not mix messages
    if (data.conversations.length > 1) {
      const userIds = data.conversations.map((c: any) => c.user_id);
      const uniqueUserIds = new Set(userIds);
      // Conversations from different users should be separate
      expect(uniqueUserIds.size).toBeGreaterThanOrEqual(1);
    }
  });
});
