import { describe, it, expect } from "vitest";
import { sanitizeInput } from "../utils/sanitize.js";

describe("sanitizeInput", () => {
  it("should pass through normal text", () => {
    expect(sanitizeInput("Hello, how are you?")).toBe("Hello, how are you?");
  });

  it("should remove shell metacharacters", () => {
    expect(sanitizeInput("test; rm -rf /")).toBe("test rm -rf /");
    expect(sanitizeInput("hello `whoami`")).toBe("hello whoami");
    expect(sanitizeInput("test $HOME")).toBe("test HOME");
    expect(sanitizeInput("test | cat")).toBe("test cat");
    expect(sanitizeInput("test & bg")).toBe("test bg");
  });

  it("should remove null bytes", () => {
    expect(sanitizeInput("test\0null")).toBe("testnull");
  });

  it("should collapse whitespace", () => {
    expect(sanitizeInput("  hello   world  ")).toBe("hello world");
  });

  it("should enforce max length", () => {
    const longInput = "a".repeat(20000);
    const result = sanitizeInput(longInput);
    expect(result.length).toBe(10000);
  });

  it("should handle Chinese characters", () => {
    expect(sanitizeInput("你好世界")).toBe("你好世界");
  });
});
