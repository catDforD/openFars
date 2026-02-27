import { API_BASE } from '@/api/client';

export interface RunEvent<TPayload = unknown> {
  event: string;
  payload: TPayload;
  timestamp?: string;
}

function toWebSocketBase(apiBase: string): string {
  if (apiBase.startsWith('https://')) {
    return apiBase.replace('https://', 'wss://');
  }
  if (apiBase.startsWith('http://')) {
    return apiBase.replace('http://', 'ws://');
  }
  return apiBase;
}

export class RunWebSocketClient {
  private socket: WebSocket | null = null;
  private pingTimer: number | null = null;

  connect(
    runId: string,
    onEvent: (event: RunEvent) => void,
    onStatusChange: (connected: boolean) => void,
  ): void {
    this.close();
    const wsBase = import.meta.env.VITE_WS_BASE_URL ?? toWebSocketBase(API_BASE);
    this.socket = new WebSocket(`${wsBase}/ws/runs/${runId}`);

    this.socket.onopen = () => {
      onStatusChange(true);
      this.pingTimer = window.setInterval(() => {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send('ping');
        }
      }, 15_000);
    };

    this.socket.onmessage = (messageEvent) => {
      try {
        const event = JSON.parse(messageEvent.data) as RunEvent;
        onEvent(event);
      } catch {
        // Ignore malformed websocket payloads.
      }
    };

    this.socket.onerror = () => {
      onStatusChange(false);
    };

    this.socket.onclose = () => {
      onStatusChange(false);
      if (this.pingTimer !== null) {
        clearInterval(this.pingTimer);
      }
      this.pingTimer = null;
    };
  }

  close(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
