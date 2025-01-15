import { Router } from "express";
import ArbitrageAnalyzer from "../services/arbitrage";
import { HistoricalDataService } from "../services/historicalService";
import { Interval } from "@binance/connector-typescript";
import { Binance } from "../services/binance";
import Raydium from "../services/raydium";

const router = Router();
const historicalService = new HistoricalDataService();

const binance = new Binance();
const rhydium = new Raydium();
const analyzer = new ArbitrageAnalyzer();

router.get("/arbitrage-opportunities", async (req, res) => {
  try {

    const [binancePrices, solanaPrices] = await Promise.all([
      binance.fetchBinancePrices(), rhydium.fetchRhydiumPrices()
    ])

    const opportunities = analyzer.findArbitrage(binancePrices, solanaPrices)

    res.send({
      status: true,
      data: {
        count: opportunities.length,
        opportunities
      }
    });
  } catch (err: any) {
    console.log("err", err?.message);
    res.send({
      status: false,
      message: "Internal server error"
    });
  }
});

router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { startTime, endTime } = req.query;

    const data = await historicalService.fetchCompleteHistoricalData(
      symbol,
      Interval["1h"],
      startTime ? Number(startTime) : undefined,
      endTime ? Number(endTime) : undefined
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

export default router;
