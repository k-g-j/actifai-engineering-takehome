import { Pool, QueryResult, QueryResultRow } from 'pg';
import { DB_CONFIG } from '../constants';

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'pass',
  database: process.env.DB_NAME || 'actifai',
  max: DB_CONFIG.MAX_CONNECTIONS,
  idleTimeoutMillis: DB_CONFIG.IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: DB_CONFIG.CONNECTION_TIMEOUT_MS,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute a parameterized query against the database.
 * @param text - SQL query string with parameter placeholders ($1, $2, etc.)
 * @param params - Array of parameter values
 * @returns Query result with typed rows
 */
export async function query<T extends QueryResultRow>(
  text: string,
  params?: (string | number | null | undefined)[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text, duration, rows: result.rowCount });
  }

  return result;
}

/**
 * Get the connection pool for direct access when needed.
 */
export function getPool(): Pool {
  return pool;
}

/**
 * Gracefully close all database connections.
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default {
  query,
  getPool,
  closePool,
};
