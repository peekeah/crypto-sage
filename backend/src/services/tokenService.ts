import axios from 'axios';
import { CONSTANTS } from '../constant';
import { JupiterToken, BinanceToken, CommonToken } from '../types';

export class TokenService {
  private commonTokens: CommonToken[] = [];

  async fetchJupiterTokens(): Promise<JupiterToken[]> {
    try {
      const response = await axios.get(CONSTANTS.JUPITER_API);
      return response.data.map((token: any) => ({
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        address: token.address,
        decimals: token.decimals,
        logoURI: token.logoURI
      }));
    } catch (error) {
      console.error('Error fetching Jupiter tokens:', error);
      throw error;
    }
  }

  async fetchBinanceTokens(): Promise<BinanceToken[]> {
    try {
      const response = await axios.get(`${CONSTANTS.BINANCE_API}/exchangeInfo`);
      return response.data.symbols.filter((symbol: any) =>
        symbol.status === 'TRADING' &&
        symbol.isSpotTradingAllowed
      );
    } catch (error) {
      console.error('Error fetching Binance tokens:', error);
      throw error;
    }
  }

  async getCommonTokens(): Promise<CommonToken[]> {
    if (this.commonTokens.length > 0) {
      return this.commonTokens;
    }

    const [jupiterTokens, binanceTokens] = await Promise.all([
      this.fetchJupiterTokens(),
      this.fetchBinanceTokens()
    ]);

    const binanceSymbols = new Set(
      binanceTokens.map(token => token.baseAsset)
    );

    this.commonTokens = jupiterTokens
      .filter(token => binanceSymbols.has(token.symbol))
      .map(token => ({
        symbol: token.symbol,
        jupiterAddress: token.address,
        jupiterDecimals: token.decimals,
        binanceSymbol: token.symbol,
        logoURI: token.logoURI
      }));

    return this.commonTokens?.slice(0, 10)
  }
}
