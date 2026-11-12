// CAMADA 3 — Persistência | gerenciador de transação.
// `postgres.begin` mantém todas as queries no mesmo client e faz commit/rollback.
import { getPool } from './pool.js';

export async function withTransaction(work) {
  return getPool().begin((tx) => work(tx));
}
