export interface BacktestResult {
  accuracy: number;
  profitLoss: number;
}

export const backtest = (
  predictions: number[],
  actuals: number[],
  closePrices: number[]
): BacktestResult => {
  let correct = 0;
  let profitLoss = 0;

  for (let i = 0; i < predictions.length; i++) {
    if (predictions[i] === actuals[i]) {
      correct++;
    }
    if (predictions[i] === 1) {
      profitLoss += closePrices[i + 1] - closePrices[i];
    } else {
      profitLoss -= closePrices[i + 1] - closePrices[i];
    }
  }

  return {
    accuracy: (correct / predictions.length) * 100,
    profitLoss,
  };
};
