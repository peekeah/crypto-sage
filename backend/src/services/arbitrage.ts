class ArbitrageAnalyzer {

  findArbitrage(
    binancePrices: { [symbol: string]: number },
    solanaPrices: { [symbol: string]: number },
    binanceFeePercentage: number = 0.001, // Default to 0.1% fee for Binance
    solanaFeePercentage: number = 0.003, // Default to 0.3% fee for Solana
    slippagePercentage: number = 0.005 // Default to 0.5% slippage
  ): {
    symbol: string;
    exchangeA: string;
    priceA: number;
    exchangeB: string;
    priceB: number;
    profit: number;
    profitPercentage: number;
  }[] {
    const opportunities = [];

    // Iterate through each symbol to find arbitrage opportunities
    for (const symbol in binancePrices) {
      const binancePrice = binancePrices[symbol];
      const solanaPrice = solanaPrices[symbol];

      // Ensure both prices are valid
      if (solanaPrice && binancePrice) {
        // Apply slippage to both prices
        const binancePriceWithSlippage = binancePrice * (1 + slippagePercentage);
        const solanaPriceWithSlippage = solanaPrice * (1 - slippagePercentage);

        // Calculate fees
        const binanceFee = binancePrice * binanceFeePercentage;
        const solanaFee = solanaPrice * solanaFeePercentage;

        // Calculate profit for arbitrage between exchanges
        const profitBuyOnBinance = solanaPriceWithSlippage - binancePriceWithSlippage - binanceFee - solanaFee;
        const profitBuyOnSolana = binancePriceWithSlippage - solanaPriceWithSlippage - binanceFee - solanaFee;

        // Calculate profit percentages
        const profitPercentageBuyOnBinance = profitBuyOnBinance / binancePriceWithSlippage * 100;
        const profitPercentageBuyOnSolana = profitBuyOnSolana / solanaPriceWithSlippage * 100;

        // If there's a profitable opportunity, push it to the results
        if (profitBuyOnBinance > 0 && profitPercentageBuyOnBinance <= 25) {
          opportunities.push({
            symbol,
            exchangeA: 'Binance',
            priceA: binancePriceWithSlippage,
            exchangeB: 'Raydium',
            priceB: solanaPriceWithSlippage,
            profit: profitBuyOnBinance,
            profitPercentage: +profitPercentageBuyOnBinance?.toFixed(2),
          });
        }

        if (profitBuyOnSolana > 0 && profitPercentageBuyOnSolana <= 25) {
          opportunities.push({
            symbol,
            exchangeA: 'Raydium',
            priceA: solanaPriceWithSlippage,
            exchangeB: 'Binance',
            priceB: binancePriceWithSlippage,
            profit: profitBuyOnSolana,
            profitPercentage: +profitPercentageBuyOnSolana?.toFixed(2),
          });
        }
      }
    }

    return opportunities;
  }
}

export default ArbitrageAnalyzer;
