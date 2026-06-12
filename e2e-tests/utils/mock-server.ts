/**
 * Mock server utilities for E2E tests.
 * Intercepts external API calls (WeChat, DeepSeek) and simulates CLI Agent execution.
 */

import { Page, Route } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:4000';

/** Intercept WeChat API calls on the given page. */
export async function mockWeChatAPI(page: Page) {
  // Mock QR code generation endpoint
  await page.route('**/api/qrcode', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        qr_code_url: 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=MOCK_TICKET_123',
        ticket: 'MOCK_TICKET_123',
        expire_seconds: 300,
      }),
    });
  });
}

/** Simulate a QR code scan event via WebSocket or polling. */
export async function simulateQRScan(page: Page, userId = 'test-user-001') {
  // Trigger qr_scanned event via the mock WebSocket or API
  await page.evaluate((uid) => {
    // If the app uses a global WebSocket reference
    const ws = (window as any).__ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: 'qr_scanned', data: { user_id: uid } }));
    }
  }, userId);
}

/** Mock DeepSeek API responses with predetermined intents. */
export async function mockDeepSeekAPI(page: Page) {
  await page.route('**/api/deepseek/**', (route) => {
    const body = route.request().postDataJSON?.() || {};
    const userMessage = body.messages?.[body.messages.length - 1]?.content || '';

    let agentType = 'claude-code';
    let response = `Understood. I'll use ${agentType} to handle: "${userMessage}"`;

    if (userMessage.toLowerCase().includes('codex')) {
      agentType = 'codex';
    } else if (userMessage.toLowerCase().includes('openclaw')) {
      agentType = 'openclaw';
    }

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{
          message: {
            role: 'assistant',
            content: response,
            function_call: {
              name: 'dispatch_agent',
              arguments: JSON.stringify({
                agent_type: agentType,
                task: userMessage,
                timeout_ms: 300_000,
              }),
            },
          },
        }],
      }),
    });
  });
}

/** Mock CLI Agent execution (child_process). */
export async function mockCLIAgentExecution(page: Page) {
  await page.route('**/api/agent/execute', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        task_id: `task-${Date.now()}`,
        status: 'completed',
        output: 'Task completed successfully. Here is the result: [mock agent output]',
        agent_type: 'claude-code',
        duration_ms: 1500,
      }),
    });
  });
}

/** Mock the full backend API surface for frontend-only testing. */
export async function mockAllAPIs(page: Page) {
  await mockWeChatAPI(page);
  await mockDeepSeekAPI(page);
  await mockCLIAgentExecution(page);

  // Mock conversations endpoint
  await page.route('**/api/conversations*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        conversations: [],
        total: 0,
        page: 1,
      }),
    });
  });

  // Mock tasks endpoint
  await page.route('**/api/tasks', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ tasks: [] }),
    });
  });

  // Mock agent config endpoint
  await page.route('**/api/agent/config', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          default_agent: 'claude-code',
          auto_dispatch: true,
        }),
      });
    }
  });
}

/** Direct API call helpers for backend testing (no browser). */

export async function apiGet(path: string) {
  const resp = await fetch(`${API_URL}${path}`);
  return { status: resp.status, data: await resp.json() };
}

export async function apiPost(path: string, body: unknown) {
  const resp = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: resp.status, data: await resp.json() };
}

/** Simulate an incoming WeChat webhook message. */
export async function simulateWeChatMessage(text: string, fromUser = 'test-user-001') {
  const xmlBody = `<xml>
    <ToUserName><![CDATA[gh_test]]></ToUserName>
    <FromUserName><![CDATA[${fromUser}]]></FromUserName>
    <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${text}]]></Content>
    <MsgId>${Date.now()}</MsgId>
  </xml>`;

  const resp = await fetch(`${API_URL}/wechat/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: xmlBody,
  });
  return { status: resp.status, data: await resp.text() };
}
