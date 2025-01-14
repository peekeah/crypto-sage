import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ArbitrageCalculator from "./components/arbitrageCalculator";
import MarketPredictor from "./components/marketPredictor";

export default function Home() {
  return (
    <div className="bg-slate-50 h-screen">
      <Tabs
        className="w-full px-10 py-7 space-y-5"
        defaultValue="scanner"
      >
        <TabsList className="grid grid-cols-2 max-w-[400px]">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="predictor">Predictor</TabsTrigger>
        </TabsList>
        <TabsContent value="scanner">
          <ArbitrageCalculator />
        </TabsContent>
        <TabsContent value="predictor">
          <MarketPredictor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
