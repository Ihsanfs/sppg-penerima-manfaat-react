import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'db.mxuxyvqkowabydsscgth.supabase.co',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_DATABASE || 'postgres',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

pool.on('error', (err) => {
  console.error('[pg] idle client error:', err.message);
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function one(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows[0] ?? null;
}

export async function many(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}
