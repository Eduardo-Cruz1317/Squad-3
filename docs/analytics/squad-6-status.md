# Squad 6 — estado da implementação

## Entregue neste estágio

- Política de validação de `FiltroRanking` com escopos e períodos definidos pelo `AGENTS.md`, cursor limitado e paginação com limite padrão 20 e máximo 100.
- `LeaderboardService` valida os filtros antes de encaminhar uma leitura ao contrato `LeaderboardRepository.queryRanking`.
- Testes unitários da política e da fronteira Service/Repository.

## Bloqueios para completar a fatia vertical

O schema atual (`supabase/migrations/20261029000000_create_auth_tables.sql`) contém somente `users` e `sessions`. Não há quests/conclusões/progresso, vínculos de guilda, turma ou registro/sequência de atividade. A implementação de ranking, resumo, exportação, índices e migração dependeria de nomes de colunas, métrica de pontuação, autorização por guilda/turma e modelo de atividade que ainda não foram acordados. A seção 10 do `AGENTS.md` mantém esses detalhes em aberto; portanto nenhum SQL/tabela/endpoint foi inventado neste estágio.

O repositório também não está na stack normativa: usa Vite, handlers estilo Vercel e o pacote `postgres`, em vez de Next.js App Router e `pg`. A infraestrutura de autenticação não expõe `requireUser()` para rotas protegidas. Endpoints de analytics sem essa base não seriam seguros nem compatíveis com o contrato arquitetural.

## Decisões necessárias dos responsáveis

1. Definir campos e estados de `RegistroAtividade`/sequência e como atividades elegíveis atualizam a sequência.
2. Aprovar a métrica e desempate do ranking individual (XP, Gold ou outra métrica documentada), bem como os limites temporais de diário/semanal/mensal e semântica do cursor.
3. Confirmar relações e autorização de escopos guilda e turma; detalhes de turma estão explicitamente em aberto.
4. Integrar os domínios Squad 2/3 e identidade à stack de referência, expondo o contrato `requireUser()`.

Após essas decisões, o Squad 6 pode adicionar repository SQL parametrizado e somente leitura, rotas autenticadas `/api/v1/leaderboards`, `/api/v1/analytics/summary` e `/api/v1/reports/export`, índices aprovados pelos donos das tabelas e tela responsiva. A exportação deverá ter limite definido antes de ser exposta.
