import { Interval, Spot } from "@binance/connector-typescript";

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

const client = new Spot();

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
    const prices: { [symbol: string]: number } = {};

    const priceRequests = exchangeInfo.symbols
      .flatMap(async (token) => {
        token?.quoteAsset !== "USDC" ? [] :
          await client.symbolPriceTicker({ symbol: token.symbol })
            .then(ticker => {
              if (!Array.isArray(ticker)) {
                prices[token.baseAsset] = parseFloat(ticker.price);
              } else {
                prices[token.baseAsset] = parseFloat(ticker?.[0].price || "0");
              }
            }).catch(() => {
              console.log("Error while fetching binance price of", token.quoteAsset)
              return []
            });
      });

    // Wait for all the requests to complete
    await Promise.all(priceRequests);

    return prices;
  }
}

