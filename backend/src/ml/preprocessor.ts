// Define types for the data structure
interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  [key: string]: number;
}

// Simple StandardScaler implementation
class StandardScaler {
  private mean: number[] = [];
  private std: number[] = [];

  fit(data: number[][]): void {
    const numFeatures = data[0].length;
    this.mean = new Array(numFeatures).fill(0);
    this.std = new Array(numFeatures).fill(0);

    // Calculate mean for each feature
    for (let i = 0; i < numFeatures; i++) {
      this.mean[i] = data.reduce((sum, row) => sum + row[i], 0) / data.length;
    }

    // Calculate standard deviation for each feature
    for (let i = 0; i < numFeatures; i++) {
      this.std[i] = Math.sqrt(
        data.reduce((sum, row) => sum + Math.pow(row[i] - this.mean[i], 2), 0) / data.length
      );
    }
  }

  transform(data: number[][]): number[][] {
    return data.map(row =>
      row.map((val, i) => (val - this.mean[i]) / (this.std[i] || 1))
    );
  }

  fitTransform(data: number[][]): number[][] {
    this.fit(data);
    return this.transform(data);
  }
}

export class DataPreprocessor {
  private static scaler = new StandardScaler();

  /**
   * Process financial candle data for machine learning
   * @param data Array of candle data with OHLCV values
   * @returns Object containing both raw and processed data
   * @throws Error if data doesn't meet requirements
   */
  static process(data: CandleData[]): {
    raw: CandleData[];
    processed: number[][];
  } {
    // Validate input data
    if (!Array.isArray(data)) {
      throw new Error('Input must be an array');
    }

    // Ensure we have exactly 24 data points
    if (data.length !== 24) {
      throw new Error(`Insufficient data points. Expected 24, got ${data.length}`);
    }

    // Validate each candle has required properties
    data.forEach((candle, index) => {
      const requiredProps = ['open', 'high', 'low', 'close', 'volume'];
      requiredProps.forEach(prop => {
        if (!(prop in candle)) {
          throw new Error(`Missing ${prop} in candle at index ${index}`);
        }
        if (typeof candle[prop] !== 'number' || isNaN(candle[prop])) {
          throw new Error(`Invalid ${prop} value in candle at index ${index}`);
        }
      });
    });

    // Extract features
    const features = data.map(candle => [
      candle.open,
      candle.high,
      candle.low,
      candle.close,
      candle.volume
    ]);

    // Scale features
    const scaledFeatures = this.scaler.fitTransform(features);

    // Verify shape after scaling
    if (scaledFeatures.length !== 24 || scaledFeatures[0].length !== 5) {
      throw new Error(
        `Invalid shape after scaling. Expected [24, 5], got [${scaledFeatures.length}, ${scaledFeatures[0]?.length}]`
      );
    }

    return {
      raw: data,
      processed: scaledFeatures
    };
  }
}
