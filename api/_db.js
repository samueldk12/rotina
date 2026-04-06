// api/_db.js — Database connection and schema initialization
'use strict';

const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
        ? { rejectUnauthorized: false }
        : false,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });
  }
  return pool;
}

async function initSchema() {
  const client = await getPool().connect();
  try {
    await client.query(`
      -- Users table (auth)
      CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        username   TEXT UNIQUE NOT NULL,
        email      TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- All app data per user (JSONB blobs for easy schema evolution)
      CREATE TABLE IF NOT EXISTS user_data (
        user_id          INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        workout_progress JSONB NOT NULL DEFAULT '{}',
        study_progress   JSONB NOT NULL DEFAULT '{}',
        study_time_log   JSONB NOT NULL DEFAULT '{}',
        day_overrides    JSONB NOT NULL DEFAULT '{}',
        general_overrides JSONB NOT NULL DEFAULT '{}',
        user_notes       JSONB NOT NULL DEFAULT '{"text":"","todos":[]}',
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Add column safely if table already existed without it
      ALTER TABLE user_data ADD COLUMN IF NOT EXISTS user_notes JSONB NOT NULL DEFAULT '{"text":"","todos":[]}';

      -- Custom workout sheets per user
      CREATE TABLE IF NOT EXISTS custom_sheets (
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sheet_id   TEXT NOT NULL,
        sheet_data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, sheet_id)
      );
    `);
  } finally {
    client.release();
  }
}

module.exports = { getPool, initSchema };
