import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
export const APP_ID = process.env.DERIV_APP_ID || "1089"; // 1089 is a generic app id
export const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

// Supported Symbols
export const SUPPORTED_SYMBOLS = [
  { label: "Volatility 100 Index", value: "R_100" },
  { label: "Volatility 75 Index", value: "R_75" },
  { label: "Volatility 50 Index", value: "R_50" },
  { label: "Volatility 25 Index", value: "R_25" },
  { label: "Volatility 10 Index", value: "R_10" },
  { label: "EUR/USD", value: "frxEURUSD" },
  { label: "GBP/USD", value: "frxGBPUSD" },
];

export const TIMEFRAMES = [
  { label: "1 Minute", value: 60 },
  { label: "3 Minutes", value: 180 },
  { label: "5 Minutes", value: 300 },
  { label: "15 Minutes", value: 900 },
];

export const EXPIRATIONS = [
  { label: "1 Min", value: "1m" },
  { label: "3 Min", value: "3m" },
  { label: "5 Min", value: "5m" },
];

// Technical Indicator Lookbacks
export const LOOKBACK_WINDOW = 60; // 60 candles tensor
export const MAX_INDICATOR_PERIOD = 50; // Max EMA is 50
export const BUFFER_MAXLEN = LOOKBACK_WINDOW + MAX_INDICATOR_PERIOD + 100; // Safe buffer margin

export const SQLITE_DB_PATH = path.join(process.cwd(), "signals.sqlite");
