import Database from 'better-sqlite3';
import { SQLITE_DB_PATH } from './config.js';

const db = new Database(SQLITE_DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS signals_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT,
    timeframe INTEGER,
    expiration TEXT,
    direction TEXT,
    confidence REAL,
    timestamp INTEGER,
    filters_passed BOOLEAN,
    suppression_reason TEXT,
    agreeing_strategies TEXT,
    conflicting_strategies TEXT,
    reasoning TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const insertSignal = db.prepare(`
  INSERT INTO signals_v2 (
    symbol, timeframe, expiration, direction, confidence, timestamp, 
    filters_passed, suppression_reason, agreeing_strategies, 
    conflicting_strategies, reasoning
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

export const getRecentSignals = db.prepare(`
  SELECT * FROM signals_v2
  ORDER BY created_at DESC
  LIMIT 50
`);

export default db;
