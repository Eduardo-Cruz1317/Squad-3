# Relatório técnico — Arquitetura em camadas do Questify

**Atualização de stack:** JavaScript · Node.js · Next.js · PostgreSQL  
**Projeto:** Questify — Plataforma Gamificada de Produtividade Acadêmica  
**Repositório analisado:** `gcet1010-2026.2-main.zip`  
**Data da revisão:** 10 de novembro de 2026  
**Escopo de execução:** **Squad 1, Squad 2, Squad 3, Squad 4 e Squad 6 — exclusivamente**  
**Arquitetura-alvo:** **monólito modular organizado exclusivamente em camadas**, implementado como uma aplicação full-stack Next.js executada em Node.js.

> **Controle de mudança.** O `README.md` contido no ZIP ainda menciona Java/Spring e HTML/CSS/JavaScript. A nova stack informada posteriormente pelo projeto é **JavaScript, Node.js/Next.js e PostgreSQL**; esta revisão a trata como a **diretriz mais recente**, que deverá ser incorporada ao README e aprovada formalmente. O `ROADMAP.md` planeja microsserviços, API Gateway e barramento de eventos: o desenho abaixo é **proposta de substituição** por uma arquitetura somente em camadas. O ZIP não contém código de produção; por isso, não se afirma existir um sistema já migrado.

## 1. Resumo executivo e contexto do negócio

O Questify gamifica produtividade acadêmica com **quests e tarefas**, **XP e níveis**, **guildas e interações sociais**, uma **moeda virtual (Gold)**, **recompensas resgatáveis**, **rankings**, **dashboards** e **relatórios**. O objetivo técnico é entregar essas capacidades com fronteiras de responsabilidade claras, segurança, consistência de dados, evolução incremental e operação acessível aos cinco Squads.

**Decisão arquitetural:** uma **única aplicação Next.js** usando App Router para páginas, componentes de interface e Route Handlers HTTP; **Node.js** é o ambiente de execução do servidor Next.js, **não** um segundo backend obrigatório. Serviços JavaScript concentram os casos de uso e as regras; repositórios executam SQL parametrizado; **PostgreSQL** é a fonte persistente de verdade. **Não** se acrescentam Express, NestJS, microserviços, gateway dedicado, filas, Clean Architecture, Hexagonal ou eventos distribuídos como parte da solução.

A opção torna mais simples assegurar, em uma mesma transação SQL, a conclusão da quest, a atribuição de XP e Gold, e os resgates de recompensas. A escalabilidade inicial é por otimização de consulta, índices, pool de conexões e **réplicas da aplicação sem estado**; **não** oferece implantação independente por domínio.

## 2. Evidências e análise da transição

| Elemento | Situação encontrada nos documentos originais | Decisão após atualização |
|---|---|---|
| Funcionalidades | Roadmap: identidade, quests, social, economia, ranking e relatórios; notificações e outras frentes também previstas. | Preservar funcionalidades dos **cinco Squads selecionados**; notificações em tempo real ficam fora deste recorte. |
| Tecnologia | README antigo: Java, Spring, PostgreSQL, HTML/CSS/JavaScript. | **Substituir** a diretriz desatualizada por JavaScript + Node.js + Next.js + PostgreSQL. Registrar a decisão no README. |
| Topologia | Roadmap: vários microsserviços com gateway, REST entre serviços e eventos assíncronos. | **Uma aplicação Next.js**, sem gateway próprio ou comunicação HTTP entre módulos internos. |
| Front-end | Roadmap: Squad 7 dedicado à SPA/PWA. | **UI dividida entre os cinco Squads** por domínio; nenhum Squad 7 incluído. |
| Plataforma | Roadmap: Squad 8 com DevOps/gateway. | Build, CI, scripts, implantação e observabilidade são **responsabilidades compartilhadas** dos cinco, sem Squad 8. |
| Banco | PostgreSQL e outras alternativas por domínio. | **Um PostgreSQL**, ownership lógico de tabelas, migrations, constraints e transações ACID. |
| Estado do repositório | README, ROADMAP, `.gitignore` e arquivos de teste/texto; nenhuma aplicação implantável. | **Projeto arquitetural prospectivo**, não migração de código Spring existente. |

### 2.1. Justificativa da arquitetura escolhida

