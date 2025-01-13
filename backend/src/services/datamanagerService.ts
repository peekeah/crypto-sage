import { ProcessedKlineData } from '../types/binance';

export class DataManagerService {
  private historicalData: Map<string, ProcessedKlineData[]>;
  private maxDataPoints: number;

  constructor(maxDataPoints: number = 10000) {
    this.historicalData = new Map();
    this.maxDataPoints = maxDataPoints;
  }

  addHistoricalData(symbol: string, data: ProcessedKlineData[]) {
    // Ensure we don't exceed maximum data points
    const trimmedData = data.slice(-this.maxDataPoints);
    this.historicalData.set(symbol, trimmedData);
  }

  updateRealtimeData(symbol: string, newData: ProcessedKlineData) {
    const existingData = this.historicalData.get(symbol) || [];
    const updatedData = [...existingData, newData].slice(-this.maxDataPoints);
    this.historicalData.set(symbol, updatedData);
  }

  getSymbolData(symbol: string): ProcessedKlineData[] {
    return this.historicalData.get(symbol) || [];
  }

  getTimeRange(symbol: string): { start: number; end: number } | null {
    const data = this.historicalData.get(symbol);
    if (!data || data.length === 0) return null;

    return {
      start: data[0].timestamp,
      end: data[data.length - 1].timestamp
    };
  }
}
