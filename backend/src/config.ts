import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  wechat: {
    appId: process.env.WECHAT_APP_ID || "",
    appSecret: process.env.WECHAT_APP_SECRET || "",
    token: process.env.WECHAT_TOKEN || "",
    encodingAESKey: process.env.WECHAT_ENCODING_AES_KEY || "",
  },

  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    apiUrl: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com",
  },

  agent: {
    claudeCodePath: process.env.CLAUDE_CODE_PATH || "claude",
    codexPath: process.env.CODEX_PATH || "codex",
    openclawPath: process.env.OPENCLAW_PATH || "openclaw",
    timeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS || "300000", 10),
  },
} as const;