- **Manutenibilidade:** apresentação, negócio e persistência separadas por contratos de funções; cada Squad possui seu domínio e revisa alterações nele.
- **Consistência:** transações PostgreSQL para operações de XP/Gold, com idempotência e controle de concorrência.
- **Escalabilidade pragmática:** Next.js replicável em Node.js, renderização server-side e consultas paginadas/otimizadas; a base relacional segue como gargalo potencial a medir.
- **Segurança:** autenticação centralizada, autorização revalidada em cada caso de uso e nenhum segredo ou SQL no bundle do navegador.
- **Aderência pedagógica:** apenas **um estilo arquitetural**, apesar de utilizar subcamadas internas e modularização por domínio.

## 3. Arquitetura exclusivamente em camadas

```text
  USUÁRIO / NAVEGADOR
           |
           | HTTPS
           v
  +------------------------------------------------------------+
  | CAMADA 1 — APRESENTAÇÃO                                     |
  | Next.js App Router: page.jsx, layout.jsx, componentes       |
  | Client Components, Server Components, Route Handlers       |
  | Sessão/cookies, validação de entradas e contratos HTTP     |
  +---------------------------+--------------------------------+
                              | chama funções do servidor
                              v
  +------------------------------------------------------------+
  | CAMADA 2 — NEGÓCIO                                         |
  | Subcamada Aplicação: services, casos de uso, orquestração   |
  | Subcamada Domínio: políticas, invariantes, regras de XP     |
  | Auth · Quests · Guildas · Recompensas · Analytics           |
  +---------------------------+--------------------------------+
                              | chama repositórios
                              v
  +------------------------------------------------------------+
  | CAMADA 3 — PERSISTÊNCIA                                     |
  | Repositories, consultas SQL parametrizadas, pool `pg`,     |
  | escopo de transação, mapeamento linha ↔ objeto              |
  +---------------------------+--------------------------------+
                              | SQL / transações
                              v
  +------------------------------------------------------------+
  | CAMADA 4 — DADOS                                            |
  | PostgreSQL: tabelas, índices, constraints, migrations       |
  +------------------------------------------------------------+
```

| Camada | Subcamadas e componentes | O que **pode** fazer | O que **não pode** fazer |
|---|---|---|---|
| **1. Apresentação** | Páginas, componentes, Route Handlers `/api/v1`, formulários, cookies/sessão, validação sintática e respostas HTTP. | Exibir dados, receber comandos e chamar Services. | Conter SQL, calcular XP/Gold ou acessar repositório diretamente. |
| **2. Negócio** | **Aplicação:** serviços/casos de uso. **Domínio:** entidades lógicas, políticas, validações de negócio. | Autorizar operações, aplicar regras, coordenar transações e composição de serviços. | Importar `page.jsx`, manipular DOM ou emitir respostas HTTP diretamente. |
| **3. Persistência** | `pg`, connection pool, repositórios, queries analíticas, transação SQL. | Executar comandos parametrizados e garantir acesso consistente ao banco. | Decidir pontuação, direitos de acesso funcionais ou comportamento de UI. |
| **4. Dados** | PostgreSQL, tabelas por domínio, índices, FK, constraints e scripts SQL. | Impor integridade, unicidade, isolamento e persistência. | Servir como canal de comunicação informal entre Squads com gravações cruzadas. |

**Regra de dependência:** `Apresentação → Negócio → Persistência → PostgreSQL`. Componentes de domínio podem ser usados dentro da camada de negócio. Utilitários de configuração/testes são elementos transversais e **não constituem uma quinta camada**.

### 3.1. Convenções específicas do Next.js

1. Usar **App Router** com arquivos `src/app/**/page.jsx` e `src/app/api/**/route.js`; toda operação SQL deve executar no servidor em **runtime Node.js**. A publicação como site totalmente estático (`output: 'export'`) **não** atende aos fluxos autenticados e transacionais.
2. **Server Components** podem chamar os Services diretamente no servidor. **Não** fazer `fetch` da própria API `/api` dentro de Server Components: isso adiciona uma requisição HTTP desnecessária. **Client Components** interativos acessam os Route Handlers ou ações de servidor explicitamente controladas; esta proposta padroniza **Route Handlers** para as mutações.
3. O `"use client"` pertence somente aos componentes que necessitam estado, eventos e APIs do navegador. Módulos de `business` e `persistence` devem ser **server-only** e nunca importados por Client Components.
4. Controllers de HTTP passam a ser **Route Handlers** (`route.js`), substituindo classes `@RestController` do desenho Java. Serviços passam a ser módulos/funções JavaScript, em vez de `@Service`; repositórios substituem Spring Data.
5. Onde houver acesso ao PostgreSQL, assegurar `runtime = 'nodejs'` quando apropriado, nunca Edge Runtime. No servidor, rotas e visualizações de dados pessoais devem ser dinâmicas e ter **caching desabilitado ou invalidado explicitamente** após mutações.
6. **JavaScript `.js`/`.jsx`** é a linguagem adotada. TypeScript não é requisito nem foi introduzido nesta proposta. Podem ser adotados JSDoc, validação de payloads e lint para melhorar contratos.

