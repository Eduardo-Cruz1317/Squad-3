# Relatório técnico — Arquitetura em camadas do Questify (Parte 2 de 2: Gestão de projetos)

**Atualização de stack:** JavaScript · Node.js · Next.js · PostgreSQL
**Projeto:** Questify — Plataforma Gamificada de Produtividade Acadêmica
**Repositório analisado:** `gcet1010-2026.2-main.zip` · **Data da revisão:** 10 de novembro de 2026

**Parte 2 de 2 — Gestão de projetos.** A Parte 1 trata da decisão de arquitetura (stack, camadas, convenções, segurança, fluxos, contratos e estrutura de diretórios).

> **Escopo desta parte:** Squads, camadas/subcamadas de foco, responsabilidades e entregáveis, ownership e integrações, plano de implementação por sprint, práticas de engenharia, critérios de aceitação de gestão e riscos de gestão. **Contexto mínimo:** o Questify é uma plataforma gamificada de produtividade acadêmica (quests, XP/níveis, badges, guildas, Gold, recompensas, rankings, dashboards). A arquitetura adotada é um monólito modular em camadas — Apresentação → Negócio → Persistência → Dados — numa única aplicação Next.js (JavaScript) em Node.js com PostgreSQL. Escopo de execução: Squad 1, Squad 2, Squad 3, Squad 4 e Squad 6 — exclusivamente.

---

## 1. Contexto de gestão e transição de escopo

| Elemento | Situação encontrada nos documentos originais | Decisão após atualização |
|---|---|---|
| Funcionalidades | Roadmap: identidade, quests, social, economia, ranking e relatórios; notificações e outras frentes também previstas. | Preservar funcionalidades dos cinco Squads selecionados; notificações em tempo real ficam fora deste recorte. |
| Front-end | Roadmap: Squad 7 dedicado à SPA/PWA. | UI dividida entre os cinco Squads por domínio; nenhum Squad 7 incluído. |
| Plataforma | Roadmap: Squad 8 com DevOps/gateway. | Build, CI, scripts, implantação e observabilidade são responsabilidades compartilhadas dos cinco, sem Squad 8. |
| Estado do repositório | README, ROADMAP, .gitignore e arquivos de teste/texto; nenhuma aplicação implantável. | Projeto arquitetural prospectivo, não migração de código Spring existente. |

**Controle de mudança.** O `README.md` do ZIP ainda menciona Java/Spring e HTML/CSS/JavaScript; o `ROADMAP.md` planeja microsserviços, API Gateway e barramento de eventos. A nova stack (JavaScript, Node.js/Next.js, PostgreSQL) e a arquitetura somente em camadas são propostas que precisam ser aprovadas formalmente e incorporadas ao README e ao roadmap.

## 2. Mapeamento obrigatório — Squad × camada de foco × subcamadas

| Squad | Domínio | Camada de foco | Subcamadas de foco | Responsabilidades principais |
|---|---|---|---|---|
| Squad 1 | Identidade e Acesso | 1 — Apresentação | `app/api/v1/auth`, páginas de login/cadastro, `presentation/security`, DTOs/validação; apoio em `business/auth`, `persistence/auth`. | Cadastro, login, logout, sessão/JWT, perfis, papéis e regras de acesso; convenções de autenticação para os demais Squads. |
| Squad 2 | Quests e Gamificação | 2 — Negócio | `business/application/quests`, `business/domain/quests`, `business/domain/progression`; apoio em `app/api/v1/quests` e `persistence/quests`. | CRUD e conclusão de quests; XP, níveis e badges; idempotência; coordenar crédito Gold com Squad 4. |
| Squad 3 | Guildas e Social | 2 — Negócio | `business/application/social`, `business/domain/social`; apoio em `app/api/v1/guilds` e `persistence/social`. | Guildas, convites, membros, administração, feed, comentários/reações, permissões sociais; dados de composição para rankings. |
| Squad 4 | Marketplace e Recompensas | 2 — Negócio | `business/application/rewards`, `business/domain/economy`, com apoio crítico de `persistence/rewards`. | Catálogo, Gold, carteira/ledger, estoque e resgates; controle de concorrência, atomicidade e prevenção de saldo negativo. |
| Squad 6 | Leaderboard e Analytics | 3 — Persistência | `persistence/analytics/queries`, `persistence/analytics/repositories`, com apoio em `business/application/analytics` e telas/rotas próprias. | Rankings individuais, por guilda e turma; consultas SQL, agregações, dashboards e exportação CSV; tuning de índices e paginação. |

