import { PricePredictor } from "../ml/predictor";
import { DataPreprocessor } from "../ml/preprocessor";

export class BacktestEngine {
  async runBacktest(historicalData: any[], predictor: PricePredictor) {
    const results = [];
    const windowSize = 24; // Hours to use for each prediction

    for (let i = windowSize; i < historicalData.length - 1; i++) {
      const windowData = historicalData.slice(i - windowSize, i);
      const prediction = await predictor.predict({
        raw: windowData,
        processed: DataPreprocessor.process(windowData).processed
      });

      const actualPrice = historicalData[i + 1].close;
      const predictedDirection = prediction.predictedPrice > historicalData[i].close;
      const actualDirection = actualPrice > historicalData[i].close;

      results.push({
        timestamp: historicalData[i].timestamp,
        predicted: prediction.predictedPrice,
        actual: actualPrice,
        confidence: prediction.confidence,
        correct: predictedDirection === actualDirection
      });
    }

    return this.calculateMetrics(results);
  }

  private calculateMetrics(results: any[]) {
    const accuracy = results.filter(r => r.correct).length / results.length;
    const highConfidenceResults = results.filter(r => r.confidence > 0.7);
    const highConfidenceAccuracy =
      highConfidenceResults.filter(r => r.correct).length / highConfidenceResults.length;

    return {
      accuracy,
      highConfidenceAccuracy,
      totalPredictions: results.length,
      results
    };
  }
}