### 3.2. Segurança e consistência

- **Squad 1** mantém login, registro, sessões, hashing de senhas com biblioteca auditada, expiração e política de papéis. Se JWT for utilizado, preferir cookie `HttpOnly`, `Secure` e `SameSite` adequado; não guardar token sensível em `localStorage`. Tokens devem ser assinados, expirados e validados em toda rota protegida. JWT é uma **escolha de implementação**, coerente com o roadmap, não solução de autorização por si só.
- Route Handlers verificam sessão, formato e origem da requisição; **Services verificam autorização de negócio e ownership**. Endpoints de mutação também requerem medidas antifalsificação de requisições (por exemplo, verificação de `Origin`/CSRF conforme o fluxo de cookies).
- Repositórios usam **queries parametrizadas** e menor privilégio no banco. Segredos ficam em variáveis privadas do servidor, jamais com prefixo `NEXT_PUBLIC_`.
- Transações com `pg` usam **um mesmo client do pool** do `BEGIN` ao `COMMIT`/`ROLLBACK`. Não misturar `pool.query()` com comandos que participem da transação iniciada naquele client.

## 4. Mapeamento obrigatório — Squad × camada de foco × subcamadas

| Squad | Domínio | **Camada de foco** | **Subcamadas de foco** | Responsabilidades principais |
|---|---|---|---|---|
| **Squad 1** | Identidade e Acesso | **1 — Apresentação** | `app/api/v1/auth`, páginas de login/cadastro, `presentation/security`, DTOs/validação; apoio em `business/auth`, `persistence/auth`. | Cadastro, login, logout, sessão/JWT, perfis, papéis e regras de acesso; convenções de autenticação para os demais Squads. |
| **Squad 2** | Quests e Gamificação | **2 — Negócio** | `business/application/quests`, `business/domain/quests`, `business/domain/progression`; apoio em `app/api/v1/quests` e `persistence/quests`. | CRUD e conclusão de quests; XP e niveis, idempotência; coordenar crédito Gold com Squad 4. |
| **Squad 3** | Guildas e Social | **2 — Negócio** | `business/application/social`, `business/domain/social`; apoio em `app/api/v1/guilds` e `persistence/social`. | Guildas, convites, membros, administração, feed, comentários/reações, permissões sociais; dados de composição para rankings. |
| **Squad 4** | Marketplace e Recompensas | **2 — Negócio** | `business/application/rewards`, `business/domain/rewards`, com apoio crítico de `persistence/repositories/rewards` e `database/migrations/004_rewards.sql`. | Catálogo fixo de recompensas, Gold, carteira e extrato (ledger), inventário de itens, efeitos ativos e resgates; limites semanais e regras de acúmulo; controle de concorrência, atomicidade e prevenção de saldo negativo. |
| **Squad 6** | Leaderboard e Analytics | **3 — Persistência** | `persistence/analytics/queries`, `persistence/analytics/repositories`, com apoio em `business/application/analytics` e telas/rotas próprias. | Rankings individuais, por guilda e turma; consultas SQL, agregações, dashboards e exportação CSV; tuning de índices e paginação. |

**Interpretação do foco:** a camada de foco identifica a especialidade principal, **não** limita o Squad a modificar apenas uma camada. Cada um entrega seu fluxo vertical completo (UI + endpoint + service + repository + migração). A equipe **não** cria Squads 5, 7 ou 8 para absorver notificações, front-end ou DevOps.

### 4.1. Responsabilidades e entregáveis concretos

**Squad 1 — Apresentação e segurança.** Mantém `app/(public)/login`, `app/(public)/register`, `app/api/v1/auth/**`, componentes de autenticação e guardas de sessão. Define o contrato de identidade (`userId`, papéis, status), a biblioteca de autenticação, testes de rota protegida e exemplos reutilizáveis. Mantém seus Services, repositórios e tabelas de usuário. **Não** centraliza toda a UI: cada Squad implementa as páginas do próprio domínio.

**Squad 2 — Aplicação e regras de progressão.** Mantém `completeQuest()`, `calculateXp()` e `resolveLevel()`. Define chave única da conclusão e regras de pontuação, validando quem pode concluir e impedindo XP duplicado. Solicita o crédito de Gold à interface de aplicação mantida pelo Squad 4 — sem escrever diretamente no ledger.

