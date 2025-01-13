import { TokenService } from '../services/tokenService';
import { PriceService } from '../services/priceService';
import { ArbitrageOpportunity, CommonToken } from '../types';
import { formatNumber, retry } from '../utils';
import { CONSTANTS } from '../constant';

export class ArbitrageAnalyzer {
  private tokenService: TokenService;
  private priceService: PriceService;

  constructor() {
    this.tokenService = new TokenService();
    this.priceService = new PriceService();
  }

  async analyzeProfitOpportunity(
    token: CommonToken,
    amountUsdc: number
  ): Promise<ArbitrageOpportunity> {
    try {
      const tokenAmount = amountUsdc * Math.pow(10, token.jupiterDecimals);

      const [jupiterBuyPrice, jupiterSellPrice, binancePrice] = await Promise.all([
        retry(() => this.priceService.getJupiterPrice(token.jupiterAddress, amountUsdc, true)),
        retry(() => this.priceService.getJupiterPrice(token.jupiterAddress, tokenAmount, false)),
        retry(() => this.priceService.getBinancePrice(token.symbol))
      ]);

      const fees = this.priceService.calculateFees(amountUsdc);
      const jupiterPrice = (jupiterBuyPrice + jupiterSellPrice) / 2;

      const priceDiff = Math.abs(jupiterPrice - binancePrice);
      const profitPercentage = (priceDiff / Math.min(jupiterPrice, binancePrice)) * 100;

      const direction = jupiterPrice < binancePrice ? 'Jupiter→Binance' : 'Binance→Jupiter';
      const estimatedProfitUSD = (amountUsdc * priceDiff) - fees.total;

      return {
        token,
        jupiterPrice,
        binancePrice,
        profitPercentage,
        direction,
        estimatedProfitUSD,
        timestamp: new Date(),
        fees
      };
    } catch (error) {
      console.error(`Error analyzing ${token.symbol}:`, error);
      throw error;
    }
  }

  async analyzeAllOpportunities(minAmountUsdc: number = 100): Promise<ArbitrageOpportunity[]> {
    const commonTokens = await this.tokenService.getCommonTokens();
    const opportunities: ArbitrageOpportunity[] = [];

    for (const token of commonTokens) {
      try {
        const analysis = await this.analyzeProfitOpportunity(token, minAmountUsdc);
        if (analysis.profitPercentage >= CONSTANTS.MINIMUM_PROFIT_THRESHOLD) {
          opportunities.push(analysis);
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error analyzing ${token.symbol}:`, error);
        continue;
      }
    }

    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }
}
