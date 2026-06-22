import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { startDerivConnection, subscribeToCandles } from "./server/data_pipeline.js";
import { getSignal } from "./server/signal_engine.js";
import { getRecentSignals } from "./server/db.js";
import { SUPPORTED_SYMBOLS, TIMEFRAMES, EXPIRATIONS } from "./server/config.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize background data ingestion
  startDerivConnection();

  // API Routes MUST be defined before Vite middleware
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/config", (req, res) => {
    res.json({
      symbols: SUPPORTED_SYMBOLS,
      timeframes: TIMEFRAMES,
      expirations: EXPIRATIONS
    });
  });

  app.post("/api/subscribe", (req, res) => {
    const { symbol, timeframe } = req.body;
    if (!symbol || !timeframe) return res.status(400).json({ error: "Missing symbol or timeframe" });
    
    // Asynchronously begin pulling data from Deriv WS
    subscribeToCandles(symbol, Number(timeframe));
    res.json({ status: "subscribed", symbol, timeframe });
  });

  app.post("/api/signal", async (req, res) => {
    const { symbol, timeframe, expiration } = req.body;
    
    if (!symbol || !timeframe || !expiration) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const result = await getSignal(symbol, Number(timeframe), expiration);
    res.json(result);
  });

  app.get("/api/history", (req, res) => {
    try {
      const logs = getRecentSignals.all();
      res.json(logs);
    } catch(e) {
      res.json([]);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