**Squad 3 — Domínio social.** Mantém `createGuild()`, `joinGuild()`, `manageMembership()` e operações de feed. Regula papéis e vínculos, valida autorizações sociais e fornece consultas estáveis de membros e guildas para ranking. Não manipula XP, Gold ou ranking como fontes de verdade.

**Squad 4 — Economia transacional e recompensas.** Mantém `creditGoldForQuest()`, `redeemReward()`, `getActiveEffects()` e `consumeItem()`, além das políticas de preço, limite semanal e acúmulo de recompensas. O catálogo é **fixo na versão beta** (carregado por seed, sem cadastro de recompensas). É o **único** Squad autorizado a alterar saldo, lançamentos de Gold, inventário de itens e efeitos ativos. O valor de Gold de cada quest é definido pelo Squad 2 e recebido como parâmetro (`amount`); o Squad 4 não calcula Gold de quest, e define apenas os preços das recompensas a partir desses valores. Impõe transações ACID, idempotência e controle concorrente com locks/updates condicionais e constraints; mantém o histórico de transações (extrato de Gold e lista de resgates) e implementa testes de resgate simultâneo.

**Squad 6 — Leitura analítica.** Mantém consultas filtradas e paginadas, ranking e desempate determinístico, sumários de XP/Gold e exportação CSV. Usa **leitura autorizada** das tabelas originárias, sem alterar seus dados. Mudanças de índice nas tabelas de outro domínio são revisadas com o Squad proprietário. Evita cache que exiba posição obsoleta após commit, a menos que haja requisito de atualização explícito.

### 4.2. Ownership e integrações

| Ativo/contrato | Dono | Dependentes e regras de integração |
|---|---|---|
| `users`, perfis, sessão e papéis | **Squad 1** | Todos usam `requireUser()` e políticas públicas; sem implementar autenticação em paralelo. |
| `quests`, `quest_completions`, XP/níveis | **Squad 2** | Squad 4 recebe pedido de crédito por **Service**; Squad 6 consulta dados consolidados. |
| `guilds`, `guild_memberships`, feed | **Squad 3** | Squad 6 usa leituras de membros; alterações exigem revisão do Squad 3. |
| `wallets`, `gold_ledger`, `rewards`, `item_types`, `redemptions`, `user_items`, `user_active_effects` | **Squad 4** | Squad 2 invoca `creditGoldForQuest()`, consulta `getActiveEffects()` e chama `consumeItem()` no uso de Prorrogação de prazo; o módulo de sequência chama `consumeItem()` para proteções. Nenhum outro Squad escreve nessas tabelas; Squad 6 apenas consulta leituras permitidas. |
| Sequência de atividades (tabela e regras de sequência) | **Squad 6** | Squad 4 chama `canRecoverStreak()` e `restoreStreak()` no resgate de Recuperar sequência; a conclusão de quest precisa registrar a atividade na sequência. |
| Queries de ranking, dashboard e exportação | **Squad 6** | Todos podem exibir seus resultados; sem update sobre tabelas de origem. |
| Interface Next.js (`page.jsx`, componentes) | **Cada Squad em seu domínio** | Padrões de layout, acessibilidade e estilos acordados pelos cinco. |
| `package.json`, CI, banco local, deploy, documentação | **Cinco Squads conjuntamente** | Responsável rotativo por sprint; revisões por propriedade do domínio; nenhuma nova equipe. |

## 5. Fluxos críticos entre camadas

### 5.1. Conclusão de quest, XP e Gold

1. **Apresentação:** o usuário envia `POST /api/v1/quests/{id}/complete`; `route.js` obtém identidade, valida payload e chave de idempotência.
2. **Negócio — Squad 2:** `completeQuest()` verifica autorização, regras e se a conclusão já existe; calcula XP aplicando o multiplicador quando `getActiveEffects(userId, tx)` (Squad 4) retornar XP em dobro ativo,  e possíveis níveis.
3. **Negócio — Squad 4:** o caso de uso chama `creditGoldForQuest(conclusionId, userId, amount, tx)` com identificador único da origem. O Squad 4 grava o lançamento CREDIT no `gold_ledger` e atualiza `wallets` usando o mesmo `tx`.
4. **Persistência:** repositórios dos dois Squads compartilham **o mesmo client transacional PostgreSQL**, sem abrir transação independente no módulo de Gold.
5. **Dados:** constraints de unicidade e `COMMIT` impedem conclusão/crédito duplicado; uma falha faz `ROLLBACK` de XP e Gold.
6. **Leitura analítica — Squad 6:** rankings consultam o estado já confirmado, conforme políticas de autorização e atualização.

