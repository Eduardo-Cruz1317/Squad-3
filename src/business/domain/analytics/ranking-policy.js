const SCOPES = new Set(['individual', 'guilda', 'turma']);
const PERIODS = new Set(['diario', 'semanal', 'mensal']);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Validate and normalize the documented leaderboard filters. */
function validateRankingFilter(input = {}) {
  const { escopo, periodo, cursor } = input;
  if (!SCOPES.has(escopo)) throw new TypeError('Escopo de ranking inválido.');
  if (!PERIODS.has(periodo)) throw new TypeError('Período de ranking inválido.');

  let limite = input.limite === undefined ? DEFAULT_LIMIT : Number(input.limite);
  if (!Number.isInteger(limite) || limite < 1 || limite > MAX_LIMIT) {
    throw new TypeError(`Limite deve ser um inteiro entre 1 e ${MAX_LIMIT}.`);
  }
  if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 256)) {
    throw new TypeError('Cursor inválido.');
  }
  return { escopo, periodo, ...(cursor ? { cursor } : {}), limite };
}

module.exports = { validateRankingFilter, DEFAULT_LIMIT, MAX_LIMIT };
