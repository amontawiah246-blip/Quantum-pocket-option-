import WebSocket from "ws";

const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");

const symbols = ["R_100", "R_75", "R_50", "R_25", "R_10", "frxEURUSD", "frxGBPUSD"];

ws.on("open", () => {
  symbols.forEach((sym) => {
      ws.send(JSON.stringify({
        ticks_history: sym,
        adjust_start_time: 1,
        count: 2,
        end: "latest",
        style: "candles",
        granularity: 60,
        subscribe: 1
      }));
  });
});

ws.on("message", (data) => {
  const parsed = JSON.parse(data.toString());
  if (parsed.error) {
     console.error("ERROR for", parsed.echo_req.ticks_history, ":", parsed.error);
  } else {
     console.log("SUCCESS:", parsed.echo_req?.ticks_history, parsed.msg_type);
  }
});

setTimeout(() => process.exit(0), 4000);
