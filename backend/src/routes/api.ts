import { Router, Request, Response } from "express";
import { generateQRCode } from "../utils/qrcode.js";
import {
  getConversations,
  getConversationMessages,
} from "../services/conversation.js";
import { getTasks } from "../services/task-manager.js";

const router = Router();

/**
 * GET /api/qrcode
 * Generate a new QR code for WeChat login.
 */
router.get("/qrcode", async (_req: Request, res: Response) => {
  try {
    const qrData = await generateQRCode();
    res.json(qrData);
  } catch (err) {
    console.error("QR code generation error:", err);
    res.status(500).json({ error: "Failed to generate QR code" });
  }
});

/**
 * GET /api/conversations
 * Get conversation history with pagination.
 */
router.get("/conversations", (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = getConversations(page, limit);

    // Attach messages to each conversation
    const conversationsWithMessages = result.conversations.map((conv) => ({
      ...conv,
      messages: getConversationMessages(conv.id),
    }));

    res.json({
      conversations: conversationsWithMessages,
      total: result.total,
      page,
    });
  } catch (err) {
    console.error("Conversations fetch error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

/**
 * GET /api/tasks
 * Get all tasks with optional user filter.
 */
router.get("/tasks", (req: Request, res: Response) => {
  try {
    const userId = req.query.user_id as string | undefined;
    const tasks = getTasks(userId);
    res.json({ tasks });
  } catch (err) {
    console.error("Tasks fetch error:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

export { router as apiRouter };
