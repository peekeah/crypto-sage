import axios from 'axios';
import { Decimal } from 'decimal.js';
import { CONSTANTS } from '../constant';
import { CommonToken, ArbitrageOpportunity } from '../types';

export class PriceService {
  async getJupiterPrice(
    tokenMint: string,
    amount: number,
    isUsdcToToken: boolean
  ): Promise<number> {
    try {
      const params = isUsdcToToken ? {
        inputMint: CONSTANTS.USDC_MINT,
        outputMint: tokenMint,
        amount: amount * 1e6
      } : {
        inputMint: tokenMint,
        outputMint: CONSTANTS.USDC_MINT,
        amount
      };

      const response = await axios.get(CONSTANTS.JUPITER_QUOTE_API, {
        params: {
          ...params,
          slippageBps: 50
        }
      });

      if (isUsdcToToken) {
        return new Decimal(amount).div(
          new Decimal(response.data.outAmount).div(1e6)
        ).toNumber();
      } else {
        return new Decimal(response.data.outAmount)
          .div(1e6)
          .div(new Decimal(amount).div(1e6))
          .toNumber();
      }
    } catch (error) {
      console.error('Error getting Jupiter price:', error);
      throw error;
    }
  }

  async getBinancePrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${CONSTANTS.BINANCE_API}/ticker/price`, {
        params: { symbol: `${symbol}USDT` }
      });
      return parseFloat(response.data.price);
    } catch (error) {
      console.error('Error getting Binance price:', error);
      throw error;
    }
  }

  calculateFees(amount: number): {
    jupiter: number;
    binance: number;
    total: number;
  } {
    const jupiterFee = amount * CONSTANTS.FEES.JUPITER;
    const binanceFee = amount * CONSTANTS.FEES.BINANCE;

    return {
      jupiter: jupiterFee,
      binance: binanceFee,
      total: jupiterFee + binanceFee
    };
  }
}
