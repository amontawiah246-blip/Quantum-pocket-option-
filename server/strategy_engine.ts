export type StrategyResult = {
    name: string;
    direction: "BUY" | "SELL" | "NONE";
    confidence: number;
    key_indicators: Record<string, number>;
};

export async function runAllStrategies(features: any): Promise<StrategyResult[]> {
    const results = await Promise.all([
        runRsiStrategy(features),
        runBollingerStrategy(features),
        runMacdStrategy(features),
        runTrendStrategy(features)
    ]);
    return results.filter(r => r !== null) as StrategyResult[];
}

async function runRsiStrategy(f: any): Promise<StrategyResult | null> {
    if (!f.rsi) return null;
    let dir: "BUY"|"SELL"|"NONE" = "NONE";
    let conf = 0;
    
    if (f.rsi < 30) { dir = "BUY"; conf = 0.8 + ((30 - f.rsi) / 100); }
    else if (f.rsi > 70) { dir = "SELL"; conf = 0.8 + ((f.rsi - 70) / 100); }
    else { dir = "NONE"; conf = 0.5; }
    
    return { name: "RSI_Mean_Reversion", direction: dir, confidence: Math.min(conf, 0.99), key_indicators: {rsi: f.rsi} };
}

async function runBollingerStrategy(f: any): Promise<StrategyResult | null> {
    if (!f.bbLower || !f.bbUpper || !f.close) return null;
    let dir: "BUY"|"SELL"|"NONE" = "NONE";
    let conf = 0;
    
    if (f.close < f.bbLower) { dir = "BUY"; conf = 0.85; }
    else if (f.close > f.bbUpper) { dir = "SELL"; conf = 0.85; }
    else { dir = "NONE"; conf = 0.5; }
    
    return { name: "Bollinger_Squeeze", direction: dir, confidence: conf, key_indicators: {close: f.close, bbLower: f.bbLower, bbUpper: f.bbUpper} };
}

async function runMacdStrategy(f: any): Promise<StrategyResult | null> {
    if (f.macd === undefined) return null;
    let dir: "BUY"|"SELL"|"NONE" = "NONE";
    let conf = 0;
    
    if (f.macd > 0 && f.macd > 0.0001) { dir = "BUY"; conf = 0.75; }
    else if (f.macd < 0 && f.macd < -0.0001) { dir = "SELL"; conf = 0.75; }
    else { dir = "NONE"; conf = 0.5; }
    
    return { name: "MACD_Momentum", direction: dir, confidence: conf, key_indicators: {macd: f.macd} };
}

async function runTrendStrategy(f: any): Promise<StrategyResult | null> {
    if (f.ema50 === undefined || f.close === undefined) return null;
    let dir: "BUY"|"SELL"|"NONE" = "NONE";
    let conf = 0;
    
    if (f.close > f.ema50) { dir = "BUY"; conf = 0.65; }
    else if (f.close < f.ema50) { dir = "SELL"; conf = 0.65; }
    else { dir = "NONE"; conf = 0.5; }
    
    return { name: "Trend_Alignment", direction: dir, confidence: conf, key_indicators: {ema50: f.ema50, close: f.close} };
}
