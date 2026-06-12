import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

export type WSEvent =
  | { type: "message"; data: { role: string; content: string; msgType: string } }
  | { type: "task_update"; data: { id: string; status: string; output?: string } }
  | { type: "qr_scanned"; data: { userId: string } };

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  init(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      ws.on("close", () => this.clients.delete(ws));
      ws.on("error", () => this.clients.delete(ws));
    });
  }

  broadcast(event: WSEvent): void {
    const payload = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

export const wsService = new WebSocketService();
