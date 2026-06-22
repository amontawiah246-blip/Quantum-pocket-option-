import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Activity, Zap, ShieldAlert, History, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

type Config = {
  symbols: { label: string; value: string }[];
  timeframes: { label: string; value: number }[];
  expirations: { label: string; value: string }[];
};

type SignalResponse = {
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

type HistoryLog = {
  id: number;
  symbol: string;
  timeframe: number;
  expiration: string;
  direction: "UP" | "DOWN" | "NONE";
  confidence: number;
  timestamp: number;
  filters_passed: number;
  suppression_reason: string | null;
  agreeing_strategies: string | null;
  conflicting_strategies: string | null;
  reasoning: string | null;
  created_at: string;
};

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  
  const [symbol, setSymbol] = useState("R_100");
  const [timeframe, setTimeframe] = useState<number>(60);
  const [expiration, setExpiration] = useState("1m");
  
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<SignalResponse | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
      });
      
    refreshHistory();
  }, []);

  useEffect(() => {
    // Whenever symbol or timeframe changes, warm up the backend connection
    if (symbol && timeframe) {
      fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe }),
      });
    }
  }, [symbol, timeframe]);

  const refreshHistory = () => {
    fetch("/api/history")
      .then(res => res.json())
      .then(data => setHistoryLogs(data || []))
      .catch(() => setHistoryLogs([]));
  };

  const getSignal = async () => {
    setLoading(true);
    setSignal(null);
    try {
      const res = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, timeframe, expiration }),
      });
      const data = await res.json();
      setSignal(data);
      refreshHistory();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-900">
      <header className="border-b border-white/10 bg-slate-900/50 p-4 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Binary FX <span className="text-slate-400 text-sm font-normal ml-2">Signal Engine</span></h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-white/5">
             <Activity className="h-3 w-3 text-emerald-400" />
             <span>HFT CORE ONLINE</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left Column: Controls & Result */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-slate-900 border border-white/5 p-5 rounded-2xl shadow-xl">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Parameters
            </h2>
            
            {config ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Asset Pair</label>
                  <select 
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                  >
                    {config.symbols.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Timeframe</label>
                    <select 
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={timeframe}
                      onChange={(e) => setTimeframe(Number(e.target.value))}
                    >
                      {config.timeframes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Expiration</label>
                    <select 
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={expiration}
                      onChange={(e) => setExpiration(e.target.value)}
                    >
                      {config.expirations.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={getSignal}
                  disabled={loading}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                  {loading ? "Processing Tensor..." : "Execute Analysis"}
                </button>
              </div>
            ) : (
               <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse">Loading engine config...</div>
            )}
          </section>

          {/* Result Card */}
          {signal && (
            <section className={`p-6 rounded-2xl border ${signal.filters_passed ? (signal.direction === 'UP' ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-red-950/30 border-red-500/20') : 'bg-slate-900 border-white/5'} shadow-xl`}>
               <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 Algorithms & Gemini Adjudication
               </h2>
               
               {signal.reasoning && (
                  <div className="mb-4 text-sm text-slate-300 italic bg-blue-900/10 p-3 rounded border border-blue-500/20">
                     " {signal.reasoning} "
                  </div>
               )}

               <div className="flex gap-2 mb-6">
                  {signal.agreeing_strategies?.map((s) => (
                      <span key={s} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-md max-w-[120px] truncate">{s}</span>
                  ))}
                  {signal.conflicting_strategies?.map((s) => (
                      <span key={s} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-2 py-1 rounded-md max-w-[120px] truncate">{s}</span>
                  ))}
               </div>

              {!signal.filters_passed ? (
                <div className="text-center py-6">
                  <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto mb-3 opacity-80" />
                  <h3 className="text-lg font-medium text-slate-200 mb-2">Signal Suppressed</h3>
                  <p className="text-sm text-amber-400/80 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 inline-block font-mono">
                    {signal.suppression_reason}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <div>
                       <div className="text-sm text-slate-400 mb-1">Direction</div>
                       <div className={`text-4xl pr-4 font-bold flex items-center gap-2 ${signal.direction === 'UP' ? 'text-emerald-400' : 'text-red-400'}`}>
                         {signal.direction === 'UP' ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
                         {signal.direction}
                       </div>
                     </div>
                     <div className="text-right">
                        <div className="text-sm text-slate-400 mb-1">Confidence</div>
                        <div className="text-3xl font-mono tracking-tight text-white">
                          {(signal.confidence * 100).toFixed(1)}%
                        </div>
                     </div>
                  </div>
                  
                  <div>
                     <div className="flex justify-between text-xs text-slate-400 mb-2 font-mono">
                        <span>Threshold: 50%</span>
                        <span>{signal.direction} {(signal.confidence * 100).toFixed(1)}%</span>
                     </div>
                     <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 ${signal.direction === 'UP' ? 'bg-emerald-500' : 'bg-red-500'}`} 
                         style={{ width: `${Math.max(0, signal.confidence * 100)}%` }}
                       />
                     </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column: History Log */}
        <div className="lg:col-span-7">
           <section className="bg-slate-900 border border-white/5 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-900/80 backdrop-blur">
                 <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                   <History className="h-4 w-4" /> Execution Log (SQLite)
                 </h2>
                 <button onClick={refreshHistory} className="text-slate-500 hover:text-white p-1 transition-colors">
                    <RefreshCw className="h-4 w-4" />
                 </button>
              </div>
              
              <div className="overflow-y-auto p-0 flex-1 custom-scrollbar min-h-[400px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 sticky top-0 font-mono tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">Time</th>
                      <th className="px-4 py-3 font-medium">Pair</th>
                      <th className="px-4 py-3 font-medium">Dir</th>
                      <th className="px-4 py-3 font-medium text-right">Conf</th>
                      <th className="px-4 py-3 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {historyLogs.length === 0 ? (
                       <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-slate-600">No signals evaluated yet.</td>
                       </tr>
                    ) : historyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                          {format(new Date(log.timestamp), 'HH:mm:ss')}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-300">
                          {log.symbol.replace("frx", "")}
                          <span className="text-slate-600 ml-2 text-xs">{log.timeframe}s</span>
                        </td>
                        <td className="px-4 py-3">
                           {log.direction === 'NONE' ? (
                              <span className="text-slate-600">-</span>
                           ) : (
                              <span className={`inline-flex items-center gap-1 font-medium ${log.direction === 'UP' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {log.direction === 'UP' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {log.direction}
                              </span>
                           )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {log.confidence > 0 ? `${(log.confidence * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {log.filters_passed === 1 ? (
                             <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">EXECUTED</span>
                          ) : (
                             <span className="text-amber-500/80 max-w-[200px] truncate block" title={log.suppression_reason || ''}>
                                {log.suppression_reason?.split(':')[0] || 'Suppressed'}
                             </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </section>
        </div>
      </main>
    </div>
  );
}
