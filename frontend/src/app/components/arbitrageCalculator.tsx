"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { RefreshCw } from "lucide-react";

interface Token {
  symbol: string;
  jupiterAddress: string;
  jupiterDecimals: number;
  binanceSymbol: string;
  logoURI: string;
}

interface Fees {
  jupiter: number;
  binance: number;
  total: number;
}

interface ArbitrageOpportunity {
  token: Token;
  jupiterPrice: number;
  binancePrice: number;
  profitPercentage: number;
  direction: string;  // Can be "Jupiter→Binance" or "Binance→Jupiter"
  estimatedProfitUSD: number;
  timestamp: string;
  fees: Fees;
}

const fetchArbitrageOpportunities = async () => {
  const API_URI = process.env.API_URI || "http://localhost:5000";
  const response = await axios.get(`${API_URI}/api/scanner/arbitrage-opportunities`);
  return response.data;
};

const ArbitrageCalculator = () => {

  const { data, error, isLoading } = useQuery({
    queryKey: ["arbitrageOpportunities"],
    queryFn: fetchArbitrageOpportunities,
  });

  const opportunities = data?.data?.opportunities as ArbitrageOpportunity[];

  return (
    <div className="h-screen bg-slate-50">
      {/* Header */}
      <div>
        <div className="text-xl">Arbitrage Dashboard</div>
        <div>Real-time CEX/DEX opportunities</div>
      </div>
      {/* body */}
      <div className="my-5">
        <Card className="p-5">
          <div className="flex justify-between">
            <CardHeader>
              <CardTitle>Live Opportunities</CardTitle>
              <CardDescription>Real-time arbitrage opportunities across exchanges</CardDescription>
            </CardHeader>
            <CardHeader>
              <Button
                disabled={isLoading}
              >
                <RefreshCw /> Refresh
              </Button>
            </CardHeader>
          </div>
          <CardContent
            className={
              cn(
                "space-y-5 gap-5 h-full w-full",
                !isLoading ? "grid grid-cols-2" : ""
              )
            }
          >
            {
              error ? (
                <div className="h-[600px] text-xl">Please refresh the page</div>
              )
                : (
                  isLoading ? (
                    <div className="w-full h-[600px] flex justify-center items-center">
                      <Spinner />
                    </div>
                  )
                    : (
                      opportunities?.map((item, index) => {
                        const token = item.token.symbol;
                        const profit = item.profitPercentage;

                        let exchangeA, exchangeB, exchangeAPrice, exchangeBPrice;

                        if (item.direction === "Jupiter→Binance") {
                          exchangeA = "Jupiter";
                          exchangeB = "Binance";
                          exchangeAPrice = item.jupiterPrice;
                          exchangeBPrice = item.binancePrice;
                        } else {
                          exchangeA = "Binance";
                          exchangeB = "Jupiter";
                          exchangeAPrice = item.binancePrice;
                          exchangeBPrice = item.jupiterPrice;
                        }

                        console.log({
                          token, exchangeA, exchangeAPrice, exchangeB, exchangeBPrice, profit
                        })

                        return (
                          <Card key={token + index}
                            className="px-3 py-2 !m-0"
                          >
                            <CardContent className="!p-5 m-0">
                              <CardTitle className="pb-2">{token + "/USDC"}</CardTitle>
                              <div className="flex w-full justify-between">
                                <div className="flex gap-3">
                                  <div>
                                    <CardDescription>{exchangeA}</CardDescription>
                                    <div>{exchangeAPrice}</div>
                                  </div>
                                  <div>
                                    <CardDescription>{exchangeB}</CardDescription>
                                    <div>{exchangeBPrice}</div>
                                  </div>
                                </div>
                                <div className="font-semibold text-green-700">
                                  {profit} Profit
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                    )
                )
            }
          </CardContent>
        </Card>
      </div>
    </div >
  )
}

export default ArbitrageCalculator;
