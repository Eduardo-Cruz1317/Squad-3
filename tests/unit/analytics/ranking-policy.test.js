const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRankingFilter } = require('../../../src/business/domain/analytics/ranking-policy');
const { createLeaderboardService } = require('../../../src/business/application/analytics/leaderboard.service');

test('normalizes valid filter and supplies default limit', () => {
  assert.deepEqual(validateRankingFilter({ escopo: 'individual', periodo: 'semanal' }), {
    escopo: 'individual', periodo: 'semanal', limite: 20,
  });
});

test('rejects unsupported scope, period, limit, and cursor', () => {
  for (const filters of [
    { escopo: 'global', periodo: 'semanal' },
    { escopo: 'turma', periodo: 'anual' },
    { escopo: 'guilda', periodo: 'diario', limite: 101 },
    { escopo: 'guilda', periodo: 'diario', limite: 0 },
    { escopo: 'guilda', periodo: 'diario', cursor: 'x'.repeat(257) },
  ]) assert.throws(() => validateRankingFilter(filters), TypeError);
});

test('service validates filters before making a repository read', async () => {
  const calls = [];
  const service = createLeaderboardService({ queryRanking: async (filter) => (calls.push(filter), []) });
  await service.getLeaderboard({ escopo: 'guilda', periodo: 'mensal', limite: '10' });
  assert.equal(calls[0].limite, 10);
  await assert.rejects(service.getLeaderboard({ escopo: 'todos', periodo: 'mensal' }), TypeError);
  assert.equal(calls.length, 1);
});
