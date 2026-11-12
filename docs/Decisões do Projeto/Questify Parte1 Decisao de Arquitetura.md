# Relatório técnico — Arquitetura em camadas do Questify (Parte 1 de 2: Decisão de arquitetura)

**Atualização de stack:** JavaScript · Node.js · Next.js · PostgreSQL
**Projeto:** Questify — Plataforma Gamificada de Produtividade Acadêmica
**Repositório analisado:** `gcet1010-2026.2-main.zip` · **Data da revisão:** 10 de novembro de 2026

**Parte 1 de 2 — Decisão de arquitetura e temas correlatos.** A Parte 2 trata de gestão de projetos (Squads, responsabilidades, sprints e riscos de gestão).

> **Escopo desta parte:** stack, topologia, camadas, convenções do Next.js, segurança e consistência, fluxos críticos, contratos HTTP, estrutura de diretórios, critérios técnicos de aceitação e riscos técnicos. Escopo de execução do projeto: Squad 1, Squad 2, Squad 3, Squad 4 e Squad 6 — exclusivamente. Arquitetura-alvo: monólito modular organizado exclusivamente em camadas, implementado como aplicação full-stack Next.js executada em Node.js.

**Controle de mudança.** O `README.md` contido no ZIP ainda menciona Java/Spring e HTML/CSS/JavaScript. A nova stack informada posteriormente pelo projeto é JavaScript, Node.js/Next.js e PostgreSQL; esta revisão a trata como a diretriz mais recente, que deverá ser incorporada ao README e aprovada formalmente. O `ROADMAP.md` planeja microsserviços, API Gateway e barramento de eventos: o desenho abaixo é proposta de substituição por uma arquitetura somente em camadas. O ZIP não contém código de produção; por isso, não se afirma existir um sistema já migrado.

---

## 1. Resumo executivo e contexto do negócio

O Questify gamifica produtividade acadêmica com quests e tarefas, XP e níveis, badges, guildas e interações sociais, uma moeda virtual (Gold), recompensas resgatáveis, rankings, dashboards e relatórios. O objetivo técnico é entregar essas capacidades com fronteiras de responsabilidade claras, segurança, consistência de dados, evolução incremental e operação acessível aos cinco Squads.

**Decisão arquitetural:** uma única aplicação Next.js usando App Router para páginas, componentes de interface e Route Handlers HTTP; Node.js é o ambiente de execução do servidor Next.js, não um segundo backend obrigatório. Serviços JavaScript concentram os casos de uso e as regras; repositórios executam SQL parametrizado; PostgreSQL é a fonte persistente de verdade. Não se acrescentam Express, NestJS, microserviços, gateway dedicado, filas, Clean Architecture, Hexagonal ou eventos distribuídos como parte da solução.

A opção torna mais simples assegurar, em uma mesma transação SQL, a conclusão da quest, a atribuição de XP e Gold, e os resgates de recompensas. A escalabilidade inicial é por otimização de consulta, índices, pool de conexões e réplicas da aplicação sem estado; não oferece implantação independente por domínio.

## 2. Evidências e análise da transição (aspectos técnicos)

| Elemento | Situação encontrada nos documentos originais | Decisão após atualização |
|---|---|---|
| Tecnologia | README antigo: Java, Spring, PostgreSQL, HTML/CSS/JavaScript. | Substituir a diretriz desatualizada por JavaScript + Node.js + Next.js + PostgreSQL. Registrar a decisão no README. |
| Topologia | Roadmap: vários microsserviços com gateway, REST entre serviços e eventos assíncronos. | Uma aplicação Next.js, sem gateway próprio ou comunicação HTTP entre módulos internos. |
| Banco | PostgreSQL e outras alternativas por domínio. | Um PostgreSQL, ownership lógico de tabelas, migrations, constraints e transações ACID. |

As linhas de funcionalidades, front-end, plataforma e estado do repositório constam na Parte 2 (gestão de projetos). Nota: o repositório contém README, ROADMAP, .gitignore e arquivos de teste/texto, sem aplicação implantável; trata-se de projeto arquitetural prospectivo, não migração de código Spring existente.

### 2.1. Justificativa da arquitetura escolhida

