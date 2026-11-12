const { validateRankingFilter } = require('../../domain/analytics/ranking-policy');

/** Application service with repository injection to keep analytics read-only. */
function createLeaderboardService(repository) {
  if (!repository || typeof repository.queryRanking !== 'function') {
    throw new TypeError('LeaderboardRepository.queryRanking é obrigatório.');
  }
  return {
    async getLeaderboard(filters) {
      return repository.queryRanking(validateRankingFilter(filters));
    },
  };
}

module.exports = { createLeaderboardService };
