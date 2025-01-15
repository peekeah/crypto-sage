"use client";

import React, { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { tokens } from "@/constant";

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

const fetchPredictions = async (token: string): Promise<FetchPredictionsResponse> => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URI;
  const predictPayload = {
    symbol: token,
    interval: "1h",
    limit: 500,
    lookback: 10,
  };

  try {
    // Fetch historical data
    const historicalData = await axios
      .get(`${BASE_URL}/api/predictor/data/${predictPayload.symbol}`, {
        params: { interval: predictPayload.interval, limit: predictPayload.limit },
      })
      .then((res) => res.data as PriceData[]);

    // Prepare actual prices and close prices
    const actualPrices = historicalData.map((item) => ({
      time: new Date(item.openTime).toLocaleTimeString(),
      actualPrice: parseFloat(item.close),
    }));
    const closePrices = historicalData.map((item) => parseFloat(item.close));

    // Calculate actual movements (0 = down, 1 = up)
    const actuals: number[] = [];
    for (let i = predictPayload.lookback; i < closePrices.length; i++) {
      actuals.push(closePrices[i] > closePrices[i - 1] ? 1 : 0);
    }

    // Fetch predictions
    const predictions = await axios
      .post(`${BASE_URL}/api/predictor/predict`, predictPayload)
      .then((res) => res.data.predictions as number[]);

    // Ensure predictions align with actual data length
    const trimmedPredictions = predictions.slice(0, actuals.length);

    // Prepare chart data
    const chartData = actualPrices.slice(predictPayload.lookback).map((item, index) => ({
      ...item,
      predictedMovement: trimmedPredictions[index] || 0,
      predictedPrice: trimmedPredictions[index] === 1
        ? item.actualPrice * (1 + Math.random() * 0.02) // Simulate upward movement
        : item.actualPrice * (1 - Math.random() * 0.02), // Simulate downward movement
    }));

    // Perform backtest
    const backtestResponse = await axios.post(`${BASE_URL}/api/predictor/backtest`, {
      predictions: trimmedPredictions,
      actuals,
      closePrices: closePrices.slice(predictPayload.lookback),
    });

    const backtestData = backtestResponse.data as BacktestData;

    // Return chart data and backtest results
    return { chartData, backtestData };
  } catch (error) {
    console.error("Error fetching predictions:", error);
    return {
      chartData: [],
      backtestData: { accuracy: 0, profitLoss: 0 },
    };
  }
};


const MarketPredictor = () => {

  const firstRender = useRef(true);
  const [selectedToken, setSelectedToken] = useState(tokens[0]?.value);

  const {
    data,
    error,
    isPending: isLoading,
    mutate
  } = useMutation({
    mutationFn: () => fetchPredictions(selectedToken)
  })

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
    } else {
      mutate();
    }
  }, [selectedToken])

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
          <div className="flex justify-between w-full">
            <div>
              <div className="text-xl">Test result</div>
              <div className="flex gap-5">
                <div>Accuracy: {backtestData.accuracy?.toFixed(2)}%</div>
                <div>Profit/Loss: {backtestData.profitLoss.toFixed(2)}</div>
              </div>
            </div>
            <div>
              <Select
                value={selectedToken}
                onValueChange={(value) => {
                  setSelectedToken(value);
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={selectedToken} />
                </SelectTrigger>
                <SelectContent>
                  {
                    tokens.map(token => (
                      <SelectItem
                        key={token.value}
                        value={token.value}
                      >{token.label}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
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
    </div >
  );
};

export default MarketPredictor;
