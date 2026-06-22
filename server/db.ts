import Database from 'better-sqlite3';
import { SQLITE_DB_PATH } from './config.js';

const db = new Database(SQLITE_DB_PATH);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT,
    timeframe INTEGER,
    expiration TEXT,
    direction TEXT,
    confidence REAL,
    timestamp INTEGER,
    filters_passed BOOLEAN,
    suppression_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const insertSignal = db.prepare(`
  INSERT INTO signals (symbol, timeframe, expiration, direction, confidence, timestamp, filters_passed, suppression_reason)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

export const getRecentSignals = db.prepare(`
  SELECT * FROM signals
  ORDER BY created_at DESC
  LIMIT 50
`);

export default db;