**Interpretação do foco:** a camada de foco identifica a especialidade principal, não limita o Squad a modificar apenas uma camada. Cada um entrega seu fluxo vertical completo (UI + endpoint + service + repository + migração). A equipe não cria Squads 5, 7 ou 8 para absorver notificações, front-end ou DevOps.

### 2.1. Responsabilidades e entregáveis concretos

**Squad 1 — Apresentação e segurança.** Mantém `app/(public)/login`, `app/(public)/register`, `app/api/v1/auth/**`, componentes de autenticação e guardas de sessão. Define o contrato de identidade (`userId`, papéis, status), a biblioteca de autenticação, testes de rota protegida e exemplos reutilizáveis. Mantém seus Services, repositórios e tabelas de usuário. Não centraliza toda a UI: cada Squad implementa as páginas do próprio domínio.

**Squad 2 — Aplicação e regras de progressão.** Mantém `completeQuest()`, `calculateXp()`, `resolveLevel()` e concessão de badges. Define chave única da conclusão e regras de pontuação, validando quem pode concluir e impedindo XP duplicado. Solicita o crédito de Gold à interface de aplicação mantida pelo Squad 4 — sem escrever diretamente no ledger.

**Squad 3 — Domínio social.** Mantém `createGuild()`, `joinGuild()`, `manageMembership()` e operações de feed. Regula papéis e vínculos, valida autorizações sociais e fornece consultas estáveis de membros e guildas para ranking. Não manipula XP, Gold ou ranking como fontes de verdade.

**Squad 4 — Economia transacional.** Mantém `creditGoldForQuest()`, `redeemReward()` e políticas de preço/estoque. É o único Squad autorizado a alterar saldo e lançamentos de Gold. Impõe transações ACID, idempotência e controle concorrente com locks/updates condicionais e constraints; implementa testes de resgate simultâneo.

**Squad 6 — Leitura analítica.** Mantém consultas filtradas e paginadas, ranking e desempate determinístico, sumários de XP/Gold e exportação CSV. Usa leitura autorizada das tabelas originárias, sem alterar seus dados. Mudanças de índice nas tabelas de outro domínio são revisadas com o Squad proprietário. Evita cache que exiba posição obsoleta após commit, a menos que haja requisito de atualização explícito.

### 2.2. Ownership e integrações

| Ativo/contrato | Dono | Dependentes e regras de integração |
|---|---|---|
| `users`, perfis, sessão e papéis | Squad 1 | Todos usam `requireUser()` e políticas públicas; sem implementar autenticação em paralelo. |
| `quests`, `quest_completions`, XP/níveis/badges | Squad 2 | Squad 4 recebe pedido de crédito por Service; Squad 6 consulta dados consolidados. |
| `guilds`, `guild_memberships`, feed | Squad 3 | Squad 6 usa leituras de membros; alterações exigem revisão do Squad 3. |
| `wallets`, `gold_ledger`, rewards, redemptions, stock | Squad 4 | Squad 2 invoca `creditGoldForQuest()`; Squad 6 apenas consulta leituras permitidas. |
| Queries de ranking, dashboard e exportação | Squad 6 | Todos podem exibir seus resultados; sem update sobre tabelas de origem. |
| Interface Next.js (`page.jsx`, componentes) | Cada Squad em seu domínio | Padrões de layout, acessibilidade e estilos acordados pelos cinco. |
| `package.json`, CI, banco local, deploy, documentação | Cinco Squads conjuntamente | Responsável rotativo por sprint; revisões por propriedade do domínio; nenhuma nova equipe. |

