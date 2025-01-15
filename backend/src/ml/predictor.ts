import * as tf from "@tensorflow/tfjs-node";
import { CandleData } from "../types/prediction";

export class PricePredictor {
  private model: tf.LayersModel;
  private readonly WINDOW_SIZE = 24;
  private readonly FEATURE_COUNT = 5;  // OHLCV = 5 features

  constructor() {
    this.model = this.buildModel();
  }

  private buildModel() {
    const model = tf.sequential();

    model.add(tf.layers.lstm({
      units: 50,
      returnSequences: true,
      inputShape: [24, 5]
    }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.lstm({
      units: 50,
      returnSequences: false
    }));
    model.add(tf.layers.dense({
      units: 1,
      activation: 'linear'
    }));

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    return model;
  }

  private validateCandle(candle: any, index: number): asserts candle is CandleData {
    if (!candle) {
      throw new Error(`Missing candle data at index ${index}`);
    }

    const requiredFeatures = ['open', 'high', 'low', 'close', 'volume'];
    for (const feature of requiredFeatures) {
      if (typeof candle[feature] !== 'number' || isNaN(candle[feature])) {
        throw new Error(`Invalid or missing ${feature} at index ${index}. Got: ${candle[feature]}`);
      }
    }
  }

  private extractFeatures(data: CandleData[]): number[][] {
    return data.map((candle, index) => {
      // Validate each candle before extracting features
      this.validateCandle(candle, index);

      const features = [
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume
      ];

      // Verify feature count
      if (features.length !== this.FEATURE_COUNT) {
        throw new Error(`Invalid feature count. Expected ${this.FEATURE_COUNT}, got ${features.length}`);
      }

      return features;
    });
  }

  async predict(data: any) {
    try {
      // Ensure we have the correct window size
      const windowData = data.processed.slice(-this.WINDOW_SIZE);

      if (!Array.isArray(windowData) || windowData.length !== 24) {
        throw new Error(`Invalid window size. Expected 24, got ${windowData?.length}`);
      }

      const features = this.extractFeatures(windowData)
      const processed = {
        raw: windowData,
        processed: features.map(feature => {
          if (feature.length !== this.FEATURE_COUNT) {
            throw new Error(`Invalid feature count. Expected ${this.FEATURE_COUNT}, got ${feature.length}`);
          }
          return feature;
        })
      }

      // Reshape the data into the correct format [1, 24, 5]
      const reshapedData = processed.processed.map(timestep => {
        if (!Array.isArray(timestep) || timestep.length !== 5) {
          throw new Error(`Invalid feature count. Expected 5, got ${timestep?.length}`);
        }
        return timestep;
      });

      // Create tensor with explicit shape
      const tensorData = tf.tensor3d([reshapedData], [1, 24, 5]);

      // Make prediction
      const prediction = this.model.predict(tensorData) as tf.Tensor;
      const predictionData = await prediction.data();

      // Cleanup
      tensorData.dispose();
      prediction.dispose();

      return {
        predictedPrice: predictionData[0],
        confidence: this.calculateConfidence(data.raw, predictionData[0])
      };
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  private calculateConfidence(historicalData: any[], prediction: number) {
    const recentPrices = historicalData.slice(-24).map(d => d.close);
    const volatility = this.calculateVolatility(recentPrices);
    return Math.max(0, Math.min(1, 1 - volatility));
  }

  private calculateVolatility(prices: number[]) {
    const returns = prices.slice(1).map((price, i) =>
      (price - prices[i]) / prices[i]
    );
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }
}
