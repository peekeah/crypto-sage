"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";

// Data interface for storing prices and predictions
interface ChartData {
  time: string;
  actualPrice: number;
  predictedPrice: number;
  predictedMovement: number; // 0 for down, 1 for up (binary prediction)
}

// Interface for the backtest result data
interface BacktestData {
  accuracy: number;
  profitLoss: number;
}

interface FetchPredictionsResponse {
  chartData: ChartData[];
  backtestData: BacktestData;
}

interface PriceData {
  openTime: number;  // Timestamp for when the market opened
  open: string;      // The opening price as a string (e.g., "95812.63000000")
  high: string;      // The highest price during the period as a string (e.g., "95963.86000000")
  low: string;       // The lowest price during the period as a string (e.g., "95625.00000000")
  close: string;     // The closing price as a string (e.g., "95821.92000000")
  volume: string;    // The total volume of the asset traded during the period as a string (e.g., "326.30061000")
  closeTime: number; // Timestamp for when the market closed
}

const fetchPredictions = async (): Promise<FetchPredictionsResponse> => {
  const URI = process.env.NEXT_PUBLIC_API_URI;
  try {
    // Fetch historical data (actual prices)
    const dataResponse = await axios.get(`${URI}/api/predictor/data/BTCUSDT`);
    const historicalData = dataResponse.data as PriceData[];

    // Prepare historical data
    const actualPrices = historicalData.map((item) => ({
      time: new Date(item.openTime).toLocaleTimeString(),
      actualPrice: parseFloat(item.close), // Close price is used here
    }));

    // Fetch predictions for price movements (up or down)
    const predictionResponse = await axios.post(`${URI}/api/predictor/predict`, {
      symbol: "BTCUSDT",
      interval: "1h",
      limit: 500,
      lookback: 10,
    });

    const predictions = predictionResponse.data.predictions; // Expecting array of 0s and 1s

    // Prepare chart data by combining actual prices and predictions
    const processedData = actualPrices.map((item, index) => ({
      ...item,
      predictedMovement: predictions[index] || 0, // 0 or 1 indicating down or up
      predictedPrice: predictions[index] === 1
        ? item.actualPrice * (1 + Math.random() * 0.02) // Simulate an up prediction
        : item.actualPrice * (1 - Math.random() * 0.02), // Simulate a down prediction
    }));

    // Optionally, send data for backtesting if required
    const backtestResponse = await axios.post(`${URI}/api/predictor/backtest`, {
      predictions: predictions,
      actuals: actualPrices.map((el) => el.actualPrice),
      closePrices: actualPrices.map((el) => el.actualPrice),
    });

    console.log("Backtest Results:", backtestResponse.data);
    const backtestData: BacktestData = backtestResponse.data;

    // Update state with processed data
    return {
      chartData: processedData,
      backtestData
    };
  } catch (error) {
    console.error("Error fetching data or predictions:", error);
    return {
      chartData: [],
      backtestData: { accuracy: 0, profitLoss: 0 }
    }
  }
};

const MarketPredictor = () => {

  const { data, error, isLoading } = useQuery<FetchPredictionsResponse>({
    queryKey: ["marketPredictor"],
    queryFn: fetchPredictions,
  });

  const chartData = data?.chartData || [];
  const backtestData = data?.backtestData || { accuracy: 0, profitLoss: 0 }

  return (
    <div className="w-full">
      <div>
        <div className="text-xl">Token Prediction</div>
        <div>Crypto prediction & backtesting</div>
      </div>

      <Card className="p-5 py-8 my-5">
        <CardContent className="space-y-8 h-[600px]">
          <div>
            <div className="text-xl">Test result</div>
            <div className="flex gap-5">
              <div>Accuracy: {backtestData.accuracy}</div>
              <div>Profit/Loss: {backtestData.profitLoss.toFixed(2)}</div>
            </div>
          </div>
          {
            isLoading ? (
              <div className="w-full h-[600px] flex justify-center items-center">
                <Spinner />
              </div>
            ) :
              (
                error ?
                  <div className="h-[450px]">Please reload page</div> :
                  <ResponsiveContainer className="h-full w-full pb-16">
                    <LineChart data={chartData} className="h-[450px]">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis
                        domain={['auto', 'auto']}
                        tickCount={6}
                        padding={{ top: 20, bottom: 20 }}
                        tickFormatter={(value) => value.toFixed(2)}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="actualPrice"
                        stroke="#8884d8"
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="predictedPrice"
                        stroke="#82ca9d"
                        dot={false}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
              )
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketPredictor;
