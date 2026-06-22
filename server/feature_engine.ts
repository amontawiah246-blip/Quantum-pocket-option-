import { RSI, MACD, BollingerBands, Stochastic, ATR, EMA } from 'technicalindicators';
import { Candle } from './data_pipeline.js';

export function computeFeatures(candles: Candle[]) {
  // Need at least 50 candles for MACD and EMAs
  if (candles.length < 50) return null;

  // We compute based ONLY on Closed candles. For real-time, the last candle
  // in the buffer might be forming, so we exclude it (handled in signal engine).
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // RSI 14
  const rsiInput = { values: closes, period: 14 };
  const rsi = RSI.calculate(rsiInput);

  // MACD 12/26/9
  const macdInput = {
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  };
  const macd = MACD.calculate(macdInput);

  // Bollinger Bands 20, 2std
  const bbInput = { period: 20, values: closes, stdDev: 2 };
  const bb = BollingerBands.calculate(bbInput);

  // Stochastic 14, 3, 3
  const stochInput = {
    high: highs,
    low: lows,
    close: closes,
    period: 14,
    signalPeriod: 3
  };
  const stoch = Stochastic.calculate(stochInput);

  // ATR 14
  const atrInput = {
    high: highs,
    low: lows,
    close: closes,
    period: 14
  };
  const atr = ATR.calculate(atrInput);
  
  const ema50 = EMA.calculate({period: 50, values: closes});

  // Extract the latest fully computed features for the last candle in this subset
  // (Note: arrays are shorter than the input due to lookback periods)
  const latestClose = closes[closes.length - 1];
  const latestHigh = highs[highs.length - 1];
  const latestLow = lows[lows.length - 1];
  const latestOpen = candles[candles.length - 1].open;

  const currentRSI = rsi[rsi.length - 1];
  const currentMACD = macd[macd.length - 1];
  const currentBB = bb[bb.length - 1];
  const currentStoch = stoch[stoch.length - 1];
  const currentATR = atr[atr.length - 1];
  const currentEma50 = ema50[ema50.length - 1];

  // Structure features: Body size, wick ratio
  const bodySize = Math.abs(latestClose - latestOpen);
  const range = latestHigh - latestLow;
  
  return {
    rsi: currentRSI,
    macd: currentMACD ? currentMACD.histogram : 0,
    bbLower: currentBB ? currentBB.lower : 0,
    bbUpper: currentBB ? currentBB.upper : 0,
    bbMiddle: currentBB ? currentBB.middle : 0,
    stochK: currentStoch ? currentStoch.k : 0,
    stochD: currentStoch ? currentStoch.d : 0,
    atr: currentATR,
    ema50: currentEma50,
    bodySize,
    range,
    close: latestClose
  };
}
