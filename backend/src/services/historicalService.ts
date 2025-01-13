import { Interval, Spot } from '@binance/connector-typescript';
import { CONFIG } from '../config/index';
import { ProcessedKlineData } from '../types/binance';
import { calculateRSI, calculateMACD, calculateBollingerBands } from '../utils/indicators';

export class HistoricalDataService {
  private client: Spot;

  constructor() {
    this.client = new Spot(
      CONFIG.BINANCE.API_KEY,
      CONFIG.BINANCE.API_SECRET
    );
  }

  async fetchCompleteHistoricalData(
    symbol: string = 'USDCUSDT',
    interval: Interval = Interval['1h'],
    startTime?: number,
    endTime: number = Date.now()
  ): Promise<ProcessedKlineData[]> {
    try {
      let allData: ProcessedKlineData[] = [];
      let currentStartTime = startTime || endTime - (30 * 24 * 60 * 60 * 1000); // Default to last 30 days
      let hasMoreData = true;

      while (hasMoreData) {
        const data = await this.fetchHistoricalSegment(symbol, interval, currentStartTime, endTime);

        if (data.length === 0) {
          hasMoreData = false;
          continue;
        }

        const processedSegment = this.processHistoricalSegment(data);
        allData = [...allData, ...processedSegment];

        // Update start time for next batch
        const lastTimestamp = data[data.length - 1][0];
        if (lastTimestamp >= endTime) {
          hasMoreData = false;
        } else {
          currentStartTime = lastTimestamp + 1;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Process indicators for complete dataset
      return this.addTechnicalIndicators(allData);

    } catch (error) {
      console.error('Error fetching complete historical data:', error);
      throw error;
    }
  }

  private async fetchHistoricalSegment(
    symbol: string,
    interval: Interval,
    startTime: number,
    endTime: number
  ): Promise<any[]> {
    try {
      const response = await this.client.klineCandlestickData(symbol, interval, {
        startTime: startTime,
        endTime: endTime,
        limit: 1000
      });
      return response;
    } catch (error) {
      console.error('Error fetching historical segment:', error);
      throw error;
    }
  }

  private processHistoricalSegment(data: any[]): ProcessedKlineData[] {
    return data.map(candle => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
      trades: parseInt(candle[8]),
      baseAssetVolume: parseFloat(candle[7]),
      quoteAssetVolume: parseFloat(candle[7]),
      indicators: {
        rsi: 0,
        macd: { macd: 0, signal: 0, histogram: 0 },
        bollinger: { upper: 0, middle: 0, lower: 0 },
        volatility: 0
      }
    }));
  }

  private addTechnicalIndicators(data: ProcessedKlineData[]): ProcessedKlineData[] {
    const closes = data.map(d => d.close);

    // Calculate all indicators
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const bollinger = calculateBollingerBands(closes, 20, 2);
    const volatility = this.calculateVolatility(closes);

    // Combine all indicators with the data
    return data.map((candle, i) => ({
      ...candle,
      indicators: {
        rsi: rsi[i] || 0,
        macd: macd[i] || { macd: 0, signal: 0, histogram: 0 },
        bollinger: bollinger[i] || { upper: 0, middle: 0, lower: 0 },
        volatility: volatility[i] || 0
      }
    }));
  }

  private calculateVolatility(prices: number[], period: number = 14): number[] {
    const volatility: number[] = [];
    for (let i = period; i < prices.length; i++) {
      const slice = prices.slice(i - period, i);
      const returns = slice.map((price, index) =>
        index === 0 ? 0 : Math.log(price / slice[index - 1])
      );
      const stdDev = Math.sqrt(
        returns.reduce((sum, ret) => sum + ret * ret, 0) / period
      );
      volatility.push(stdDev);
    }
    return volatility;
  }
}
