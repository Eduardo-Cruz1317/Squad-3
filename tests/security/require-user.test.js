import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequireUser, extractBearerToken } from '../../src/security/require-user.js';

const TOKEN = 'A'.repeat(43);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

test('extractBearerToken lê o header Authorization e rejeita formatos inválidos', () => {
  assert.equal(extractBearerToken({ authorization: `Bearer ${TOKEN}` }), TOKEN);
  assert.equal(extractBearerToken({ authorization: `bearer ${TOKEN}` }), TOKEN);
  assert.equal(extractBearerToken({}), null);
  assert.equal(extractBearerToken(undefined), null);
  assert.equal(extractBearerToken({ authorization: TOKEN }), null);
  assert.equal(extractBearerToken({ authorization: 'Bearer curto' }), null);
  assert.equal(extractBearerToken({ authorization: `Basic ${TOKEN}` }), null);
});

test('devolve o userId da sessão válida, consultando pelo SHA-256 do token e o horário em segundos', async () => {
  const calls = [];
  const requireUser = createRequireUser({
    findSession: async (tokenHash, nowSeconds) => {
      calls.push({ tokenHash, nowSeconds });
      return { userId: 7 };
    },
    now: () => 1_700_000_123_456,
  });
  assert.equal(await requireUser({ authorization: `Bearer ${TOKEN}` }), 7);
  assert.deepEqual(calls, [{ tokenHash: sha256(TOKEN), nowSeconds: 1_700_000_123 }]);
});

test('lança UNAUTHENTICATED sem token, com sessão inexistente/expirada ou userId inválido', async () => {
  const headers = { authorization: `Bearer ${TOKEN}` };
  const withSession = (session) => createRequireUser({ findSession: async () => session });

  for (const requireUser of [withSession(null), withSession({ userId: 0 }), withSession({ userId: NaN })]) {
    await assert.rejects(() => requireUser(headers), { code: 'UNAUTHENTICATED' });
  }
  await assert.rejects(() => withSession({ userId: 1 })({}), { code: 'UNAUTHENTICATED' });
});

test('não esconde falha de banco como 401: o erro original é propagado', async () => {
  const requireUser = createRequireUser({
    findSession: async () => {
      throw new Error('db fora do ar');
    },
  });
  await assert.rejects(() => requireUser({ authorization: `Bearer ${TOKEN}` }), /db fora do ar/);
});
