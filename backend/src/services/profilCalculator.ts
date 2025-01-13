import axios from 'axios';

// Types for token information
interface JupiterToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

interface BinanceToken {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  isSpotTradingAllowed: boolean;
}

interface CommonToken {
  symbol: string;
  jupiterAddress: string;
  jupiterDecimals: number;
  binanceSymbol: string;
  logoURI?: string;
}

interface ProfitAnalysis {
  timestamp: Date;
  token: CommonToken;
  jupiterPrice: number;
  binancePrice: number;
  profitPercentage: number;
  volume24h?: number;
  direction: 'Jupiter→Binance' | 'Binance→Jupiter';
  estimatedProfit: number;
  fees: {
    jupiter: number;
    binance: number;
    total: number;
  };
}

class TokenProfitAnalyzer {
  private jupiterApi = 'https://token.jup.ag/all';
  private binanceApi = 'https://api.binance.com/api/v3';
  private commonTokens: CommonToken[] = [];

  // Fetch all available tokens from Jupiter
  private async fetchJupiterTokens(): Promise<JupiterToken[]> {
    try {
      const response = await axios.get(this.jupiterApi);
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

  // Fetch all available tokens from Binance
  private async fetchBinanceTokens(): Promise<BinanceToken[]> {
    try {
      const response = await axios.get(`${this.binanceApi}/exchangeInfo`);
      return response.data.symbols.filter((symbol: any) =>
        symbol.status === 'TRADING' &&
        symbol.isSpotTradingAllowed
      );
    } catch (error) {
      console.error('Error fetching Binance tokens:', error);
      throw error;
    }
  }

  // Find common tokens between Jupiter and Binance
  public async findCommonTokens(): Promise<CommonToken[]> {
    const [jupiterTokens, binanceTokens] = await Promise.all([
      this.fetchJupiterTokens(),
      this.fetchBinanceTokens()
    ]);

    const binanceSymbols = new Set(
      binanceTokens.map(token => token.baseAsset)
    );

    return this.commonTokens = jupiterTokens
      .flatMap(token =>
        binanceSymbols?.has(token.symbol) ? [{
          symbol: token.symbol,
          jupiterAddress: token.address,
          jupiterDecimals: token.decimals,
          binanceSymbol: token.symbol,
          logoURI: token.logoURI
        }]
          : []
      )
  }

  // Get Jupiter price for a token
  private async getJupiterPrice(
    inputMint: string,
    outputMint: string,
    amount: number
  ): Promise<number> {
    try {
      const response = await axios.get('https://quote-api.jup.ag/v6/quote', {
        params: {
          inputMint,
          outputMint,
          amount,
          slippageBps: 50
        }
      });
      return response.data.outAmount / response.data.inAmount;
    } catch (error) {
      console.error('Error getting Jupiter price:', error);
      throw error;
    }
  }

  // Get Binance price for a token
  private async getBinancePrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${this.binanceApi}/ticker/price`, {
        params: { symbol }
      });
      return parseFloat(response.data.price);
    } catch (error) {
      console.error('Error getting Binance price:', error);
      throw error;
    }
  }

  // Calculate fees
  private calculateFees(amount: number, token: CommonToken): {
    jupiter: number;
    binance: number;
    total: number;
  } {
    const jupiterFee = amount * 0.0035; // 0.35% Jupiter fee
    const binanceFee = amount * 0.001;  // 0.1% Binance fee

    return {
      jupiter: jupiterFee,
      binance: binanceFee,
      total: jupiterFee + binanceFee
    };
  }

  // Analyze profit opportunities for a specific token
  public async analyzeProfitOpportunity(
    token: CommonToken,
    amount: number
  ): Promise<ProfitAnalysis> {
    const [jupiterPrice, binancePrice] = await Promise.all([
      this.getJupiterPrice(
        token.jupiterAddress,
        'USDC', // Using USDC as quote currency
        amount
      ),
      this.getBinancePrice(`${token.symbol}USDC`)
    ]);

    const fees = this.calculateFees(amount, token);
    const priceDiff = Math.abs(jupiterPrice - binancePrice);
    const profitPercentage = (priceDiff / Math.min(jupiterPrice, binancePrice)) * 100;

    const direction = jupiterPrice < binancePrice ? 'Jupiter→Binance' : 'Binance→Jupiter';
    const estimatedProfit = (amount * priceDiff) - fees.total;

    return {
      timestamp: new Date(),
      token,
      jupiterPrice,
      binancePrice,
      profitPercentage,
      direction,
      estimatedProfit,
      fees
    };
  }

  // Analyze all common tokens for profit opportunities
  public async analyzeAllOpportunities(
    minAmount: number = 10
  ): Promise<ProfitAnalysis[]> {
    if (this.commonTokens.length === 0) {
      await this.findCommonTokens();
    }

    const opportunities: ProfitAnalysis[] = [];

    for (const token of this.commonTokens) {
      try {
        const analysis = await this.analyzeProfitOpportunity(token, minAmount);
        opportunities.push(analysis);
      } catch (error) {
        console.error(`Error analyzing ${token.symbol}:`, error);
        // continue;
        return []
      }
    }

    // Sort by profit percentage descending
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  }
}

// Example usage
async function example() {
  const analyzer = new TokenProfitAnalyzer();

  try {
    // Find common tokens
    console.log('Finding common tokens...');
    const commonTokens = await analyzer.findCommonTokens();
    console.log(`Found ${commonTokens.length} common tokens`);

    // Analyze all opportunities
    console.log('Analyzing profit opportunities...');
    const opportunities = await analyzer.analyzeAllOpportunities(1000); // Analysis for 1000 USDC

    // Display top 5 opportunities
    console.log('\nTop 5 profit opportunities:');
    opportunities.slice(0, 5).forEach(opp => {
      console.log(`
            Token: ${opp.token.symbol}
            Direction: ${opp.direction}
            Profit %: ${opp.profitPercentage.toFixed(2)}%
            Estimated Profit: $${opp.estimatedProfit.toFixed(2)}
            Jupiter Price: $${opp.jupiterPrice.toFixed(4)}
            Binance Price: $${opp.binancePrice.toFixed(4)}
            Total Fees: $${opp.fees.total.toFixed(2)}
            `);
    });
  } catch (error) {
    console.error('Error in example:', error);
  }
}

export default TokenProfitAnalyzer;
