class Preprocessor {

  private normalizeData(data: number[]): number[] {
    const max = Math.max(...data);
    const min = Math.min(...data);
    return data.map((value) => (value - min) / (max - min));
  };

  prepareDataset(
    klines: { close: string }[],
    lookback: number
  ): { X: number[][]; y: number[] } {
    const closePrices = klines.map((k) => parseFloat(k.close));
    const normalizedPrices = this.normalizeData(closePrices);

    const X: number[][] = [];
    const y: number[] = [];

    for (let i = 0; i < normalizedPrices.length - lookback; i++) {
      X.push(normalizedPrices.slice(i, i + lookback));
      y.push(normalizedPrices[i + lookback] > normalizedPrices[i + lookback - 1] ? 1 : 0);
    }

    return { X, y };
  };
}

export default Preprocessor;