## 3. Plano de implementação por sprint

| Marco | Ações dos cinco Squads | Critério verificável |
|---|---|---|
| Sprint 0 — Fundação | Aprovar alteração de stack/arquitetura; atualizar README; iniciar Next.js JavaScript e PostgreSQL; definir convenções de camadas, migrations, contratos HTTP e CI. | `npm install`, `npm run dev`, conexão de teste e pipeline inicial operantes. |
| Sprint 1 — Fatias mínimas | Squad 1: login/sessão; Squad 2: quests; Squad 3: guildas; Squad 4: catálogo/carteira; Squad 6: ranking simples. Todos entregam tela, rota, Service e Repository. | Cinco fluxos básicos executam em uma única aplicação e têm testes. |
| Sprint 2 — Regras centrais | XP/níveis, gestão de guildas, ledger/Gold, permissões e queries paginadas. | Regras unitárias e constraints críticas verificadas. |
| Sprint 3 — Integração | Quest concluída → XP → crédito de Gold → ranking; resgate simultâneo com estoque. | Testes ponta a ponta, transação compartilhada, idempotência e rollback. |
| Sprint 4 — Segurança e qualidade | Revisar autorização em Server Components/rotas, CSRF, erros, validação, testes de integração e UX. | Pipelines bloqueiam regressões; endpoints privados protegidos. |
| Sprint 5 — Desempenho e operação | Medir p95 do ranking, índices, pool PostgreSQL, renderização e latência; logs e execução em produção Node.js. | Resultados de carga documentados; comportamento de cache explicitado. |
| Sprints finais — Entrega | Revisar acessibilidade, README, OpenAPI, manual de deploy e demonstração dos cinco módulos. | Implantação reproduzível e funcionalidades demonstradas. |

### 3.1. Práticas compartilhadas de engenharia

- Cada alteração em `business`, `persistence` ou `database` requer revisão do Squad proprietário; código transversal requer revisão cruzada.
- Entregar um PR vertical por funcionalidade; documentação e teste acompanham a alteração.
- Alterar apenas um artefato implantável; não transformar cada domínio em projeto, serviço HTTP ou banco independente.
- Testes podem usar o `node:test` e o executor escolhido pela equipe; dependências para `pg`, hash de senhas e JWT são bibliotecas de implementação, não uma mudança da stack.
- Manter scripts `dev`, `build`, `start`, `lint`, `test`, `db:migrate` no `package.json`. Fixar versões suportadas de Node.js/Next.js no repositório após validação, sem presumir números nesta proposta.

## 4. Critérios de aceitação de gestão e riscos de gestão

| Verificação | Resultado esperado |
|---|---|
| Squads | Apenas 1, 2, 3, 4 e 6, com camada e subcamadas de foco explícitas e UI de cada domínio distribuída entre eles. |
| Evolução | OpenAPI, migrations, testes, CI e convenções por Squad; atualização formal de README e roadmap. |

| Risco/decisão | Consequência | Mitigação |
|---|---|---|
| README/ROADMAP ainda descrevem outra stack/topologia | Implementações incompatíveis e avaliação documental inconsistente. | Aprovar e versionar ADR; atualizar README e roadmap antes da Sprint 1. |
| Funcionalidades de squads não selecionados | Notificações/infra específica podem faltar em relação ao roadmap original. | Documentar adiamentos e responsabilidades transversais dos cinco. |

## Referências e rastreabilidade

- Fontes internas inspecionadas: `README.md` e `ROADMAP.md` (produto, escopo dos Squads e planejamento), ambos no ZIP `gcet1010-2026.2-main.zip`.
- Atualização fornecida pelo usuário: comunicado de alteração para JavaScript, Node.js/Next.js e PostgreSQL (10/11/2026).