- **Manutenibilidade:** apresentação, negócio e persistência separadas por contratos de funções; cada Squad possui seu domínio e revisa alterações nele.
- **Consistência:** transações PostgreSQL para operações de XP/Gold/estoque, com idempotência e controle de concorrência.
- **Escalabilidade pragmática:** Next.js replicável em Node.js, renderização server-side e consultas paginadas/otimizadas; a base relacional segue como gargalo potencial a medir.
- **Segurança:** autenticação centralizada, autorização revalidada em cada caso de uso e nenhum segredo ou SQL no bundle do navegador.
- **Aderência pedagógica:** apenas um estilo arquitetural, apesar de utilizar subcamadas internas e modularização por domínio.

## 3. Arquitetura exclusivamente em camadas

```text
 USUÁRIO / NAVEGADOR
        |
        | HTTPS
        v
 +------------------------------------------------------------+
 | CAMADA 1 — APRESENTAÇÃO                                    |
 | Next.js App Router: page.jsx, layout.jsx, componentes      |
 | Client Components, Server Components, Route Handlers       |
 | Sessão/cookies, validação de entradas e contratos HTTP     |
 +---------------------------+--------------------------------+
                             | chama funções do servidor
                             v
 +------------------------------------------------------------+
 | CAMADA 2 — NEGÓCIO                                         |
 | Subcamada Aplicação: services, casos de uso, orquestração  |
 | Subcamada Domínio: políticas, invariantes, regras de XP    |
 | Auth · Quests · Guildas · Recompensas · Analytics          |
 +---------------------------+--------------------------------+
                             | chama repositórios
                             v
 +------------------------------------------------------------+
 | CAMADA 3 — PERSISTÊNCIA                                    |
 | Repositories, consultas SQL parametrizadas, pool `pg`,     |
 | escopo de transação, mapeamento linha <-> objeto           |
 +---------------------------+--------------------------------+
                             | SQL / transações
                             v
 +------------------------------------------------------------+
 | CAMADA 4 — DADOS                                           |
 | PostgreSQL: tabelas, índices, constraints, migrations      |
 +------------------------------------------------------------+
```

| Camada | Subcamadas e componentes | O que pode fazer | O que não pode fazer |
|---|---|---|---|
| 1. Apresentação | Páginas, componentes, Route Handlers `/api/v1`, formulários, cookies/sessão, validação sintática e respostas HTTP. | Exibir dados, receber comandos e chamar Services. | Conter SQL, calcular XP/Gold ou acessar repositório diretamente. |
| 2. Negócio | Aplicação: serviços/casos de uso. Domínio: entidades lógicas, políticas, validações de negócio. | Autorizar operações, aplicar regras, coordenar transações e composição de serviços. | Importar `page.jsx`, manipular DOM ou emitir respostas HTTP diretamente. |
| 3. Persistência | `pg`, connection pool, repositórios, queries analíticas, transação SQL. | Executar comandos parametrizados e garantir acesso consistente ao banco. | Decidir pontuação, direitos de acesso funcionais ou comportamento de UI. |
| 4. Dados | PostgreSQL, tabelas por domínio, índices, FK, constraints e scripts SQL. | Impor integridade, unicidade, isolamento e persistência. | Servir como canal de comunicação informal entre Squads com gravações cruzadas. |

**Regra de dependência:** Apresentação → Negócio → Persistência → PostgreSQL. Componentes de domínio podem ser usados dentro da camada de negócio. Utilitários de configuração/testes são elementos transversais e não constituem uma quinta camada.

### 3.1. Convenções específicas do Next.js

1. Usar App Router com arquivos `src/app/**/page.jsx` e `src/app/api/**/route.js`; toda operação SQL deve executar no servidor em runtime Node.js. A publicação como site totalmente estático (`output: 'export'`) não atende aos fluxos autenticados e transacionais.
2. Server Components podem chamar os Services diretamente no servidor. Não fazer fetch da própria API `/api` dentro de Server Components: isso adiciona uma requisição HTTP desnecessária. Client Components interativos acessam os Route Handlers ou ações de servidor explicitamente controladas; esta proposta padroniza Route Handlers para as mutações.
3. O `"use client"` pertence somente aos componentes que necessitam estado, eventos e APIs do navegador. Módulos de business e persistence devem ser server-only e nunca importados por Client Components.
4. Controllers de HTTP passam a ser Route Handlers (`route.js`), substituindo classes `@RestController` do desenho Java. Serviços passam a ser módulos/funções JavaScript, em vez de `@Service`; repositórios substituem Spring Data.
5. Onde houver acesso ao PostgreSQL, assegurar `runtime = 'nodejs'` quando apropriado, nunca Edge Runtime. No servidor, rotas e visualizações de dados pessoais devem ser dinâmicas e ter caching desabilitado ou invalidado explicitamente após mutações.
6. JavaScript `.js` / `.jsx` é a linguagem adotada. TypeScript não é requisito nem foi introduzido nesta proposta. Podem ser adotados JSDoc, validação de payloads e lint para melhorar contratos.

