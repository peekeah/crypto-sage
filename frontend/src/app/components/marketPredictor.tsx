"use client";

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { chartMockData } from "@/mock";
import { Card, CardContent } from "@/components/ui/card";
import { timeStamp } from "console";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export type MarketData = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  indicators: {
    rsi: number;
    macd: {
      macd: number;
      signal: number;
      histogram: number;
    };
    bollinger: {
      upper: number;
      middle: number;
      lower: number;
    };
  };
};

interface Prediction {
  timestamp: number;
  currentPrice: number,
  prediction: {
    confidence: number;       // Confidence level of the prediction
    predictedPrice: number;   // Predicted price value
  };
};

export type Message = {
  type: "marketData" | "timeRange";
  data: MarketData;
  timestamp: number;
} | {
  type: "prediction";
  data: Prediction;
  timeStamp: number;
};

const MarketPredictor = () => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);

  /*
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimestamp = marketData[marketData.length - 1].timestamp + 60000; // 1-minute intervals
      const newMarketData = {
        timestamp: newTimestamp,
        open: Math.random() * (1.001 - 1) + 1, // Random open price
        high: Math.random() * (1.002 - 1.001) + 1.001,
        low: Math.random() * (1 - 0.9995) + 0.9995,
        close: Math.random() * (1.001 - 1) + 1,
        volume: Math.floor(Math.random() * 100000),
        indicators: {
          rsi: 0,
          macd: { macd: 0, signal: 0, histogram: 0 },
          bollinger: { upper: 0, middle: 0, lower: 0 },
        },
      };
      setMarketData((prevData) => [...prevData, newMarketData]);
    }, 2000); // Updates every 2 seconds
    return () => clearInterval(interval);
  }, [marketData]);
  */

  useEffect(() => {
    let socket: WebSocket;
    try {
      const URI = process.env.NEXT_APP_WS_URI || "ws://localhost:5000"
      socket = new WebSocket(URI)

      socket.onopen = () => {
        console.log("Websocket is connected")
      }
      socket.onmessage = (res) => {
        const message = JSON.parse(res?.data) as Message;
        if (message.type === "marketData") {
          const newMarketData = message.data;

          // Update marketData state with new data
          setMarketData((prevData) => {
            const lastTimestamp = prevData[prevData.length - 1]?.timestamp || 0;

            // Append only if the new data is more recent
            // if (newMarketData.timestamp > lastTimestamp) {
            return [...prevData, newMarketData];
            // }
            return prevData;
          });
        } else if (message.type === "prediction") {
          console.log("prediction:", message)
        } else {
          console.log("timeRange:", message)
        }
      }
    } catch (err) {
      console.log("Error while fetching", err)
    }
    return () => {
      socket?.close()
    }
  }, [])

  console.log("data", marketData)

  // Prepare data for the chart
  const labels = marketData.map((data) =>
    new Date(data.timestamp).toLocaleTimeString()
  );

  const openPrices = marketData.map((data) => data.open);
  const closePrices = marketData.map((data) => data.close);
  const highPrices = marketData.map((data) => data.high);
  const lowPrices = marketData.map((data) => data.low);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Open Price",
        data: openPrices,
        borderColor: "blue",
        backgroundColor: "rgba(0, 0, 255, 0.2)",
        fill: false,
      },
      {
        label: "Close Price",
        data: closePrices,
        borderColor: "green",
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        fill: false,
      },
      {
        label: "High Price",
        data: highPrices,
        borderColor: "red",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        fill: false,
      },
      {
        label: "Low Price",
        data: lowPrices,
        borderColor: "orange",
        backgroundColor: "rgba(255, 165, 0, 0.2)",
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Crypto Market Data",
      },
    },
    scales: {
      x: {
        type: "category",
        title: {
          display: true,
          text: "Time",
        },
      },
      y: {
        type: "linear",
        title: {
          display: true,
          text: "Price",
        },
      },
    },
  };

  return (
    <div>
      {/* Header */}
      <div className="pb-5">
        <div className="text-xl">Arbitrage Dashboard</div>
        <div>Real-time CEX/DEX opportunities</div>
      </div>
      {/* body */}
      <Card className="p-5 h-[700px]">
        <CardContent className="!w-full !h-full">
          <Line
            className="!h-full mx-auto"
            data={chartData}
            options={chartOptions}
          />
        </CardContent >
      </Card>
    </div>
  )
}

export default MarketPredictor;
