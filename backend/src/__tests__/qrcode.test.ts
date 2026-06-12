import { describe, it, expect } from "vitest";
import {
  generateQRCode,
  validateQRTicket,
  markQRScanned,
  isQRScanned,
} from "../utils/qrcode.js";

describe("QR Code Service", () => {
  it("should generate QR code data", async () => {
    const qr = await generateQRCode();
    expect(qr.qr_code_url).toMatch(/^data:image\/png;base64,/);
    expect(qr.ticket).toBeDefined();
    expect(qr.expire_seconds).toBe(300);
  });

  it("should validate a fresh ticket", async () => {
    const qr = await generateQRCode();
    const result = validateQRTicket(qr.ticket);
    expect(result.valid).toBe(true);
  });

  it("should reject a non-existent ticket", () => {
    const result = validateQRTicket("nonexistent-ticket");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("ticket_not_found");
  });

  it("should mark QR as scanned", async () => {
    const qr = await generateQRCode();
    expect(isQRScanned(qr.ticket)).toBe(false);
    markQRScanned(qr.ticket, "user-123");
    expect(isQRScanned(qr.ticket)).toBe(true);
  });
});
