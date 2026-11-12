# Questify — Diagrama de Classes UML Estruturado

**Versão:** 2.1 (escopo revisado) · **Data:** 11/11/2026  
**Fontes primárias:** `Relatorio_Arquitetura_Camadas_Questify_JavaScript_Node_Next_PostgreSQL(1).md` (principal), `README (1).md`, `ROADMAP.md`.  
**Stack:** JavaScript, Next.js sobre Node.js, PostgreSQL; **um monólito modular exclusivamente em camadas**.  
**Escopo:** Squads **1, 2, 3, 4 e 6**. Os demais squads e microsserviços não compõem o desenho.

## Como consultar

1. **Panorama** — mapa resumido das principais associações do domínio.
2. **Identidade + Quests** — usuário, turma, sessão, XP, nível e conclusão idempotente.
3. **Guildas e social** — associação N:N, convites, publicações, comentários e reações.
4. **Economia transacional** — carteira, lançamentos, resgates e recompensa com Gold.
5. **Benefícios** — itens guardados, efeitos temporários e integração com quests/sequência.
6. **Analytics + sequência** — registro de atividade, streak e modelos de leitura de ranking.
7. **Classes por camadas** — Route Handlers → Services → Repositories → PostgreSQL.

> Os **métodos de entidades** descrevem comportamento do domínio em UML. Na stack JavaScript, podem ser implementados por funções e objetos, sem obrigar o uso de `class`. Da mesma forma, Route Handlers do Next.js são funções `GET`, `POST` etc.; seus retângulos representam **módulos/contratos** estereotipados, não classes concretas já criadas.

**Ajuste de escopo:** o usuário confirmou que a funcionalidade de badges/conquistas não faz parte da versão modelada; por isso, as respectivas entidades, operações e associações foram retiradas. Embora o ROADMAP inicial mencione badges, prevalece a decisão atual do projeto.

## Catálogo de classes

| Squad | Classe | Natureza | Responsabilidade central |
|---|---|---|---|
| Squad 1 | **Usuário** | Entidade | Identidade, papel e status |
| Squad 1 | **Sessão** | Entidade | Sessões e expiração (implementação opcional) |
| Squad 1 | **Turma** | Entidade | Unidade de agrupamento de alunos por turma |
| Squad 2 | **Quest** | Entidade | Tarefa, XP e Gold planejados e prazo |
| Squad 2 | **ConclusãoQuest** | Entidade | Conclusão única/idempotente |
| Squad 2 | **ProgressoUsuário** | Entidade | XP acumulado e nível |
| Squad 3 | **Guilda** | Entidade | Grupo de estudo |
| Squad 3 | **VínculoGuilda** | Entidade | Membro, papel e data |
| Squad 3 | **ConviteGuilda** | Entidade | Convite de entrada |
| Squad 3 | **Publicação** | Entidade | Publicação no feed |
| Squad 3 | **Comentário** | Entidade | Comentário |
| Squad 3 | **Reação** | Entidade | Reação de um usuário |
| Squad 4 | **Carteira** | Entidade | Saldo Gold não negativo |
| Squad 4 | **LançamentoGold** | Entidade | Extrato imutável de Gold |
| Squad 4 | **Recompensa** | Entidade | Catálogo fixo de benefícios |
| Squad 4 | **Resgate** | Entidade | Pedido de resgate idempotente |
| Squad 4 | **TipoItem** | Entidade | Tipo de item guardado |
| Squad 4 | **ItemUsuário** | Entidade | Saldo de itens no inventário |
| Squad 4 | **EfeitoAtivoUsuário** | Entidade | Efeitos temporários do usuário |
| Squad 6 | **SequênciaAtividade** | Entidade | Sequência atual de atividades |
| Squad 6 | **RegistroAtividade** | Entidade | Registro diário de atividade |
| Squad 6 | **PosiçãoRanking** | Modelo de leitura | Posição calculada, sem tabela independente |
| Squad 6 | **ResumoProgresso** | Modelo de leitura | Resumo calculado de progresso |
| Squad 6 | **FiltroRanking** | Objeto de valor | Parâmetros validados de consulta |

## Associações e cardinalidades principais

| Relacionamento | Multiplicidade | Regra / integridade |
|---|---|---|
| Turma — Usuário | 1 ↔ 0..* | Proposta de turma opcional por usuário; confirmar se o aluno participa de mais de uma turma. |
| Usuário — Sessão | 1 ↔ 0..* | Modelo de sessão persistida se adotado; a autenticação pode usar token sem entidade Sessão. |
| Usuário — Quest | 1 ↔ 0..* | Quest do aluno; controlar ownership. |
| Quest — ConclusãoQuest | 1 ↔ 0..* | Garantir unicidade de `(questId, usuarioId)` ou política equivalente acordada. |
| Usuário — ProgressoUsuário | 1 ↔ 0..1 | Progressão atualizada na transação da conclusão. |
| Guilda/Usuário — VínculoGuilda | cada 1 ↔ 0..* | Associação N:N; papel, status, data de ingresso. |
| Guilda — Publicação — Comentário/Reação | 1 ↔ 0..* em cada trecho | Feed organizado por guilda. |
| Usuário — Carteira | 1 ↔ 0..1 | Uma carteira lógica por usuário. |
| Carteira — LançamentoGold | 1 ↔ 0..* | Registro de crédito/débito; não recalcular pontos pela apresentação. |
| Usuário/Recompensa — Resgate | cada 1 ↔ 0..* | Unicidade de `(usuarioId, chaveIdempotencia)`; limites e concorrência. |
| Usuário/TipoItem — ItemUsuário | cada 1 ↔ 0..* | Chave `(usuarioId,tipoItemId)`; não permitir saldo negativo. |
| Usuário — EfeitoAtivoUsuário | 1 ↔ 0..* | Efeito de XP dobrado por até 24 horas. |
| Usuário — SequênciaAtividade | 1 ↔ 0..1 | O Squad 6 é proprietário das regras e do histórico de atividades. |

