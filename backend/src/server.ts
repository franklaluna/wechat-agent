import express from "express";
import http from "http";
import { config } from "./config.js";
import { wsService } from "./services/websocket.js";
import { wechatRouter } from "./routes/wechat.js";
import { apiRouter } from "./routes/api.js";

const app = express();

// WeChat webhook needs raw XML body
app.use("/api/wechat", express.text({ type: "application/xml" }));
app.use("/api/wechat", express.text({ type: "text/xml" }));

// JSON body for other routes
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Routes
app.use("/api/wechat", wechatRouter);
app.use("/api", apiRouter);

// Error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// Start server
const server = http.createServer(app);

wsService.init(server);

server.listen(config.port, () => {
  console.log(`wechat-agent backend running on port ${config.port}`);
  console.log(`environment: ${config.nodeEnv}`);
});

export { app, server };
