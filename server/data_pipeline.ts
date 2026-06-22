import WebSocket from "ws";
import { DERIV_WS_URL, BUFFER_MAXLEN } from "./config.js";

export type Candle = {
  epoch: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

// Memory storage for streams
// key: string (symbol_timeframe)
export const candleBuffers: Record<string, Candle[]> = {};
let activeWs: WebSocket | null = null;
const streamSubscribers = new Set<string>();

export function getBufferKey(symbol: string, timeframe: number) {
  return `${symbol}_${timeframe}`;
}

export function startDerivConnection() {
  if (activeWs) return;

  activeWs = new WebSocket(DERIV_WS_URL);

  activeWs.on("open", () => {
    console.log("Connected to Deriv WebSocket");
    // Resubscribe to existing streams if reconnected
    for (const key of streamSubscribers) {
      const [symbol, timeframe] = key.split("_");
      activeWs?.send(JSON.stringify({
        ticks_history: symbol,
        adjust_start_time: 1,
        count: BUFFER_MAXLEN,
        end: "latest",
        style: "candles",
        granularity: Number(timeframe),
        subscribe: 1
      }));
    }
  });

  activeWs.on("message", (data) => {
    const response = JSON.parse(data.toString());

    if (response.error) {
       console.error("Deriv API Error for", JSON.stringify(response.echo_req), ":", response.error.message);
       
       // Allow retry if subscription failed
       if (response.echo_req?.ticks_history) {
           const failedKey = getBufferKey(response.echo_req.ticks_history, response.echo_req.granularity);
           streamSubscribers.delete(failedKey);
       }
       return;
    }

    if (response.msg_type === "candles") {
      const { ticks_history: symbol, granularity } = response.echo_req;
      const key = getBufferKey(symbol, granularity);
      
      const history = response.candles;
      if (history) {
        const candles: Candle[] = history.map((c: any) => ({
          epoch: c.epoch,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }));
        
        // Ensure we respect max length
        candleBuffers[key] = candles.slice(-BUFFER_MAXLEN);
        console.log(`Loaded ${candleBuffers[key].length} historical candles for ${key}`);
      }
    } else if (response.msg_type === "ohlc") {
      const ohlc = response.ohlc;
      const key = getBufferKey(ohlc.symbol, ohlc.granularity);
      
      if (!candleBuffers[key]) {
         candleBuffers[key] = [];
      }

      const buffer = candleBuffers[key];
      const candle: Candle = {
        epoch: ohlc.open_time,
        open: Number(ohlc.open),
        high: Number(ohlc.high),
        low: Number(ohlc.low),
        close: Number(ohlc.close)
      };

      // Only push closed candles. Deriv sends updates for the forming candle.
      // A forming candle has the same open_time until it closes.
      const last = buffer[buffer.length - 1];
      
      if (!last) {
        buffer.push(candle);
      } else if (last.epoch === candle.epoch) {
        // Update forming candle
        buffer[buffer.length - 1] = candle;
      } else {
        // Move to next candle
        buffer.push(candle);
        if (buffer.length > BUFFER_MAXLEN) {
          buffer.shift();
        }
      }
    }
  });

  activeWs.on("close", () => {
    console.log("Deriv WebSocket Closed. Reconnecting...");
    activeWs = null;
    setTimeout(startDerivConnection, 5000); // 5s jittered backoff logic ideally, simplify to 5s
  });

  activeWs.on("error", (err) => {
    console.error("Deriv WS Error:", err);
  });
}

export function subscribeToCandles(symbol: string, timeframe: number) {
  const key = getBufferKey(symbol, timeframe);
  
  if (streamSubscribers.has(key)) {
     return; // Already subscribed
  }

  streamSubscribers.add(key);

  if (!candleBuffers[key]) {
    candleBuffers[key] = [];
  }

  if (activeWs && activeWs.readyState === WebSocket.OPEN) {
    console.log(`Requesting historical data and subscribing to ${symbol} (${timeframe}s)`);
    // Unified request: fetch history and subscribe to live stream
    activeWs.send(JSON.stringify({
      ticks_history: symbol,
      adjust_start_time: 1,
      count: BUFFER_MAXLEN,
      end: "latest",
      style: "candles",
      granularity: timeframe,
      subscribe: 1
    }));
  }
}
