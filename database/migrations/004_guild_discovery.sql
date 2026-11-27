-- =====================================================================
-- CAMADA 4 — DADOS | Squad 3 (Domínio Social) | Supabase (PostgreSQL)
-- 004_guild_discovery.sql: Issue "Visualizar guildas disponíveis na plataforma".
--
-- Não sobrescreve 003_social.sql: só adiciona colunas (ADD COLUMN IF NOT EXISTS)
-- e um índice. Guildas já existentes continuam visíveis (DEFAULT TRUE).
--
-- Fonte original em database/migrations; espelhado em
-- supabase/migrations/20261126000000_guild_discovery.sql para o CLI aplicar
-- com `supabase db push`.
--
-- ESCOPO DESTA CAMADA: apenas estrutura. As regras de quais guildas aparecem
-- (ativa + pública), o limite de 20 por página e a busca por nome moram em
-- src/persistence/repositories/social/guilds.repository.js (consulta) e
-- src/business/{domain,application}/social/ (limites e validação).
-- =====================================================================

ALTER TABLE public.guilds
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.guilds
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

-- Índice parcial: cobre exatamente a consulta de "guildas disponíveis"
-- (active = TRUE AND is_public = TRUE), já na ordem estável usada pela listagem.
CREATE INDEX IF NOT EXISTS guilds_available_idx
  ON public.guilds (created_at, id)
  WHERE active = TRUE AND is_public = TRUE;
