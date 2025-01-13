export interface JupiterToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

export interface BinanceToken {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  isSpotTradingAllowed: boolean;
}

export interface CommonToken {
  symbol: string;
  jupiterAddress: string;
  jupiterDecimals: number;
  binanceSymbol: string;
  logoURI?: string;
}

export interface PriceData {
  price: number;
  timestamp: number;
}

export interface ArbitrageOpportunity {
  token: CommonToken;
  jupiterPrice: number;
  binancePrice: number;
  profitPercentage: number;
  direction: 'Jupiter→Binance' | 'Binance→Jupiter';
  estimatedProfitUSD: number;
  timestamp: Date;
  volume24h?: number;
  fees: {
    jupiter: number;
    binance: number;
    total: number;
  };
}
