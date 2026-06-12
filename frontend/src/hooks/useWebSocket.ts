import { useEffect, useRef, useCallback, useState } from 'react';
import type {
  WSMessageEvent,
  WSTaskUpdateEvent,
  WSQRScannedEvent,
} from '../types/api';

export type WSStatus = 'connecting' | 'open' | 'closed' | 'error';

interface WSEventHandlers {
  onMessage?: (data: WSMessageEvent) => void;
  onTaskUpdate?: (data: WSTaskUpdateEvent) => void;
  onQRScanned?: (data: WSQRScannedEvent) => void;
}

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket(handlers: WSEventHandlers) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const [status, setStatus] = useState<WSStatus>('connecting');

  // Keep handlers in a ref so reconnect picks up latest callbacks.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => {
      reconnectCount.current = 0;
      setStatus('open');
    };

    ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        const h = handlersRef.current;
        switch (type) {
          case 'message':
            h.onMessage?.(data);
            break;
          case 'task_update':
            h.onTaskUpdate?.(data);
            break;
          case 'qr_scanned':
            h.onQRScanned?.(data);
            break;
        }
      } catch {
        // Ignore malformed messages.
      }
    };

    ws.onclose = () => {
      setStatus('closed');
      if (reconnectCount.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectCount.current += 1;
        setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    ws.onerror = () => {
      setStatus('error');
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return status;
}
