import { CandleData, TechnicalIndicators } from '../types/prediction';

import { CONFIG } from '../config';

export class TechnicalAnalysis {
  static calculateRSI(prices: number[], period: number = CONFIG.TECHNICAL_INDICATORS.RSI_PERIOD): number {
    if (prices.length < period + 1) {
      return 50;
    }

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  static calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const { FAST_PERIOD, SLOW_PERIOD, SIGNAL_PERIOD } = CONFIG.TECHNICAL_INDICATORS.MACD;

    if (prices.length < SLOW_PERIOD + SIGNAL_PERIOD) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    const ema12 = this.calculateEMA(prices, FAST_PERIOD);
    const ema26 = this.calculateEMA(prices, SLOW_PERIOD);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA([...Array(SLOW_PERIOD - SIGNAL_PERIOD).fill(0), macd], SIGNAL_PERIOD);
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  static calculateBollingerBands(prices: number[]): { upper: number; middle: number; lower: number } {
    const { PERIOD, STANDARD_DEVIATIONS } = CONFIG.TECHNICAL_INDICATORS.BOLLINGER;

    if (prices.length < PERIOD) {
      const price = prices[prices.length - 1];
      return { upper: price, middle: price, lower: price };
    }

    const sma = prices.slice(-PERIOD).reduce((a, b) => a + b) / PERIOD;
    const squaredDifferences = prices.slice(-PERIOD).map(price => Math.pow(price - sma, 2));
    const standardDeviation = Math.sqrt(squaredDifferences.reduce((a, b) => a + b) / PERIOD);

    return {
      upper: sma + (standardDeviation * STANDARD_DEVIATIONS),
      middle: sma,
      lower: sma - (standardDeviation * STANDARD_DEVIATIONS),
    };
  }

  private static calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  static calculateAllIndicators(candles: CandleData[]): TechnicalIndicators {
    const prices = candles.map(candle => candle.close);

    return {
      rsi: this.calculateRSI(prices),
      macd: this.calculateMACD(prices),
      bollinger: this.calculateBollingerBands(prices),
    };
  }
}
