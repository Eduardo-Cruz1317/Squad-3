-- Dados de referência (idempotente). Sem categorias ninguém consegue criar guilda.
-- Rode no SQL Editor do Supabase (ou use como database/seeds/dev.sql).
INSERT INTO public.categories (name) VALUES
  ('Matemática'),
  ('Física'),
  ('Química'),
  ('Biologia'),
  ('Programação'),
  ('Línguas'),
  ('Humanas'),
  ('Outros')
ON CONFLICT (name) DO NOTHING;