### 3.2. Segurança e consistência

- Squad 1 mantém login, registro, sessões, hashing de senhas com biblioteca auditada, expiração e política de papéis. Se JWT for utilizado, preferir cookie `HttpOnly`, `Secure` e `SameSite` adequado; não guardar token sensível em `localStorage`. Tokens devem ser assinados, expirados e validados em toda rota protegida. JWT é uma escolha de implementação, coerente com o roadmap, não solução de autorização por si só.
- Route Handlers verificam sessão, formato e origem da requisição; Services verificam autorização de negócio e ownership. Endpoints de mutação também requerem medidas antifalsificação de requisições (por exemplo, verificação de `Origin`/CSRF conforme o fluxo de cookies).
- Repositórios usam queries parametrizadas e menor privilégio no banco. Segredos ficam em variáveis privadas do servidor, jamais com prefixo `NEXT_PUBLIC_`.
- Transações com `pg` usam um mesmo client do pool do `BEGIN` ao `COMMIT`/`ROLLBACK`. Não misturar `pool.query()` com comandos que participem da transação iniciada naquele client.

## 4. Fluxos críticos entre camadas

### 4.1. Conclusão de quest, XP e Gold

1. Apresentação: o usuário envia `POST /api/v1/quests/{id}/complete`; `route.js` obtém identidade, valida payload e chave de idempotência.
2. Negócio — Squad 2: `completeQuest()` verifica autorização, regras e se a conclusão já existe; calcula XP e possíveis níveis/badges.
3. Negócio — Squad 4: o caso de uso chama `creditGoldForQuest(conclusionId, userId, amount, tx)` com identificador único da origem.
4. Persistência: repositórios dos dois Squads compartilham o mesmo client transacional PostgreSQL, sem abrir transação independente no módulo de Gold.
5. Dados: constraints de unicidade e `COMMIT` impedem conclusão/crédito duplicado; uma falha faz `ROLLBACK` de XP e Gold.
6. Leitura analítica — Squad 6: rankings consultam o estado já confirmado, conforme políticas de autorização e atualização.

**Contrato de integração:** um `transactionManager.withTransaction(async (tx) => ...)` compartilhado pela aplicação é uma utilidade de persistência, e `tx` é propagado entre repositórios e chamadas de Services que participam do mesmo caso de uso. A implementação concreta deve evitar transações aninhadas independentes.

### 4.2. Resgate de recompensa

1. `POST /api/v1/rewards/{id}/redeem` valida usuário e idempotência.
2. `redeemReward()` verifica autorização, preço, saldo e estoque, e aplica bloqueio/atualização condicional apropriado.
3. Na mesma transação, debita Gold, registra ledger, reduz estoque e cria `redemption`.
4. Resgates concorrentes não podem gerar estoque negativo nem débito duplicado; falhas resultam em rollback.

### 4.3. Ranking e dashboard

1. Página ou Route Handler chama `getLeaderboard({ scope, period, cursor })`.
2. Service valida escopo, filtro temporal e permissão; Repository executa SQL paginado, com índices e desempate previsível.
3. O resultado retorna a camada de apresentação. É necessário medir latência e refletir o estado confirmado do banco, respeitando política de cache explícita para cada tela.

### 4.4. Contratos HTTP iniciais (propostos)

