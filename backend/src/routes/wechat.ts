import { Router, Request, Response } from "express";
import {
  verifySignature,
  parseWeChatMessage,
  buildTextReply,
  getMessageText,
} from "../services/wechat.js";
import { findOrCreateUser } from "../services/user.js";
import {
  getActiveConversation,
  addMessage,
} from "../services/conversation.js";
import { wsService } from "../services/websocket.js";
import { processMessage } from "../services/message-processor.js";

const router = Router();

/**
 * GET /api/wechat/webhook
 * WeChat server verification endpoint.
 */
router.get("/webhook", (req: Request, res: Response) => {
  const { signature, timestamp, nonce, echostr } = req.query as Record<
    string,
    string
  >;

  if (verifySignature(signature, timestamp, nonce)) {
    res.send(echostr);
  } else {
    res.status(403).send("Invalid signature");
  }
});

/**
 * POST /api/wechat/webhook
 * Receive incoming WeChat messages.
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    // Verify signature
    const { signature, timestamp, nonce } = req.query as Record<
      string,
      string
    >;
    if (!verifySignature(signature, timestamp, nonce)) {
      res.status(403).send("Invalid signature");
      return;
    }

    const xmlBody = req.body as string;
    const message = await parseWeChatMessage(xmlBody);

    // Get or create user
    const user = findOrCreateUser(message.fromUserName);
    const conversation = getActiveConversation(user.id);

    // Extract text content (supports voice-to-text)
    const text = getMessageText(message);
    if (!text) {
      // Unsupported message type — acknowledge receipt
      const reply = buildTextReply(
        message.fromUserName,
        message.toUserName,
        "暂时只支持文字和语音消息哦"
      );
      res.type("application/xml").send(reply);
      return;
    }

    // Store user message
    const msgType = message.msgType === "voice" ? "voice" : "text";
    addMessage(conversation.id, "user", text, msgType);

    // Broadcast new message via WebSocket
    wsService.broadcast({
      type: "message",
      data: { role: "user", content: text, msgType },
    });

    // Reply with acknowledgment (actual AI processing happens async)
    const reply = buildTextReply(
      message.fromUserName,
      message.toUserName,
      "收到消息，正在处理中..."
    );
    res.type("application/xml").send(reply);

    // Process message through DeepSeek + Agent pipeline (async)
    processMessage(user.id, conversation.id, text).catch((err) => {
      console.error("Message processing error:", err);
    });
  } catch (err) {
    console.error("WeChat webhook error:", err);
    // Always respond to WeChat to avoid retries
    res.send("success");
  }
});

export { router as wechatRouter };
