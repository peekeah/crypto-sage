import express from "express";
import { getEnv } from "./utils";
import axios from "axios";
import ProfitCalculator from "./services/profilCalculator";
import { ArbitrageAnalyzer } from "./services/arbitrageAnalyzer";

const port = getEnv("API_PORT", 5000);

const app = express();

app.use(express.json());

const analyzer = new ArbitrageAnalyzer();

app.get("/", async (req, res) => {
  try {
    // const response = await arbitrageService.findArbitrageOpportunities();
    // const price = await raydiumService.getMarketPrice(new PublicKey("CAgAeMD7quTdnr6RPa7JySQpjf3irAmefYNdTb6anemq"))

    const response = await analyzer.analyzeAllOpportunities(100,);

    res.send({
      message: "hello world!",
      data: {
        len: response?.length,
        response
      }
    })
  } catch (err: any) {
    console.log("err", err?.message)
    res.send({
      message: "Internal server error"
    })

  }
})

app.listen(port, () => console.log(`server listening on ${port}`))
