import { describe, it, expect } from "vitest";
import { buildMessages } from "../services/deepseek.js";

describe("DeepSeek Service", () => {
  describe("buildMessages", () => {
    it("should build messages with history", () => {
      const history = [
        { role: "user" as const, content: "hello" },
        { role: "agent" as const, content: "hi there" },
      ];
      const messages = buildMessages(history, "new message");

      expect(messages).toHaveLength(3);
      expect(messages[0]).toEqual({ role: "user", content: "hello" });
      expect(messages[1]).toEqual({ role: "assistant", content: "hi there" });
      expect(messages[2]).toEqual({ role: "user", content: "new message" });
    });

    it("should work with empty history", () => {
      const messages = buildMessages([], "first message");
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({ role: "user", content: "first message" });
    });

    it("should limit history to last 10 messages", () => {
      const history = Array.from({ length: 15 }, (_, i) => ({
        role: (i % 2 === 0 ? "user" : "agent") as "user" | "agent",
        content: `msg ${i}`,
      }));
      const messages = buildMessages(history, "current");

      // 10 history + 1 current
      expect(messages).toHaveLength(11);
      expect(messages[0].content).toBe("msg 5");
    });
  });
});
