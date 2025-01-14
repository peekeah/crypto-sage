import express from "express";
import cors from "cors";
import { createServer } from "http";
import predictorRouter from "./routes/predictor";
import scannerRouter from "./routes/scanner";
import { CONFIG } from "./config";

const port = CONFIG.SERVER.API_PORT;

const app = express();
app.use(express.json());
app.use(cors());

const server = createServer(app);

// Existing REST endpoints
app.get("/", (req, res) => {
  res.send({
    message: "Crypto analyzer"
  });
});

app.get("/api/health", (req, res) => {
  res.send({
    status: true,
    message: "App is up"
  });
});

app.use("/api/scanner", scannerRouter)
app.use("/api/predictor", predictorRouter)

// Start server
server.listen(port, async () => {
  console.log('Server running on port', port);
});

