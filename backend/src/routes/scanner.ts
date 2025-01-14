import { Router } from "express";
import { ArbitrageAnalyzer } from "../services/arbitrageAnalyzer";
import { HistoricalDataService } from "../services/historicalService";
import { Interval } from "@binance/connector-typescript";

const router = Router();
const analyzer = new ArbitrageAnalyzer();
const historicalService = new HistoricalDataService();

router.get("/arbitrage-opportunities", async (req, res) => {
  try {
    const response = await analyzer.analyzeAllOpportunities(100);
    res.send({
      status: true,
      data: {
        count: response?.length,
        opportunities: response
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
