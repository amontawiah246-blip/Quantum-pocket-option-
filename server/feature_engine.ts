import { RSI, MACD, BollingerBands, Stochastic, ATR, EMA } from 'technicalindicators';
import { Candle } from './data_pipeline.js';
import { TIMEFRAME_PROFILES } from './config.js';

export function computeFeatures(candles: Candle[], timeframe: number) {
  // Need at least 100 candles for max indicators
  if (candles.length < 100) return null;

  const profile = TIMEFRAME_PROFILES[timeframe] || TIMEFRAME_PROFILES[60];

  // We compute based ONLY on Closed candles. For real-time, the last candle
  // in the buffer might be forming, so we exclude it (handled in signal engine).
  
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  const rsiInput = { values: closes, period: profile.rsi_period };
  const rsi = RSI.calculate(rsiInput);

  const macdInput = {
    values: closes,
    fastPeriod: profile.macd[0],
    slowPeriod: profile.macd[1],
    signalPeriod: profile.macd[2],
    SimpleMAOscillator: false,
    SimpleMASignal: false
  };
  const macd = MACD.calculate(macdInput);

  const bbInput = { period: profile.bb_period, values: closes, stdDev: 2 };
  const bb = BollingerBands.calculate(bbInput);

  const stochInput = {
    high: highs,
    low: lows,
    close: closes,
    period: profile.stoch[0],
    signalPeriod: profile.stoch[1] // D period
  };
  const stoch = Stochastic.calculate(stochInput);

  const atrInput = {
    high: highs,
    low: lows,
    close: closes,
    period: profile.atr_period
  };
  const atr = ATR.calculate(atrInput);
  
  // Custom multi-EMA computation
  const emaData: Record<string, number> = {};
  for (const period of profile.ema_periods) {
      const e = EMA.calculate({period: period, values: closes});
      emaData[`ema${period}`] = e[e.length - 1];
  }
  
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
    ...emaData,
    bodySize,
    range,
    close: latestClose
  };
}
