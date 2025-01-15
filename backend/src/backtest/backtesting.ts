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

  // Ensure predictions align with actuals and closePrices
  const trimmedPredictions = predictions.slice(0, closePrices.length - 1);

  for (let i = 0; i < trimmedPredictions.length; i++) {
    // Calculate accuracy
    if (trimmedPredictions[i] === actuals[i]) {
      correct++;
    }

    // Calculate profit/loss based on predictions
    if (trimmedPredictions[i] === 1) {
      // Predicted up
      profitLoss += closePrices[i + 1] - closePrices[i];
    } else {
      // Predicted down
      profitLoss -= closePrices[i + 1] - closePrices[i];
    }
  }

  return {
    accuracy: (correct / trimmedPredictions.length) * 100,
    profitLoss,
  };
};
