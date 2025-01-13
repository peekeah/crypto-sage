import { Interval, Spot } from '@binance/connector-typescript';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { CONFIG } from '../config';
import { KlineData, ProcessedKlineData } from '../types/binance';
import { calculateRSI, calculateMACD, calculateBollingerBands } from '../utils/indicators';

export class BinanceService {
  private client: Spot;
  private wsEndpoint = 'wss://stream.binance.com:9443/ws';
  private dataEmitter: EventEmitter;
  private activeWebSockets: Map<string, WebSocket>;

  constructor() {
    this.client = new Spot(
      CONFIG.BINANCE.API_KEY,
      CONFIG.BINANCE.API_SECRET
    );
    this.dataEmitter = new EventEmitter();
    this.activeWebSockets = new Map();
  }

  async getHistoricalData(
    symbol: string = 'USDCUSDT',
    interval: Interval = CONFIG.BINANCE.DEFAULT_INTERVAL
  ): Promise<ProcessedKlineData[]> {
    try {
      const response = await this.client.klineCandlestickData(symbol, interval, {
        limit: CONFIG.BINANCE.HISTORICAL_LIMIT
      });

      const processedData = this.processHistoricalData(response);
      return this.addTechnicalIndicators(processedData);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  private processHistoricalData(data: any[]): ProcessedKlineData[] {
    return data.map(candle => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      indicators: {
        rsi: 0,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollinger: { upper: 0, middle: 0, lower: 0 }
      }
    }));
  }

  private addTechnicalIndicators(data: ProcessedKlineData[]): ProcessedKlineData[] {
    const closes = data.map(d => d.close);

    // Calculate indicators
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const bollinger = calculateBollingerBands(closes, 20, 2);

    // Add indicators to processed data
    return data.map((candle, i) => ({
      ...candle,
      indicators: {
        rsi: rsi[i] || 0,
        macd: macd[i] || { macd: 0, signal: 0, histogram: 0 },
        bollinger: bollinger[i] || { upper: 0, middle: 0, lower: 0 }
      }
    }));
  }

  subscribeToMarketData(symbols: string[] = CONFIG.BINANCE.TRADING_PAIRS): EventEmitter {
    symbols.forEach(symbol => {
      this.setupWebSocketConnection(symbol.toLowerCase());
    });
    return this.dataEmitter;
  }

  private setupWebSocketConnection(symbol: string) {
    const ws = new WebSocket(`${this.wsEndpoint}/${symbol}@kline_1m`);

    ws.on('message', (data: WebSocket.Data) => {
      const parsedData = JSON.parse(data.toString());
      if (parsedData.k) {
        const processedData = this.processWebSocketData(parsedData.k);
        this.dataEmitter.emit('kline', processedData);
      }
    });

    ws.on('error', (error: Error) => {
      console.error(`WebSocket error for ${symbol}:`, error);
      this.reconnectWebSocket(symbol);
    });

    ws.on('close', () => {
      console.log(`WebSocket closed for ${symbol}`);
      this.reconnectWebSocket(symbol);
    });

    this.activeWebSockets.set(symbol, ws);
  }

  private reconnectWebSocket(symbol: string) {
    setTimeout(() => {
      console.log(`Attempting to reconnect WebSocket for ${symbol}`);
      this.setupWebSocketConnection(symbol);
    }, CONFIG.BINANCE.WEBSOCKET_RECONNECT_INTERVAL);
  }

  private processWebSocketData(kline: any): ProcessedKlineData {
    const processed: ProcessedKlineData = {
      timestamp: kline.t,
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
      indicators: {
        rsi: 0,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollinger: { upper: 0, middle: 0, lower: 0 }
      }
    };

    // Add real-time indicators
    // Note: You'll need historical data for accurate indicators
    return processed;
  }

  async getAllUSDCPairs(): Promise<string[]> {
    try {
      const exchangeInfo = await this.client.exchangeInformation();
      return exchangeInfo.symbols
        .filter(symbol =>
          symbol.baseAsset === 'USDC' &&
          symbol.status === 'TRADING'
        )
        .map(symbol => symbol.symbol);
    } catch (error) {
      console.error('Error fetching USDC pairs:', error);
      return CONFIG.BINANCE.TRADING_PAIRS;
    }
  }

  closeAllConnections() {
    this.activeWebSockets.forEach((ws, symbol) => {
      console.log(`Closing WebSocket connection for ${symbol}`);
      ws.close();
    });
    this.activeWebSockets.clear();
  }
}
