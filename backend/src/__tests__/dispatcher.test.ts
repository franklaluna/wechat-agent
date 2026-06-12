import { describe, it, expect } from "vitest";
import { selectAgent } from "../services/dispatcher.js";

describe("Dispatcher", () => {
  describe("selectAgent", () => {
    it("should select claude-code for code tasks", () => {
      expect(selectAgent("写一个 React 组件")).toBe("claude-code");
      expect(selectAgent("debug this function")).toBe("claude-code");
      expect(selectAgent("重构这段代码")).toBe("claude-code");
    });

    it("should select codex for snippet tasks", () => {
      expect(selectAgent("补全这个函数")).toBe("codex");
      expect(selectAgent("写个补丁 patch this")).toBe("codex");
    });

    it("should default to claude-code for general tasks", () => {
      expect(selectAgent("帮我写一篇文档")).toBe("claude-code");
      expect(selectAgent("explain this concept")).toBe("claude-code");
    });
  });
});
