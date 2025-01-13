import { Interval } from '@binance/connector-typescript';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const CONFIG = {
  BINANCE: {
    API_KEY: process.env.BINANCE_API_KEY || '',
    API_SECRET: process.env.BINANCE_API_SECRET || '',
    DEFAULT_INTERVAL: Interval['1m'],
    HISTORICAL_LIMIT: 1000,
    TRADING_PAIRS: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'],
    WEBSOCKET_RECONNECT_INTERVAL: 5000
  },
  TECHNICAL_INDICATORS: {
    RSI_PERIOD: 14,
    MACD: {
      FAST_PERIOD: 12,
      SLOW_PERIOD: 26,
      SIGNAL_PERIOD: 9
    },
    BOLLINGER: {
      PERIOD: 20,
      STANDARD_DEVIATIONS: 2
    }
  },
  ML: {
    WINDOW_SIZE: 24,
    BATCH_SIZE: 32,
    EPOCHS: 100,
    VALIDATION_SPLIT: 0.2,
    MODEL_SAVE_PATH: process.env.MODEL_SAVE_PATH || './models',
    DATA_SAVE_PATH: process.env.DATA_SAVE_PATH || './data'
  }
};


