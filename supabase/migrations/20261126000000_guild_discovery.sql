-- =====================================================================
-- CAMADA 4 — DADOS | Squad 3 (Domínio Social) | Supabase (PostgreSQL)
-- Espelho de database/migrations/004_guild_discovery.sql para o CLI do
-- Supabase (`supabase db push`, que só lê esta pasta).
-- =====================================================================

ALTER TABLE public.guilds
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.guilds
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS guilds_available_idx
  ON public.guilds (created_at, id)
  WHERE active = TRUE AND is_public = TRUE;
