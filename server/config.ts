import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
export const APP_ID = process.env.DERIV_APP_ID || "1089"; // 1089 is a generic app id
export const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

// Supported Symbols
export const SUPPORTED_SYMBOLS = [
  // Synthetics
  { label: "Volatility 100 Index", value: "R_100" },
  { label: "Volatility 75 Index", value: "R_75" },
  { label: "Volatility 50 Index", value: "R_50" },
  { label: "Volatility 25 Index", value: "R_25" },
  { label: "Volatility 10 Index", value: "R_10" },
  
  // Majors
  { label: "AUD/USD", value: "frxAUDUSD" },
  { label: "EUR/USD", value: "frxEURUSD" },
  { label: "GBP/USD", value: "frxGBPUSD" },
  { label: "NZD/USD", value: "frxNZDUSD" },
  { label: "USD/CAD", value: "frxUSDCAD" },
  { label: "USD/CHF", value: "frxUSDCHF" },
  { label: "USD/JPY", value: "frxUSDJPY" },

  // Minors
  { label: "AUD/CAD", value: "frxAUDCAD" },
  { label: "AUD/CHF", value: "frxAUDCHF" },
  { label: "AUD/JPY", value: "frxAUDJPY" },
  { label: "AUD/NZD", value: "frxAUDNZD" },
  { label: "CAD/CHF", value: "frxCADCHF" },
  { label: "CAD/JPY", value: "frxCADJPY" },
  { label: "CHF/JPY", value: "frxCHFJPY" },
  { label: "EUR/AUD", value: "frxEURAUD" },
  { label: "EUR/CAD", value: "frxEURCAD" },
  { label: "EUR/CHF", value: "frxEURCHF" },
  { label: "EUR/GBP", value: "frxEURGBP" },
  { label: "EUR/JPY", value: "frxEURJPY" },
  { label: "EUR/NZD", value: "frxEURNZD" },
  { label: "GBP/AUD", value: "frxGBPAUD" },
  { label: "GBP/CAD", value: "frxGBPCAD" },
  { label: "GBP/CHF", value: "frxGBPCHF" },
  { label: "GBP/JPY", value: "frxGBPJPY" },
  { label: "GBP/NZD", value: "frxGBPNZD" },
  { label: "NZD/JPY", value: "frxNZDJPY" },
];

export const TIMEFRAMES = [
  { label: "1 Minute", value: 60 },
  { label: "5 Minutes", value: 300 },
  { label: "15 Minutes", value: 900 },
];

export const EXPIRATIONS = [
  { label: "1 Min", value: "1m" },
  { label: "3 Min", value: "3m" },
  { label: "5 Min", value: "5m" },
];

export const TIMEFRAME_PROFILES: Record<number, any> = {
  60: {
      ema_periods: [3, 5, 9, 13, 21],
      rsi_period: 7,
      macd: [12, 26, 9],
      bb_period: 20,
      stoch: [14, 3, 3],
      atr_period: 10,
  },
  300: {
      ema_periods: [5, 9, 21, 34, 50],
      rsi_period: 14,
      macd: [12, 26, 9],
      bb_period: 20,
      stoch: [14, 3, 3],
      atr_period: 14,
  },
  900: {
      ema_periods: [9, 21, 50, 100],
      rsi_period: 14,
      macd: [19, 39, 9],
      bb_period: 20,
      stoch: [21, 5, 5],
      atr_period: 14,
  },
};

// Technical Indicator Lookbacks
export const LOOKBACK_WINDOW = 60; // 60 candles tensor
export const MAX_INDICATOR_PERIOD = 100; // Max EMA is 100
export const BUFFER_MAXLEN = LOOKBACK_WINDOW + MAX_INDICATOR_PERIOD + 100; // Safe buffer margin

export const SQLITE_DB_PATH = path.join(process.cwd(), "signals.sqlite");
