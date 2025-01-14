"use client";

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Message } from './marketPredictor';

// Generate dummy data
const generateDummyData = (count) => {
  const basePrice = 100;
  const data = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * 1000;
    const open = basePrice + Math.random() * 10 - 5;
    const close = open + Math.random() * 4 - 2;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;

    data.push({
      timestamp,
      price: close,
      prediction: close + (Math.random() * 4 - 2),
    });
  }
  return data;
};

interface ChartData {
  timestamp: number;
  price: number;
  prediction: number;
}

const TradingChart = () => {
  // const [data, setData] = useState(generateDummyData(50));
  const [data, setData] = useState<ChartData[]>([]);

  /*
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newDataPoint = generateDummyData(1)[0];
        return [...prevData.slice(1), newDataPoint];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);
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

          setData((prevData) => {
            return [...prevData, {
              timestamp: newMarketData.timestamp,
              price: newMarketData.close,
              prediction: newMarketData.close + 1
            }];
          });
        } else if (message.type === "prediction") {
          return
          const newMarketData = message.data;
          console.log("new:", newMarketData)
          setData((prevData) => {
            return [...prevData, {
              timeStamp: newMarketData.timestamp,
              price: newMarketData.currentPrice,
              prediction: newMarketData.prediction.predictedPrice,
            }]
          })
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-bold">Time: {new Date(label).toLocaleTimeString()}</p>
          <p>Price: ${payload[0].value.toFixed(2)}</p>
          <p>Prediction: ${payload[1].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Real-time Trading Data with Predictions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
              />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Real-time price line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#2563eb"
                dot={false}
                name="Current Price"
                strokeWidth={2}
                isAnimationActive={false}
              />

              {/* Prediction line */}
              <Line
                type="monotone"
                dataKey="prediction"
                stroke="#16a34a"
                strokeDasharray="5 5"
                dot={false}
                name="Prediction"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingChart;