**Contrato de integração:** um `transactionManager.withTransaction(async (tx) => ...)` compartilhado pela aplicação é uma **utilidade de persistência**, e `tx` é propagado entre repositórios e chamadas de Services que participam do mesmo caso de uso. A implementação concreta deve evitar transações aninhadas independentes.

### 5.2. Resgate de recompensa

1. `POST /api/v1/rewards/{id}/redeem` valida a sessão e a chave de idempotência. Se já existir resgate com a mesma chave para o aluno, retorna o resultado do resgate original, sem novo débito.
2. `redeemReward()` bloqueia a carteira do aluno (`SELECT ... FOR UPDATE`) e verifica: recompensa ativa no catálogo, saldo suficiente, limite semanal (contagem em `redemptions`) e regras de acúmulo (XP em dobro já ativo; total de proteções acima de 3; para Recuperar sequência, `canRecoverStreak()` do módulo de sequência).
3. Na **mesma transação**, debita `wallets`, registra o lançamento DEBIT no `gold_ledger`, cria `redemptions` e ativa o benefício conforme o tipo da recompensa:
   - **Item guardado:** soma a quantidade em `user_items` (Pacote de proteção soma 3).
   - **Efeito com duração:** cria linha em `user_active_effects` com expiração em 24 horas.
   - **Imediato (Recuperar sequência):** chama `restoreStreak()`; não vai ao inventário.
4. Qualquer falha ou regra violada resulta em `ROLLBACK` ou recusa antes do débito: saldo, inventário e histórico permanecem como estavam.
5. Resgates concorrentes do mesmo aluno são serializados pelo bloqueio da carteira; o saldo não fica negativo (`CHECK`) e não há débito duplicado (chave de idempotência única).

#### 5.2.1. Uso de itens guardados
 
**Prorrogação de prazo:**
 
1. Na loja ("Seus itens"), o aluno clica em **Usar** na Prorrogação de prazo.
2. Um pop-up lista as quests abertas do aluno (dados do `GET /quests`, Squad 2) e o aluno escolhe qual prorrogar.
3. O front chama `POST /api/v1/quests/{id}/extend-deadline` (Squad 2), que valida a quest, chama `consumeItem(userId, 'PRORROGACAO_PRAZO', 1, tx)` e soma 24 horas ao prazo no próprio registro da quest, na mesma transação.
4. Se não houver o item no inventário, nada é consumido e o prazo não muda.
   
**Proteção de sequência:** quando o módulo de sequência detecta dias sem atividade, chama `consumeItem(userId, 'PROTECAO_SEQUENCIA', diasPerdidos, tx)`. Se o aluno tiver unidades suficientes para todos os dias perdidos, a sequência é mantida; caso contrário, nada é consumido e a sequência reinicia.

### 5.3. Ranking e dashboard

1. Página ou Route Handler chama `getLeaderboard({ scope, period, cursor })`.
2. Service valida escopo, filtro temporal e permissão; Repository executa SQL paginado, com índices e desempate previsível.
3. O resultado retorna a camada de apresentação. É necessário medir latência e refletir o estado confirmado do banco, respeitando política de cache explícita para cada tela.

### 5.4. Contratos HTTP iniciais (propostos)

