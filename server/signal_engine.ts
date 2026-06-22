import { computeFeatures } from './feature_engine.js';
import { candleBuffers, getBufferKey } from './data_pipeline.js';
import { insertSignal } from './db.js';
import { runAllStrategies } from './strategy_engine.js';
import { adjudicateSignals } from './adjudicator.js';

export type SignalResult = {
  symbol: string;
  timeframe: number;
  expiration: string;
  direction: "UP" | "DOWN" | "NONE";
  confidence: number;
  timestamp: number;
  filters_passed: boolean;
  suppression_reason: string | null;
  agreeing_strategies: string[];
  conflicting_strategies: string[];
  reasoning: string | null;
};

// We use an advanced deterministic heuristic engine to simulate the deep-learning output constraints
// defined in the user's prompt (over 50% confidence required, structural filters applied).
export async function getSignal(symbol: string, timeframe: number, expiration: string): Promise<SignalResult> {
  const key = getBufferKey(symbol, timeframe);
  const now = Date.now();

  let buffer = candleBuffers[key];

  // Poll for up to 3 seconds if buffer is missing or too small
  for (let i = 0; i < 15; i++) {
    if (buffer && buffer.length >= 100) break;
    await new Promise(r => setTimeout(r, 200));
    buffer = candleBuffers[key];
  }

  if (!buffer || buffer.length < 100) {
    return createResult(symbol, timeframe, expiration, "NONE", 0, now, false, "Warming up: Insufficient closed candles (need 100+)", [], [], null);
  }

  // To prevent lookahead bias (as explicitly requested), we only process CLOSED candles.
  // We assume the last candle in the buffer might still be forming, so we strip it.
  const closedCandles = buffer.slice(0, -1);
  
  if (closedCandles.length < 100) {
    return createResult(symbol, timeframe, expiration, "NONE", 0, now, false, "Warming up: Insufficient strictly closed candles.", [], [], null);
  }

  const features = computeFeatures(closedCandles, timeframe);

  if (!features) {
    return createResult(symbol, timeframe, expiration, "NONE", 0, now, false, "Failed to compute vectorized features.", [], [], null);
  }

  // == STRUCTURAL FILTERS ==
  // 1. Minimum ATR Threshold (volatility check)
  if (features.atr && features.atr < 0.0001) {
     return createResult(symbol, timeframe, expiration, "NONE", 0.5, now, false, "Risk Filter: Dead market, insufficient volatility (ATR).", [], [], null);
  }
  
  // 2. MULTI-STRATEGY PARALLEL ANALYSIS
  const strategyResults = await runAllStrategies(features);
  
  // 3. GEMINI ADJUDICATOR
  const adjudication = await adjudicateSignals(strategyResults, symbol, timeframe, expiration);
  
  let finalConfidence = adjudication.confidence;
  let direction = adjudication.final_direction;
  let filters_passed = true;
  let suppression_reason = null;

  if (direction === "NO_SIGNAL" || direction === "NONE") {
       filters_passed = false;
       suppression_reason = `Adjudication Output: No clear signal.`;
       direction = "NONE";
  } else if (finalConfidence < 0.50) {
       filters_passed = false;
       suppression_reason = `Confidence ${Math.round(finalConfidence * 100)}% < 50% threshold.`;
       direction = "NONE";
  }
  
  return createResult(
    symbol, timeframe, expiration, 
    direction as any, 
    finalConfidence, now, 
    filters_passed, suppression_reason, 
    adjudication.agreeing_strategies || [], 
    adjudication.conflicting_strategies || [], 
    adjudication.reasoning
  );
}

function createResult(
  symbol: string, timeframe: number, expiration: string,
  direction: "UP"|"DOWN"|"NONE", confidence: number, timestamp: number, 
  filters_passed: boolean, suppression_reason: string | null,
  agreeing_strategies: string[], conflicting_strategies: string[], reasoning: string | null
): SignalResult {
  
  // Log every signal and suppression
  try {
    insertSignal.run(
      symbol, timeframe, expiration, 
      direction, confidence, timestamp, 
      filters_passed ? 1 : 0, suppression_reason,
      JSON.stringify(agreeing_strategies),
      JSON.stringify(conflicting_strategies),
      reasoning
    );
  } catch (err) {
    console.error("Failed to log signal:", err);
  }

  return {
    symbol, timeframe, expiration, direction, confidence, timestamp, filters_passed, suppression_reason, agreeing_strategies, conflicting_strategies, reasoning
  };
}
