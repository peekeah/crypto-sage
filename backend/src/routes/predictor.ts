import { Router } from "express";
import { Binance } from "../services/binance";
import { Interval } from "@binance/connector-typescript";
import { Model } from "../ml/model";
import { backtest } from "../backtest/backtesting";
import Preprocessor from "../ml/preprocessor";

const router = Router();

const binance = new Binance();
const MlModel = new Model();
const preprocessor = new Preprocessor();

// Endpoint to fetch historical data
router.get('/data/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { interval = '1h', limit = 500 } = req.query;
  try {
    const data = await binance.fetchHistoricalData(symbol, interval as Interval, parseInt(limit as string));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' });
  }
});

// Endpoint to train the model and get predictions
router.post('/predict', async (req, res) => {
  const { symbol, interval = '1h', limit = 500, lookback = 10 } = req.body;

  try {
    // Fetch historical data and preprocess it
    const data = await binance.fetchHistoricalData(symbol, interval, limit);
    const { X, y } = preprocessor.prepareDataset(data, lookback);

    // Train the model
    const model = MlModel.createModel(lookback);
    await MlModel.trainModel(model, X, y);

    // Make predictions
    const predictions = MlModel.predict(model, X);
    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ error: 'Error predicting data' });
  }
});

// Endpoint to backtest the model
router.post('/backtest', async (req, res) => {
  const { predictions, actuals, closePrices } = req.body;

  try {
    const results = backtest(predictions, actuals, closePrices);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Error running backtest' });
  }
});

export default router;
