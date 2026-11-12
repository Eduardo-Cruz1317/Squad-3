// Segurança transversal | valida a sessão do request e devolve o `userId`.
// O login (api/_lib/auth-handler.js) grava em `sessions` apenas o SHA-256 do token,
// então aqui fazemos o mesmo hash do token recebido em `Authorization: Bearer <token>`.
// Não conhece HTTP além dos headers; lança UnauthenticatedError (código, não status).
import { createHash } from 'node:crypto';
import { getPool } from '../persistence/postgres/pool.js';
import { UnauthenticatedError } from '../shared/errors.js';

// token = base64url de 32 bytes (43 caracteres); aceitamos uma faixa para não acoplar ao tamanho exato
const BEARER_PATTERN = /^Bearer\s+([A-Za-z0-9_-]{20,200})$/i;

export function extractBearerToken(headers) {
  const raw = headers?.authorization ?? headers?.Authorization;
  if (typeof raw !== 'string') return null;
  const match = BEARER_PATTERN.exec(raw.trim());
  return match ? match[1] : null;
}

export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

/** Consulta padrão: sessão existente e não expirada. `expires_at` é em segundos (epoch). */
async function findActiveSession(tokenHash, nowSeconds) {
  const rows = await getPool().unsafe(
    'SELECT user_id FROM sessions WHERE token_hash = $1 AND expires_at > $2 LIMIT 1',
    [tokenHash, nowSeconds],
  );
  return rows[0] ? { userId: Number(rows[0].user_id) } : null;
}

/** Fábrica com dependências injetáveis (permite testar sem banco). */
export function createRequireUser({ findSession = findActiveSession, now = () => Date.now() } = {}) {
  return async function requireUser(headers) {
    const token = extractBearerToken(headers);
    if (!token) throw new UnauthenticatedError();

    const session = await findSession(hashToken(token), Math.floor(now() / 1000));
    if (!session || !Number.isSafeInteger(session.userId) || session.userId <= 0) {
      throw new UnauthenticatedError();
    }
    return session.userId;
  };
}

export const requireUser = createRequireUser();
