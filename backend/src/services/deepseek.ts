import { config } from "../config.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekResponse {
  content: string;
  functionCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

const SYSTEM_PROMPT = `你是一个 AI Agent 调度助手。你的职责是：
1. 理解用户的意图
2. 判断应该使用哪个 Agent 来执行任务
3. 返回执行指令

可用的 Agent：
- claude-code: 适合代码编写、调试、重构任务
- codex: 适合代码补全、小片段生成
- openclaw: 适合通用任务执行

请以 JSON 格式返回你的决策：
{
  "agent": "claude-code|codex|openclaw",
  "task": "具体的任务描述",
  "reason": "选择这个 Agent 的原因"
}

如果用户的消息不需要调用 Agent（比如闲聊），直接回复即可。`;

/**
 * Send a message to DeepSeek API and get a response.
 */
export async function chat(
  messages: ChatMessage[]
): Promise<DeepSeekResponse> {
  const response = await fetch(`${config.deepseek.apiUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.deepseek.apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{
      message: { content: string; function_call?: { name: string; arguments: string } };
    }>;
  };

  const choice = data.choices[0];
  if (!choice) {
    throw new Error("DeepSeek API returned no choices");
  }

  const content = choice.message.content || "";

  // Try to parse agent dispatch from response
  let functionCall: DeepSeekResponse["functionCall"] | undefined;
  try {
    const jsonMatch = content.match(/\{[\s\S]*"agent"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.agent && parsed.task) {
        functionCall = {
          name: "dispatch_agent",
          arguments: parsed,
        };
      }
    }
  } catch {
    // Not a dispatch response, just return the text
  }

  return { content, functionCall };
}

/**
 * Build chat messages for a user interaction.
 */
export function buildMessages(
  history: Array<{ role: "user" | "agent"; content: string }>,
  currentMessage: string
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // Add recent history (last 10 messages for context)
  const recent = history.slice(-10);
  for (const msg of recent) {
    messages.push({
      role: msg.role === "agent" ? "assistant" : "user",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: currentMessage });
  return messages;
}