| Domínio | Exemplos sob `/api/v1` | Propriedades obrigatórias |
|---|---|---|
| Squad 1 | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /users/me` | Sessão segura; rate limiting de login; erros sem exposição de credenciais. |
| Squad 2 | `GET /quests`, `POST /quests`, `POST /quests/{id}/complete` | Autorização; validação; idempotência; retorno de XP/progresso. |
| Squad 3 | `GET /guilds`, `POST /guilds`, `POST /guilds/{id}/members` | Ownership e papéis em guildas; validação de vínculo. |
| Squad 4 | `GET /rewards`, `GET /wallet`, `POST /rewards/{id}/redeem` | Transação, saldo, estoque e idempotência. |
| Squad 6 | `GET /leaderboards`, `GET /analytics/summary`, `GET /reports/export` | Filtros, paginação, permissão, limite de exportação. |

Os endpoints são contratos propostos, não rotas existentes no ZIP. Especificação OpenAPI e exemplos JSON devem ser registrados por domínio, sem desviar da arquitetura em camadas.

## 5. Estrutura de arquivos e diretórios proposta

Critério: diretórios de código agrupados primeiro por camada e, dentro dela, por domínio. As rotas e páginas seguem obrigatoriamente as convenções do App Router do Next.js. Não existem cinco aplicações, workspaces ou serviços Node separados.

```text
questify/
├── README.md                         # atualizar stack e execução
├── ROADMAP.md                        # registrar ajuste arquitetural
├── package.json                      # um projeto Next.js/Node.js
├── package-lock.json
├── next.config.mjs
├── jsconfig.json                     # alias @/src ou @/*
├── .env.example                      # DATABASE_URL, AUTH_SECRET etc.
├── .gitignore
├── Dockerfile                        # opcional: deploy do monólito
├── compose.yaml                      # Next.js + PostgreSQL local
├── .github/
│   └── workflows/ci.yml
├── docs/
│   ├── architecture/layers.md
│   ├── architecture/adr-001-stack-e-camadas.md
│   ├── api/openapi.yaml
│   ├── squad-ownership.md
│   └── runbook.md
├── public/
│   └── images/
├── src/
│   ├── app/                          # CAMADA 1 — APRESENTAÇÃO
│   │   ├── layout.jsx
│   │   ├── page.jsx
│   │   ├── globals.css
│   │   ├── (public)/
│   │   │   ├── login/page.jsx        # Squad 1
│   │   │   └── register/page.jsx     # Squad 1
│   │   ├── (protected)/
│   │   │   ├── layout.jsx            # sessão/autorização
│   │   │   ├── quests/page.jsx       # Squad 2
│   │   │   ├── guilds/page.jsx       # Squad 3
│   │   │   ├── rewards/page.jsx      # Squad 4
│   │   │   └── leaderboard/page.jsx  # Squad 6
│   │   └── api/v1/
│   │       ├── auth/
│   │       │   ├── login/route.js    # Squad 1
│   │       │   ├── logout/route.js
│   │       │   └── register/route.js
│   │       ├── users/me/route.js
│   │       ├── quests/
│   │       │   ├── route.js          # Squad 2
│   │       │   └── [id]/complete/route.js
│   │       ├── guilds/
│   │       │   ├── route.js          # Squad 3
│   │       │   └── [id]/members/route.js
│   │       ├── rewards/
│   │       │   ├── route.js          # Squad 4
│   │       │   └── [id]/redeem/route.js
│   │       ├── wallet/route.js
│   │       ├── leaderboards/route.js # Squad 6
│   │       ├── analytics/summary/route.js
│   │       └── reports/export/route.js
│   ├── presentation/                 # CAMADA 1 — COMPONENTES
│   │   ├── components/
│   │   │   ├── shared/               # UI acordada entre Squads
│   │   │   ├── auth/                 # Squad 1
│   │   │   ├── quests/               # Squad 2
│   │   │   ├── social/               # Squad 3
│   │   │   ├── rewards/              # Squad 4
│   │   │   └── analytics/            # Squad 6
│   │   ├── security/
│   │   │   ├── session.js            # Squad 1; código server-only
│   │   │   └── require-user.js
│   │   └── validation/               # contratos de payload
│   ├── business/                     # CAMADA 2 — NEGÓCIO
│   │   ├── application/
│   │   │   ├── auth/auth.service.js          # Squad 1
│   │   │   ├── quests/
│   │   │   │   ├── quest.service.js          # Squad 2
│   │   │   │   └── complete-quest.js
│   │   │   ├── social/
│   │   │   │   ├── guild.service.js          # Squad 3
│   │   │   │   └── membership.service.js
│   │   │   ├── rewards/
│   │   │   │   ├── wallet.service.js         # Squad 4
│   │   │   │   └── redemption.service.js
│   │   │   └── analytics/
│   │   │       ├── leaderboard.service.js    # Squad 6
│   │   │       └── report.service.js
│   │   └── domain/
│   │       ├── auth/user-policy.js
│   │       ├── quests/{xp-policy,level-policy}.js
│   │       ├── social/guild-policy.js
│   │       ├── rewards/{gold-policy,reward-policy}.js
│   │       └── analytics/ranking-policy.js
│   ├── persistence/                  # CAMADA 3 — PERSISTÊNCIA
│   │   ├── postgres/
│   │   │   ├── pool.js               # driver `pg`
│   │   │   └── transaction.js        # 1 client por transação
│   │   ├── repositories/
│   │   │   ├── auth/users.repository.js
│   │   │   ├── quests/quests.repository.js
│   │   │   ├── quests/progress.repository.js
│   │   │   ├── social/guilds.repository.js
│   │   │   ├── rewards/wallets.repository.js
│   │   │   ├── rewards/redemptions.repository.js
│   │   │   └── analytics/leaderboard.repository.js
│   │   └── analytics/queries/
│   │       ├── individual-ranking.sql
│   │       └── guild-ranking.sql
│   └── shared/                       # utilitários; NÃO é camada
│       ├── errors.js
│       └── constants.js
├── database/                         # CAMADA 4 — DADOS
│   ├── migrations/
│   │   ├── 001_identity.sql          # Squad 1
│   │   ├── 002_quests.sql            # Squad 2
│   │   ├── 003_social.sql            # Squad 3
│   │   ├── 004_rewards.sql           # Squad 4
│   │   └── 005_analytics_indexes.sql # Squad 6 + donos
│   └── seeds/dev.sql
├── scripts/
│   └── migrate.js                    # runner de migrations
└── tests/
    ├── unit/{auth,quests,social,rewards,analytics}/
    ├── integration/{auth,quests,social,rewards,analytics}/
    └── e2e/
