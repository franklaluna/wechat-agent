import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";

// Set env before importing config-dependent modules
process.env.WECHAT_TOKEN = "test_token";
const TOKEN = "test_token";

let verifySignature: typeof import("../services/wechat.js").verifySignature;
let parseWeChatMessage: typeof import("../services/wechat.js").parseWeChatMessage;
let buildTextReply: typeof import("../services/wechat.js").buildTextReply;
let getMessageText: typeof import("../services/wechat.js").getMessageText;

beforeAll(async () => {
  const mod = await import("../services/wechat.js");
  verifySignature = mod.verifySignature;
  parseWeChatMessage = mod.parseWeChatMessage;
  buildTextReply = mod.buildTextReply;
  getMessageText = mod.getMessageText;
});

describe("WeChat Service", () => {
  describe("verifySignature", () => {
    it("should verify a valid signature", () => {
      const timestamp = "1234567890";
      const nonce = "abc123";
      const tmpArr = [TOKEN, timestamp, nonce].sort();
      const tmpStr = tmpArr.join("");
      const signature = crypto
        .createHash("sha1")
        .update(tmpStr)
        .digest("hex");

      expect(verifySignature(signature, timestamp, nonce)).toBe(true);
    });

    it("should reject an invalid signature", () => {
      expect(verifySignature("invalid", "1234567890", "abc123")).toBe(false);
    });
  });

  describe("parseWeChatMessage", () => {
    it("should parse a text message", async () => {
      const xml = `<xml>
        <ToUserName>gh_test</ToUserName>
        <FromUserName>user123</FromUserName>
        <CreateTime>1234567890</CreateTime>
        <MsgType>text</MsgType>
        <Content>Hello World</Content>
        <MsgId>12345</MsgId>
      </xml>`;

      const msg = await parseWeChatMessage(xml);
      expect(msg.toUserName).toBe("gh_test");
      expect(msg.fromUserName).toBe("user123");
      expect(msg.msgType).toBe("text");
      expect(msg.content).toBe("Hello World");
      expect(msg.msgId).toBe("12345");
    });

    it("should parse a voice message", async () => {
      const xml = `<xml>
        <ToUserName>gh_test</ToUserName>
        <FromUserName>user123</FromUserName>
        <CreateTime>1234567890</CreateTime>
        <MsgType>voice</MsgType>
        <MediaId>media_123</MediaId>
        <Recognition>语音转文字结果</Recognition>
        <MsgId>12346</MsgId>
      </xml>`;

      const msg = await parseWeChatMessage(xml);
      expect(msg.msgType).toBe("voice");
      expect(msg.recognition).toBe("语音转文字结果");
    });
  });

  describe("buildTextReply", () => {
    it("should build valid XML reply", () => {
      const xml = buildTextReply("user123", "gh_test", "Reply content");
      expect(xml).toContain("<ToUser>user123</ToUser>");
      expect(xml).toContain("<FromUser>gh_test</FromUser>");
      expect(xml).toContain("<MsgType>text</MsgType>");
      expect(xml).toContain("<Content>Reply content</Content>");
    });
  });

  describe("getMessageText", () => {
    it("should extract text from text message", () => {
      const msg = {
        toUserName: "gh",
        fromUserName: "user",
        createTime: 123,
        msgType: "text" as const,
        content: "hello",
        msgId: "1",
      };
      expect(getMessageText(msg)).toBe("hello");
    });

    it("should extract recognition from voice message", () => {
      const msg = {
        toUserName: "gh",
        fromUserName: "user",
        createTime: 123,
        msgType: "voice" as const,
        msgId: "1",
        recognition: "voice text",
      };
      expect(getMessageText(msg)).toBe("voice text");
    });

    it("should return null for unsupported message type", () => {
      const msg = {
        toUserName: "gh",
        fromUserName: "user",
        createTime: 123,
        msgType: "image" as any,
        msgId: "1",
      };
      expect(getMessageText(msg)).toBeNull();
    });
  });
});