| Domínio | Exemplos sob `/api/v1` | Propriedades obrigatórias |
|---|---|---|
| Squad 1 | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /users/me` | Sessão segura; rate limiting de login; erros sem exposição de credenciais. |
| Squad 2 | `GET /quests`, `POST /quests`, `POST /quests/{id}/complete` | Autorização; validação; idempotência; retorno de XP/progresso. |
| Squad 3 | `GET /guilds`, `POST /guilds`, `POST /guilds/{id}/members` | Ownership e papéis em guildas; validação de vínculo. |
| Squad 4 | `GET /rewards`, `GET /wallet`, `GET /wallet/ledger`, `GET /inventory`, `GET /redemptions`, `POST /rewards/{id}/redeem` | Sessão; transação, saldo, limites semanais e de acúmulo, idempotência; extrato paginado. |
| Squad 6 | `GET /leaderboards`, `GET /analytics/summary`, `GET /reports/export` | Filtros, paginação, permissão, limite de exportação. |

Os endpoints são **contratos propostos**, não rotas existentes no ZIP. Especificação OpenAPI e exemplos JSON devem ser registrados por domínio, sem desviar da arquitetura em camadas.

## 6. Estrutura de arquivos e diretórios proposta

**Critério:** diretórios de código agrupados primeiro por **camada** e, dentro dela, por **domínio**. As rotas e páginas seguem obrigatoriamente as convenções do App Router do Next.js. **Não** existem cinco aplicações, workspaces ou serviços Node separados.

```text
questify/
├── README.md                            # atualizar stack e execução
├── ROADMAP.md                           # registrar ajuste arquitetural
├── package.json                         # um projeto Next.js/Node.js
├── package-lock.json
├── next.config.mjs
├── jsconfig.json                         # alias @/src ou @/*
├── .env.example                          # DATABASE_URL, AUTH_SECRET etc.
├── .gitignore
├── Dockerfile                            # opcional: deploy do monólito
├── compose.yaml                          # Next.js + PostgreSQL local
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
│   ├── app/                              # CAMADA 1 — APRESENTAÇÃO
│   │   ├── layout.jsx
│   │   ├── page.jsx
│   │   ├── globals.css
│   │   ├── (public)/
│   │   │   ├── login/page.jsx            # Squad 1
│   │   │   └── register/page.jsx         # Squad 1
│   │   ├── (protected)/
│   │   │   ├── layout.jsx                # sessão/autorização
│   │   │   ├── quests/page.jsx           # Squad 2
│   │   │   ├── guilds/page.jsx           # Squad 3
│   │   │   ├── rewards/page.jsx          # Squad 4
│   │   │   └── leaderboard/page.jsx      # Squad 6
│   │   └── api/v1/
│   │       ├── auth/
│   │       │   ├── login/route.js        # Squad 1
│   │       │   ├── logout/route.js
│   │       │   └── register/route.js
│   │       ├── users/me/route.js
│   │       ├── quests/
│   │       │   ├── route.js              # Squad 2
│   │       │   └── [id]/complete/route.js
│   │       ├── guilds/
│   │       │   ├── route.js              # Squad 3
│   │       │   └── [id]/members/route.js
│   │       ├── rewards/
│   │       │   ├── route.js              # Squad 4
│   │       │   └── [id]/redeem/route.js
│   │       ├── wallet/
│   │       │   ├── route.js              # Squad 4
│   │       │   └── ledger/route.js       # Squad 4: extrato de Gold
│   │       ├── inventory/route.js        # Squad 4: itens e efeitos ativos
│   │       ├── redemptions/route.js      # Squad 4: histórico de resgates
│   │       ├── leaderboards/route.js      # Squad 6
│   │       ├── analytics/summary/route.js
│   │       └── reports/export/route.js
│   ├── presentation/                     # CAMADA 1 — COMPONENTES
│   │   ├── components/
│   │   │   ├── shared/                    # UI acordada entre Squads
│   │   │   ├── auth/                      # Squad 1
│   │   │   ├── quests/                    # Squad 2
│   │   │   ├── social/                    # Squad 3
│   │   │   ├── rewards/                   # Squad 4: loja, "Seus itens", pop-up de prorrogação
│   │   │   └── analytics/                 # Squad 6
│   │   ├── security/
│   │   │   ├── session.js                 # Squad 1; código server-only
│   │   │   └── require-user.js
│   │   └── validation/                    # contratos de payload
│   ├── business/                         # CAMADA 2 — NEGÓCIO
│   │   ├── application/
│   │   │   ├── auth/auth.service.js       # Squad 1
│   │   │   ├── quests/
│   │   │   │   ├── quest.service.js       # Squad 2
│   │   │   │   └── complete-quest.js
│   │   │   ├── social/
│   │   │   │   ├── guild.service.js       # Squad 3
│   │   │   │   └── membership.service.js
│   │   │   ├── rewards/
│   │   │   │   ├── wallet.service.js      # Squad 4: creditGoldForQuest, saldo e extrato
│   │   │   │   ├── redemption.service.js  # redeemReward, histórico de resgates
│   │   │   │   ├── inventory.service.js   # consumeItem, inventário
│   │   │   │   └── reward-effect.service.js # getActiveEffects, ativação de efeitos
│   │   │   └── analytics/
│   │   │       ├── leaderboard.service.js # Squad 6
│   │   │       └── report.service.js
│   │   └── domain/
│   │       ├── auth/user-policy.js
│   │       ├── quests/{xp-policy,level-policy}.js
│   │       ├── social/guild-policy.js
│   │       ├── rewards/{gold-policy,reward-policy,reward-effect-policy}.js
│   │       └── analytics/ranking-policy.js
│   ├── persistence/                      # CAMADA 3 — PERSISTÊNCIA
│   │   ├── postgres/
│   │   │   ├── pool.js                    # driver `pg`
│   │   │   └── transaction.js             # 1 client por transação
│   │   ├── repositories/
│   │   │   ├── auth/users.repository.js
│   │   │   ├── quests/quests.repository.js
│   │   │   ├── quests/progress.repository.js
│   │   │   ├── social/guilds.repository.js
│   │   │   ├── rewards/wallets.repository.js        # Squad 4
│   │   │   ├── rewards/gold-ledger.repository.js
│   │   │   ├── rewards/rewards.repository.js
│   │   │   ├── rewards/redemptions.repository.js
│   │   │   ├── rewards/user-items.repository.js
│   │   │   ├── rewards/active-effects.repository.js
│   │   │   └── analytics/leaderboard.repository.js
│   │   └── analytics/queries/
│   │       ├── individual-ranking.sql
│   │       └── guild-ranking.sql
│   └── shared/                            # utilitários; NÃO é camada
│       ├── errors.js
│       └── constants.js
├── database/                              # CAMADA 4 — DADOS
│   ├── migrations/
│   │   ├── 001_identity.sql              # Squad 1
│   │   ├── 002_quests.sql                # Squad 2
│   │   ├── 003_social.sql                # Squad 3
│   │   ├── 004_rewards.sql               # Squad 4
│   │   └── 005_analytics_indexes.sql     # Squad 6 + donos
│   └── seeds/dev.sql
├── scripts/
│   └── migrate.js                        # runner de migrations
└── tests/
    ├── unit/{auth,quests,social,rewards,analytics}/
    ├── integration/{auth,quests,social,rewards,analytics}/
    └── e2e/
