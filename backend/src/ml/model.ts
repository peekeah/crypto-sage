import * as tf from "@tensorflow/tfjs-node";

export class Model {
  createModel(inputShape: number): tf.LayersModel {
    const model = tf.sequential();
    model.add(
      tf.layers.lstm({
        units: 50,
        activation: "relu",
        inputShape: [inputShape, 1],
        returnSequences: false,
      })
    );
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
    model.compile({ optimizer: "adam", loss: "binaryCrossentropy", metrics: ["accuracy"] });

    return model;
  };

  async trainModel(
    model: tf.LayersModel,
    X: number[][],
    y: number[]
  ): Promise<tf.History> {
    const inputTensor = tf.tensor3d(X.map((x) => x.map((val) => [val])));
    const outputTensor = tf.tensor2d(y, [y.length, 1]);

    return await model.fit(inputTensor, outputTensor, {
      epochs: 20,
      batchSize: 32,
      validationSplit: 0.2,
    });
  };

  predict(model: tf.LayersModel, data: number[][]): number[] {

    const inputTensor = tf.tensor3d(data.map((x) => x.map((val) => [val])));

    // Ensure predict returns a single tensor
    const predictionTensor = model.predict(inputTensor) as tf.Tensor<tf.Rank>;

    // Convert tensor to array and ensure its type is explicitly `number[][]`
    const predictions = predictionTensor.arraySync() as number[][];

    // Map the predictions to binary outputs
    return predictions.map((pred) => (pred[0] > 0.5 ? 1 : 0));

  };
}

