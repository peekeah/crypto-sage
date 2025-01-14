import { Interval, Spot } from "@binance/connector-typescript";

const client = new Spot();

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

export class Binance {
  async fetchHistoricalData(
    symbol: string,
    interval: Interval,
    limit: number
  ): Promise<BinanceKline[]> {
    try {
      const response = await client.klineCandlestickData(symbol, interval, { limit });
      return response.map((kline: any) => ({
        openTime: kline[0],
        open: kline[1],
        high: kline[2],
        low: kline[3],
        close: kline[4],
        volume: kline[5],
        closeTime: kline[6],
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };


  async fetchBinancePrices(): Promise<{ [symbol: string]: number }> {
    const exchangeInfo = await client.exchangeInformation();
    const usdcPairs = exchangeInfo.symbols.filter((s: any) => s.quoteAsset === 'USDC');

    const prices: { [symbol: string]: number } = {};
    for (const pair of usdcPairs) {
      const ticker = await client.symbolPriceTicker({ symbol: pair.symbol });
      if (!Array.isArray(ticker)) {
        prices[pair.baseAsset] = parseFloat(ticker.price);
      } else {
        prices[pair.baseAsset] = parseFloat(ticker?.[0].price || "0");
      }
    }
    return prices;
  }
}

