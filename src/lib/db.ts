import pg from "pg";

const { Pool, types } = pg;

// PostgreSQL DATE harus tetap "YYYY-MM-DD", bukan Date object yang bergeser
// mengikuti timezone server saat dikirim ke API/UI.
types.setTypeParser(1082, (value) => value);

type DbGlobal = typeof globalThis & { sppgPool?: pg.Pool };
const globalForDb = globalThis as DbGlobal;

export const pool =
  globalForDb.sppgPool ??
  new Pool({
    host: process.env.DB_HOST || "db.mxuxyvqkowabydsscgth.supabase.co",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_DATABASE || "postgres",
    user: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD,
    ssl:
      process.env.DB_SSLMODE === "require"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 20_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sppgPool = pool;

pool.on("error", (err) => {
  console.error("[pg] idle client error:", err.message);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function one<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const result = await pool.query<T>(text, params);
  return result.rows[0] ?? null;
}

export async function many<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function withTransaction<T>(
  handler: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await handler(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