```

**Observações da árvore:** a notação `{a,b}` abrevia arquivos distintos (`xp-policy.js`, `level-policy.js` etc.), não nomes literais de diretórios. `database/` representa scripts do PostgreSQL; o servidor de banco opera fora do diretório do aplicativo. `.env.example` nunca contém segredos reais. A estrutura exata pode ser enxugada no MVP sem violar a direção das dependências.

## 6. Critérios técnicos de aceitação e riscos técnicos

| Verificação | Resultado esperado |
|---|---|
| Estilo único | Somente Apresentação → Negócio → Persistência → Dados; sem serviços separados, gateway, barramento ou arquitetura híbrida. |
| Stack atualizada | Apenas JavaScript, Node.js, Next.js, PostgreSQL como tecnologias-base; nenhum vestígio de Spring/Java na aplicação proposta. |
| Fronteiras | Client Components sem importar `business`/`persistence`; Route Handlers não contêm SQL; Service não importa `page.jsx` ou DOM. |
| Segurança | Credenciais com hash forte; cookie/sessão seguros; validação de sessão e ownership; consultas parametrizadas; segredos protegidos. |
| Consistência | Unicidade de conclusão e crédito; resgates idempotentes; saldo/estoque não negativos; transações testadas sob concorrência. |
| Performance | Consultas de ranking paginadas e indexadas; tempo de resposta mensurado. A referência do README de até 500 ms deve ser validada sob uma carga definida, não presumida. |

| Risco/decisão | Consequência | Mitigação |
|---|---|---|
| Node.js/Next.js usados como dois backends independentes | Duplicação de infraestrutura e violação da simplicidade proposta. | Um Next.js full-stack sobre runtime Node.js; sem Express separado. |
| Mistura de código de servidor com Client Components | Vazamento de segredos, dependências inválidas e risco de segurança. | Módulos server-only, lint e revisão obrigatória das fronteiras. |
| Rota HTTP chamando diretamente SQL | Regras dispersas, baixa testabilidade e acoplamento. | Rota → Service → Repository; testes de arquitetura. |
| XP e Gold alterados em transações diferentes | Créditos inconsistentes após falhas parciais. | Um client PostgreSQL e uma transação por caso de uso. |
| Banco único e aplicação única | Escala independente entre domínios indisponível. | Medição de carga, índices, pool, consultas eficientes e réplicas sem estado. |
| Analytics com caching indevido | Rankings defasados após conclusão/resgate. | Políticas explícitas de cache e revalidação; consultas à fonte confirmada. |

## Referências e rastreabilidade

- Fontes internas inspecionadas: `README.md` (atributos de qualidade, stack antiga e organização em camadas) e `ROADMAP.md` (produto, microsserviços, escopo dos Squads e planejamento), ambos no ZIP `gcet1010-2026.2-main.zip`.
- Atualização fornecida pelo usuário: comunicado de alteração para JavaScript, Node.js/Next.js e PostgreSQL (10/11/2026).
- Documentação técnica consultada: Next.js, Route Handlers / App Router — arquivos `route.js` dentro de `app`.
- Next.js, Backend for Frontend — Server Components acessam serviços/dados diretamente, sem requisitar a própria API.
- Next.js, Server and Client Components — divisão servidor/navegador.
- node-postgres, Transactions — uso do mesmo client durante uma transação.
