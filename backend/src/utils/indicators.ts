export function calculateRSI(prices: number[], period: number = 14): number[] {
  const gains: number[] = [];
  const losses: number[] = [];
  const rsi: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate RSI
  for (let i = period; i < prices.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;

    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
) {
  const macdResult = [];
  const ema12 = calculateEMA(prices, fastPeriod);
  const ema26 = calculateEMA(prices, slowPeriod);

  // Calculate MACD line
  const macdLine = ema12.map((fast, i) => fast - ema26[i]);

  // Calculate signal line
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Calculate histogram
  for (let i = 0; i < macdLine.length; i++) {
    macdResult.push({
      macd: macdLine[i],
      signal: signalLine[i],
      histogram: macdLine[i] - signalLine[i]
    });
  }

  return macdResult;
}

export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  standardDeviations: number = 2
) {
  const bands = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map(price => Math.pow(price - sma, 2));
    const standardDeviation = Math.sqrt(
      squaredDiffs.reduce((a, b) => a + b, 0) / period
    );

    bands.push({
      upper: sma + standardDeviation * standardDeviations,
      middle: sma,
      lower: sma - standardDeviation * standardDeviations
    });
  }
  return bands;
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA
  let sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(sma);

  // Calculate EMA
  for (let i = period; i < prices.length; i++) {
    ema.push(
      (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
    );
  }

  return ema;
}
