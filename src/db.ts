import { Pool } from 'pg';

/**
 * Shared pg connection pool.
 * Configuration is read from environment variables so the same code works
 * in Docker Compose (DB_HOST=db) and locally (DB_HOST=localhost).
 */
const pool = new Pool({
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME     ?? 'inventory',
  user:     process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
});

pool.on('error', (err: Error) => {
  console.error('[pg] Unexpected pool error:', err.message);
});

export default pool;
