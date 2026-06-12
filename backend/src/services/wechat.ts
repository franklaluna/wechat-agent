import crypto from "crypto";
import { parseStringPromise, Builder } from "xml2js";
import { config } from "../config.js";

export interface WeChatMessage {
  toUserName: string;
  fromUserName: string;
  createTime: number;
  msgType: "text" | "voice";
  content?: string;
  msgId: string;
  mediaId?: string;
  recognition?: string; // voice-to-text result
}

/**
 * Verify WeChat server signature (for webhook verification).
 */
export function verifySignature(
  signature: string,
  timestamp: string,
  nonce: string
): boolean {
  const tmpArr = [config.wechat.token, timestamp, nonce].sort();
  const tmpStr = tmpArr.join("");
  const hash = crypto.createHash("sha1").update(tmpStr).digest("hex");
  return hash === signature;
}

/**
 * Parse incoming WeChat XML message body.
 */
export async function parseWeChatMessage(
  xml: string
): Promise<WeChatMessage> {
  const result = await parseStringPromise(xml, { explicitArray: false });
  const msg = result.xml;

  return {
    toUserName: msg.ToUserName,
    fromUserName: msg.FromUserName,
    createTime: parseInt(msg.CreateTime, 10),
    msgType: msg.MsgType,
    content: msg.Content,
    msgId: msg.MsgId,
    mediaId: msg.MediaId,
    recognition: msg.Recognition,
  };
}

/**
 * Build XML response to reply to WeChat message.
 */
export function buildTextReply(
  toUser: string,
  fromUser: string,
  content: string
): string {
  const builder = new Builder({ rootName: "xml", headless: true });
  return builder.buildObject({
    ToUser: toUser,
    FromUser: fromUser,
    CreateTime: Math.floor(Date.now() / 1000),
    MsgType: "text",
    Content: content,
  });
}

/**
 * Extract text content from a message (handles voice-to-text).
 */
export function getMessageText(msg: WeChatMessage): string | null {
  if (msg.msgType === "text" && msg.content) {
    return msg.content;
  }
  if (msg.msgType === "voice" && msg.recognition) {
    return msg.recognition;
  }
  return null;
}