```

**Observações da árvore:** a notação `{a,b}` abrevia **arquivos distintos** (`xp-policy.js`, `level-policy.js` etc.), não nomes literais de diretórios. `database/` representa scripts do PostgreSQL; o servidor de banco opera fora do diretório do aplicativo. `.env.example` nunca contém segredos reais. A estrutura exata pode ser enxugada no MVP sem violar a direção das dependências. O catálogo fixo de recompensas é carregado pela própria migration `004_rewards.sql` (vale para todos os ambientes); `seeds/dev.sql` fica restrito a dados de desenvolvimento.


## 7. Plano de implementação por sprint

| Marco | Ações dos cinco Squads | Critério verificável |
|---|---|---|
| **Sprint 0 — Fundação** | Aprovar alteração de stack/arquitetura; atualizar README; iniciar Next.js JavaScript e PostgreSQL; definir convenções de camadas, migrations, contratos HTTP e CI. | `npm install`, `npm run dev`, conexão de teste e pipeline inicial operantes. |
| **Sprint 1 — Fatias mínimas** | Squad 1: login/sessão; Squad 2: quests; Squad 3: guildas;Squad 4: catálogo fixo e carteira; Squad 6: ranking simples. Todos entregam tela, rota, Service e Repository. | Cinco fluxos básicos executam em uma única aplicação e têm testes. |
| **Sprint 2 — Regras centrais** | XP/níveis, gestão de guildas, ledger/Gold, permissões e queries paginadas. | Regras unitárias e constraints críticas verificadas. |
| **Sprint 3 — Integração** | Quest concluída → XP → crédito de Gold → ranking;resgate simultâneo (saldo e limites), ativação de efeitos e uso de itens guardados. | Testes ponta a ponta, transação compartilhada, idempotência e rollback. |
| **Sprint 4 — Segurança e qualidade** | Revisar autorização em Server Components/rotas, CSRF, erros, validação, testes de integração e UX. | Pipelines bloqueiam regressões; endpoints privados protegidos. |
| **Sprint 5 — Desempenho e operação** | Medir p95 do ranking, índices, pool PostgreSQL, renderização e latência; logs e execução em produção Node.js. | Resultados de carga documentados; comportamento de cache explicitado. |
| **Sprints finais — Entrega** | Revisar acessibilidade, README, OpenAPI, manual de deploy e demonstração dos cinco módulos. | Implantação reproduzível e funcionalidades demonstradas. |

### 7.1. Práticas compartilhadas de engenharia

- Cada alteração em `business`, `persistence` ou `database` requer revisão do **Squad proprietário**; código transversal requer revisão cruzada.
- Entregar um PR vertical por funcionalidade; documentação e teste acompanham a alteração.
- Alterar apenas um artefato implantável; não transformar cada domínio em projeto, serviço HTTP ou banco independente.
- Testes podem usar o `node:test` e o executor escolhido pela equipe; dependências para `pg`, hash de senhas e JWT são **bibliotecas de implementação**, não uma mudança da stack.
- Manter scripts `dev`, `build`, `start`, `lint`, `test`, `db:migrate` no `package.json`. Fixar versões suportadas de Node.js/Next.js no repositório após validação, sem presumir números nesta proposta.

## 8. Critérios de aceitação e riscos

| Verificação | Resultado esperado |
|---|---|
| **Estilo único** | Somente Apresentação → Negócio → Persistência → Dados; sem serviços separados, gateway, barramento ou arquitetura híbrida. |
| **Stack atualizada** | Apenas JavaScript, Node.js, Next.js, PostgreSQL como tecnologias-base; nenhum vestígio de Spring/Java na aplicação proposta. |
| **Squads** | Apenas **1, 2, 3, 4 e 6**, com camada e subcamadas de foco explícitas e UI de cada domínio distribuída entre eles. |
| **Fronteiras** | Client Components sem importar `business/persistence`; Route Handlers não contêm SQL; Service não importa `page.jsx` ou DOM. |
| **Segurança** | Credenciais com hash forte; cookie/sessão seguros; validação de sessão e ownership; consultas parametrizadas; segredos protegidos. |
| **Consistência** | Unicidade de conclusão e crédito; resgates idempotentes; saldo/estoque não negativos; transações testadas sob concorrência. |
| **Performance** | Consultas de ranking paginadas e indexadas; tempo de resposta mensurado. A referência do README de até **500 ms** deve ser validada sob uma carga definida, não presumida. |
| **Evolução** | OpenAPI, migrations, testes, CI e convenções por Squad; atualização formal de README e roadmap. |

| Risco/decisão | Consequência | Mitigação |
|---|---|---|
| README/ROADMAP ainda descrevem outra stack/topologia | Implementações incompatíveis e avaliação documental inconsistente. | Aprovar e versionar **ADR**; atualizar README e roadmap antes da Sprint 1. |
| Node.js/Next.js usados como dois backends independentes | Duplicação de infraestrutura e violação da simplicidade proposta. | Um Next.js full-stack sobre runtime Node.js; sem Express separado. |
| Mistura de código de servidor com Client Components | Vazamento de segredos, dependências inválidas e risco de segurança. | Módulos server-only, lint e revisão obrigatória das fronteiras. |
| Rota HTTP chamando diretamente SQL | Regras dispersas, baixa testabilidade e acoplamento. | Rota → Service → Repository; testes de arquitetura. |
| XP e Gold alterados em transações diferentes | Créditos inconsistentes após falhas parciais. | Um client PostgreSQL e uma transação por caso de uso. |
| Recompensas de sequência sem dono definido para a sequência | Proteção e Recuperar sequência ficam inoperantes ou implementadas de forma divergente. | Confirmar o dono da sequência e registrar as funções `canRecoverStreak()`, `restoreStreak()` e `consumeItem()`. |
| Banco único e aplicação única | Escala independente entre domínios indisponível. | Medição de carga, índices, pool, consultas eficientes e réplicas sem estado. |
| Analytics com caching indevido | Rankings defasados após conclusão/resgate. | Políticas explícitas de cache e revalidação; consultas à fonte confirmada. |
| Funcionalidades de squads não selecionados | Notificações/infra específica podem faltar em relação ao roadmap original. | Documentar adiamentos e responsabilidades transversais dos cinco. |

## 9. Conclusão e decisão recomendada

Recomenda-se **adotar uma aplicação única Next.js, executada em Node.js e escrita em JavaScript**, conectada ao PostgreSQL e estruturada exclusivamente nas **quatro camadas** especificadas. Essa solução mantém as principais funcionalidades do Questify, facilita testes e transações, e permite a execução paralela dos **Squads 1, 2, 3, 4 e 6**, cada um com foco claro e responsabilidade de ponta a ponta por seu domínio. A decisão deve ser oficializada no README/roadmap, pois substitui expressamente tanto a antiga stack Java/Spring quanto a topologia originalmente prevista de microsserviços.

---

### Referências e rastreabilidade

**Fontes internas inspecionadas:** `README.md` (atributos de qualidade, stack antiga e organização em camadas) e `ROADMAP.md` (produto, microsserviços, escopo dos Squads e planejamento), ambos no ZIP `gcet1010-2026.2-main.zip`.

**Atualização fornecida pelo usuário:** comunicado de alteração para **JavaScript, Node.js/Next.js e PostgreSQL** (10/11/2026).

**Documentação técnica consultada:**

- Next.js, [Route Handlers / App Router](https://nextjs.org/docs/app/getting-started/route-handlers) — arquivos `route.js` dentro de `app`.
- Next.js, [Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend) — Server Components acessam serviços/dados diretamente, sem requisitar a própria API.
- Next.js, [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — divisão servidor/navegador.
- node-postgres, [Transactions](https://node-postgres.com/features/transactions) — uso do mesmo `client` durante uma transação.
