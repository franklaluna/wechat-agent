import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

export interface QRCodeData {
  qr_code_url: string;
  ticket: string;
  expire_seconds: number;
}

// In-memory QR session store (maps ticket -> session info)
const qrSessions = new Map<
  string,
  { createdAt: number; scanned: boolean; userId?: string }
>();

const QR_EXPIRE_SECONDS = 300;

export async function generateQRCode(): Promise<QRCodeData> {
  const ticket = uuidv4();

  // Generate QR code as data URL
  const qr_code_url = await QRCode.toDataURL(ticket, {
    width: 256,
    margin: 2,
  });

  qrSessions.set(ticket, { createdAt: Date.now(), scanned: false });

  return {
    qr_code_url,
    ticket,
    expire_seconds: QR_EXPIRE_SECONDS,
  };
}

export function validateQRTicket(ticket: string): {
  valid: boolean;
  reason?: string;
} {
  const session = qrSessions.get(ticket);
  if (!session) return { valid: false, reason: "ticket_not_found" };

  const elapsed = (Date.now() - session.createdAt) / 1000;
  if (elapsed > QR_EXPIRE_SECONDS) {
    qrSessions.delete(ticket);
    return { valid: false, reason: "expired" };
  }

  return { valid: true };
}

export function markQRScanned(
  ticket: string,
  userId: string
): boolean {
  const session = qrSessions.get(ticket);
  if (!session) return false;

  session.scanned = true;
  session.userId = userId;
  return true;
}

export function isQRScanned(ticket: string): boolean {
  return qrSessions.get(ticket)?.scanned ?? false;
}
