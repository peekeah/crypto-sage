import { Interval } from '@binance/connector-typescript';
import dotenv from 'dotenv';
import path from 'path';
import { getEnv } from '../utils';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const CONFIG = {
  SERVER: {
    API_PORT: getEnv("API_PORT", 5000)
  },
  BINANCE: {
    DEFAULT_INTERVAL: Interval['1m'],
    HISTORICAL_LIMIT: 1000,
  },
  RAYDIUM: {
    API_URI: getEnv("RAYDIUM_API", "https://api-v3.raydium.io"),
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
};


