import { GoogleGenAI } from "@google/genai";
import { StrategyResult } from "./strategy_engine.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function adjudicateSignals(results: StrategyResult[], symbol: string, timeframe: number, expiration: string) {
    const payload = {
        symbol,
        timeframe,
        expiration,
        strategy_results: results.map(r => ({
            name: r.name,
            direction: r.direction,
            confidence: Number(r.confidence.toFixed(3)),
            key_indicators: r.key_indicators
        }))
    };

    const systemPrompt = `You are a signal adjudicator. You will receive a JSON list of independent strategy outputs (direction + confidence + the indicator values that triggered each). Your job:
1. Identify which strategies agree on direction (BUY vs SELL) and which conflict.
2. Weight agreement + confidence — do not just pick the single highest-confidence strategy if it conflicts with a majority of others.
3. Return STRICT JSON ONLY, no markdown, no prose, in this exact shape:
{
  "final_direction": "BUY" | "SELL" | "NO_SIGNAL",
  "confidence": 0.0-1.0,
  "agreeing_strategies": ["name1", "name2"],
  "conflicting_strategies": ["name3"],
  "reasoning": "one sentence, plain language"
}
If fewer than 2 strategies agree, OR overall confidence < 0.50, return NO_SIGNAL with NO_SIGNAL as final_direction. Do not return markdown formatted code blocks, return raw json.`;

    try {
        const response = await ai.models.generateContent({
             model: "gemini-2.5-flash",
             contents: [
                 { role: "user", parts: [{ text: JSON.stringify(payload) }] }
             ],
             config: {
                 systemInstruction: systemPrompt,
                 temperature: 0.1,
                 responseMimeType: "application/json"
             }
        });

        const text = response.text;
        if (!text) throw new Error("No response from Gemini");

        // Strip any potential markdown fences, although responseMimeType should prevent them
        const cleaned = text.replace(/^```json/g, '').replace(/```$/g, '').trim();
        return JSON.parse(cleaned);

    } catch (e) {
        console.error("Adjudication API Error:", e);
        return {
            final_direction: "NO_SIGNAL",
            confidence: 0,
            agreeing_strategies: [],
            conflicting_strategies: [],
            reasoning: "Adjudication engine failed."
        };
    }
}
