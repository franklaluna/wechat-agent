/**
 * E2E-01: QR Code Display and Scan Flow
 * E2E-09: QR Code Expiration Handling
 *
 * Covers: QR code generation, display, scanning, and expiration.
 * Invariants: INV-9 (expired QR rejection)
 */

import { test, expect } from '@playwright/test';
import { mockWeChatAPI, simulateQRScan } from '../utils/mock-server';
import { MOCK_QR_RESPONSE } from '../fixtures/test-data';

test.describe('QR Code Flow', () => {

  test('E2E-01a: dashboard displays QR code on load', async ({ page }) => {
    await mockWeChatAPI(page);
    await page.goto('/');

    // QR code image should be visible
    const qrImage = page.locator('[data-testid="qr-code-image"]');
    await expect(qrImage).toBeVisible();

    // Should have a valid src URL
    const src = await qrImage.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toContain('qrcode');
  });

  test('E2E-01b: QR code has expiration info displayed', async ({ page }) => {
    await mockWeChatAPI(page);
    await page.goto('/');

    // Should show expiration countdown or expiry info
    const expiryInfo = page.locator('[data-testid="qr-expiry"]');
    await expect(expiryInfo).toBeVisible();

    const text = await expiryInfo.textContent();
    expect(text).toMatch(/\d+/); // contains a number (seconds)
  });

  test('E2E-01c: QR scan triggers success feedback', async ({ page }) => {
    await mockWeChatAPI(page);
    await page.goto('/');

    // Wait for QR to display
    await expect(page.locator('[data-testid="qr-code-image"]')).toBeVisible();

    // Simulate scan
    await simulateQRScan(page);

    // Should show scan success indicator
    const successIndicator = page.locator('[data-testid="qr-scanned-success"]');
    await expect(successIndicator).toBeVisible({ timeout: 5000 });
  });

  test('E2E-09: expired QR code triggers refresh', async ({ page }) => {
    await mockWeChatAPI(page);
    await page.goto('/');

    // Mock QR expiration by overriding the route to return expired status
    await page.route('**/api/qrcode', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_QR_RESPONSE,
          expire_seconds: 0, // expired
        }),
      });
    });

    // Wait for the app to detect expiration and show refresh prompt
    const refreshButton = page.locator('[data-testid="qr-refresh-btn"]');
    await expect(refreshButton).toBeVisible({ timeout: 10_000 });

    // Click refresh to get new QR code
    await refreshButton.click();

    // Should get a new QR code
    const qrImage = page.locator('[data-testid="qr-code-image"]');
    await expect(qrImage).toBeVisible();
  });
});