## Conformidade com a arquitetura principal

| Camada | Classes / módulos exemplificados | Local proposto |
|---|---|---|
| **1. Apresentação** | `QuestsRouteHandler`, `RewardsRouteHandler`, `AnalyticsRouteHandler` | `src/app/api/v1/**/route.js` |
| **2. Negócio · Aplicação** | `QuestService`, `RewardService`, `StreakService`, `LeaderboardService` | `src/business/application/**` |
| **2. Negócio · Domínio** | Entidades e políticas de XP, papéis, inventário e regras de sequência | `src/business/domain/**` |
| **3. Persistência** | `QuestsRepository`, `RewardsRepository`, `StreakRepository`, `LeaderboardRepository`, `TransactionManager` | `src/persistence/**` |
| **4. Dados** | PostgreSQL com FKs, constraints, índices e migrations | `database/migrations/**` |

**Direção:** `Route Handler → Service → Repository → PostgreSQL`. O Serviço pode chamar Serviços de outros Squads pela interface de aplicação; **não** manipula diretamente tabelas de outro domínio.

### Fluxos cruzados que exigem transações

**Concluir quest (Squads 2 + 4 + 6):** `QuestService.completeQuest()` registra conclusão e XP, chama `RewardService.creditGoldForQuest()` com `conclusionId` único e registra atividade pelo `StreakService`. Todos os comandos de escrita pertencentes ao mesmo caso de uso devem compartilhar o **mesmo `tx` PostgreSQL**, com rollback integral em caso de erro.

**Resgatar recompensa (Squad 4 e opcionalmente 6):** `RewardService.redeemReward()` bloqueia a carteira, valida saldo/limites, cria resgate e lançamento de débito e concede item, efeito ou recuperação de sequência. `StreakService.restoreStreak()` é chamado somente para o benefício imediato, na **mesma transação**.

**Prorrogação de prazo (Squads 2 + 4):** `QuestService.extendDeadline()` valida a quest, consome item guardado pelo `RewardService.consumeItem()` e acrescenta 24 h; tudo é atômico.

### Notas de rastreabilidade e hipóteses

- O **relatório principal** define monólito em camadas, propriedade de tabelas, repositórios, transações e regras de itens/efeitos. A estrutura de classes foi **proposta**, pois os documentos não trazem definições completas de esquema SQL ou código executável.
- O README sustenta qualidade e organização MVC + Service + Repository; o ROADMAP sustenta entidades de quests, guildas, recompensas, rankings e funções dos Squads. Quando conflitam sobre stack/topologia, prevalece o relatório principal.
- `Turma`, `Sessão` persistida, `ConviteGuilda`, `Reação` e `RegistroAtividade` são **detalhamentos de modelagem**, a validar antes de gerar migrations; campos, enums e nomes exatos não foram definidos pelos textos originais.
- `PosiçãoRanking` e `ResumoProgresso` são **objetos de leitura calculados**, sem operações de escrita e sem necessidade de tabelas próprias.
- Efeitos/benefícios referenciados no relatório: **Prorrogação de prazo (24 h)**; **XP dobrado (24 h)**; **Proteção de sequência (itens)**; **Recuperar sequência (imediato)**. O catálogo beta é fixo e configurado por migration/seed controlada.
- A cardinalidade exata entre Turma e Usuário e a política de repetição de quests dependem de decisão de negócio, sem invenção de regras institucionais.

## Arquivos entregues

- `Questify_Diagrama_Classes_Estruturado.drawio`: **7 páginas editáveis** (cada classe é uma forma independente).
- `Questify_Diagrama_Classes_Completo.pdf`: **8 páginas**, capa e diagramas vetoriais.
- `01_Panorama.svg` a `07_Classes_por_Camada.svg`: diagramas SVG vetoriais.
- PNGs homônimos e arquivos `.dot`: opções de edição e integração com o repositório.

## Fontes utilizadas

1. `Relatorio_Arquitetura_Camadas_Questify_JavaScript_Node_Next_PostgreSQL(1).md`, seções 3 a 6, **base normativa principal**.
2. `README (1).md`, diretrizes de tecnologia e arquitetura em camadas.
3. `ROADMAP.md`, visão geral e responsabilidades dos Squads 1, 2, 3, 4 e 6.
