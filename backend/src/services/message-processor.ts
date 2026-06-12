import { chat, buildMessages } from "./deepseek.js";
import { dispatchToAgent, selectAgent } from "./dispatcher.js";
import { createTask } from "./task-manager.js";
import { addMessage, getConversationMessages } from "./conversation.js";
import { wsService } from "./websocket.js";

/**
 * Process an incoming user message through the full pipeline:
 * 1. Send to DeepSeek for intent understanding
 * 2. If DeepSeek says dispatch to agent → create task and dispatch
 * 3. Store agent response and broadcast via WebSocket
 */
export async function processMessage(
  userId: string,
  conversationId: string,
  userMessage: string
): Promise<string> {
  // Get conversation history for context
  const history = getConversationMessages(conversationId);
  const chatHistory = history.map((m) => ({
    role: m.role as "user" | "agent",
    content: m.content,
  }));

  // Send to DeepSeek for intent understanding
  const messages = buildMessages(chatHistory, userMessage);
  const deepseekResponse = await chat(messages);

  // Check if DeepSeek wants to dispatch to an agent
  if (deepseekResponse.functionCall) {
    const { agent, task } = deepseekResponse.functionCall.arguments as {
      agent: string;
      task: string;
    };

    // Create task
    const agentType = agent as "claude-code" | "codex" | "openclaw";
    const dbTask = createTask(userId, task, conversationId);

    // Dispatch to agent (async, don't await — let it run in background)
    dispatchToAgent(dbTask, agentType)
      .then((result) => {
        const responseText = result.success
          ? `任务完成:\n${result.output}`
          : `任务失败: ${result.error}`;

        // Store agent response
        addMessage(conversationId, "agent", responseText);

        // Broadcast via WebSocket
        wsService.broadcast({
          type: "message",
          data: { role: "agent", content: responseText, msgType: "text" },
        });
      })
      .catch((err) => {
        console.error("Agent dispatch error:", err);
        const errorMsg = "抱歉，处理任务时出现了错误。";
        addMessage(conversationId, "agent", errorMsg);
        wsService.broadcast({
          type: "message",
          data: { role: "agent", content: errorMsg, msgType: "text" },
        });
      });

    // Return immediate acknowledgment
    return `正在处理任务: ${task}\n使用 Agent: ${agentType}`;
  }

  // No agent dispatch needed — return DeepSeek's direct response
  const responseText = deepseekResponse.content;
  addMessage(conversationId, "agent", responseText);
  wsService.broadcast({
    type: "message",
    data: { role: "agent", content: responseText, msgType: "text" },
  });

  return responseText;
}
