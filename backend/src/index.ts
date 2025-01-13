import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { getEnv } from "./utils";
import { ArbitrageAnalyzer } from "./services/arbitrageAnalyzer";
import { BinanceService } from "./services/binanceService";
import { PricePredictor } from "./ml/predictor";
import { HistoricalDataService } from "./services/historicalService";
import { DataManagerService } from "./services/datamanagerService";
import { WebSocketManager } from "./services/websocketManager";
import { Interval } from "@binance/connector-typescript";

const port = getEnv("API_PORT", 5000);

const app = express();
app.use(express.json());
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });
const wsManager = new WebSocketManager(wss);

const binanceService = new BinanceService();
const historicalService = new HistoricalDataService();
const dataManager = new DataManagerService();
const predictor = new PricePredictor();
const analyzer = new ArbitrageAnalyzer();

// Existing REST endpoints
app.get("/", (req, res) => {
  res.send({
    message: "Crypto analyzer"
  });
});

app.get("/health", (req, res) => {
  res.send({
    status: true,
    message: "App is up"
  });
});

app.get("/scan-tokens", async (req, res) => {
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

app.get('/api/historical/:symbol', async (req, res) => {
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

// Initialize WebSocket data streaming
async function initializeDataStreaming() {
  try {
    // Get available USDC pairs
    const usdcPairs = await binanceService.getAllUSDCPairs();
    console.log('Monitoring pairs:', usdcPairs);

    // Initialize historical data for each pair
    await Promise.all(usdcPairs.map(async (pair) => {
      try {
        const historicalData = await historicalService.fetchCompleteHistoricalData(
          pair,
          Interval["1h"],
          Date.now() - (30 * 24 * 60 * 60 * 1000)
        );

        dataManager.addHistoricalData(pair, historicalData);

        // Broadcast initial historical data
        wsManager.broadcast(historicalData, 'historical', pair);
      } catch (error) {
        console.error(`Error initializing ${pair}:`, error);
      }
    }));

    // Subscribe to real-time market data
    const marketDataStream = binanceService.subscribeToMarketData(usdcPairs);

    // Handle real-time updates
    marketDataStream.on('kline', async (data) => {
      try {
        // Update data manager
        dataManager.updateRealtimeData(data.symbol, data);

        // Get complete dataset
        const completeData = dataManager.getSymbolData(data.symbol);

        // Generate new prediction
        const prediction = await predictor.predict({
          raw: completeData,
          processed: completeData
        });

        // Broadcast market data update
        wsManager.broadcast(data, 'marketData', data.symbol);

        // Broadcast prediction
        wsManager.broadcast({
          prediction,
          currentPrice: data.close,
          timestamp: data.timestamp
        }, 'prediction', data.symbol);

        // Broadcast time range update
        wsManager.broadcast(
          dataManager.getTimeRange(data.symbol),
          'timeRange',
          data.symbol
        );

      } catch (error) {
        console.error('Error processing real-time data:', error);
      }
    });

  } catch (error) {
    console.error('Error initializing data streaming:', error);
  }
}

// Start server and initialize data streaming
server.listen(port, async () => {
  console.log('Server running on port', port);
  await initializeDataStreaming();
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  binanceService.closeAllConnections();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
