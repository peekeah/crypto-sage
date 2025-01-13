import { WebSocket, WebSocketServer } from 'ws';
import { ProcessedKlineData } from '../types/binance';
import { PredictionResult } from '../types/prediction';

export class WebSocketManager {
  private clients: Map<WebSocket, Set<string>> = new Map();

  constructor(private wss: WebSocketServer) {
    this.initialize();
  }

  private initialize() {
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.set(ws, new Set());

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'subscribe' && data.symbols) {
            const subscriptions = this.clients.get(ws);
            data.symbols.forEach((symbol: string) => subscriptions?.add(symbol));
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  broadcast(data: any, type: string, symbol?: string) {
    const message = JSON.stringify({
      type,
      symbol,
      data,
      timestamp: Date.now()
    });

    this.clients.forEach((subscriptions, client) => {
      if (client.readyState === WebSocket.OPEN && (!symbol || subscriptions.has(symbol))) {
        client.send(message);
      }
    });
  }
}
