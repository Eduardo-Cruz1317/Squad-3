// CAMADA 3 — Persistência | cliente `postgres` para o PostgreSQL do Supabase
// (somente servidor, runtime Node.js).
//
// Variável: SUPABASE_DB_URL (mesma do fork) = Supabase → Connect → Transaction pooler
//   postgres://postgres.PROJECT_REF:SENHA@aws-0-REGIAO.pooler.supabase.com:6543/postgres
// Não coloque `?sslmode=...` na URL: o TLS é configurado abaixo.
// DATABASE_URL é aceita como alternativa; DATABASE_SSL=disable serve para PostgreSQL local sem TLS.
import postgres from 'postgres';

const POOL_KEY = Symbol.for('questify.postgres.client');

export function getPool() {
  if (!globalThis[POOL_KEY]) {
    const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('Defina SUPABASE_DB_URL com a connection string do Supabase (Connect → Transaction pooler).');
    }
    const pool = postgres(connectionString, {
      ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false },
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      connect_timeout: 10,
      idle_timeout: 20,
      prepare: false,
    });
    globalThis[POOL_KEY] = pool;
  }
  return globalThis[POOL_KEY];
}
