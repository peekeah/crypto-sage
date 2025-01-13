import { Interval, Spot } from '@binance/connector-typescript';
import { EventEmitter } from 'events';

export class BinanceClient {
  private client: Spot;

  constructor() {
    this.client = new Spot();
  }

  async getHistoricalData(symbol = 'BTCUSDT', interval: Interval, limit = 1000) {
    try {
      const data = await this.client.klineCandlestickData(symbol, interval, { limit });
      return this.formatKlineData(data);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  /*
  subscribeToRealTimeData(symbol = 'BTCUSDT'): EventEmitter {
    const emitter = new EventEmitter();

    const wsClient = this.client.websocket.kline(symbol, '1m', (data) => {
      emitter.emit('data', this.formatKlineData([data]));
    });

    return emitter;
  }
  */

  private formatKlineData(data: any[]) {
    return data.map(candle => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
  }
}
