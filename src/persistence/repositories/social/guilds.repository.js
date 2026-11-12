// CAMADA 3 — Persistência | Squad 3 (Domínio Social)
// Somente SQL parametrizado e mapeamento linha -> objeto. NÃO decide regras de negócio:
// papéis, validações e mensagens chegam prontos da Camada 2.
import { getPool } from '../../postgres/pool.js';
import { ForeignKeyViolationError, UniqueViolationError } from '../../../shared/errors.js';

// constraint do PostgreSQL -> nome lógico do campo (detalhe de persistência que não vaza para o negócio)
const UNIQUE_FIELDS = { guilds_name_unique_ci: 'name' };
const FOREIGN_KEY_FIELDS = {
  guilds_category_id_fkey: 'categoryId',
  guild_memberships_user_id_fkey: 'userId',
};

function translateDatabaseError(error) {
  if (error?.code === '23505' && UNIQUE_FIELDS[error.constraint_name]) {
    return new UniqueViolationError(UNIQUE_FIELDS[error.constraint_name], error);
  }
  if (error?.code === '23503' && FOREIGN_KEY_FIELDS[error.constraint_name]) {
    return new ForeignKeyViolationError(FOREIGN_KEY_FIELDS[error.constraint_name], error);
  }
  return error;
}

// BIGINT chega como string no driver `postgres`
const toGuild = (row) => ({
  id: Number(row.id),
  name: row.name,
  categoryId: Number(row.category_id),
  createdAt: row.created_at,
});

const toCategory = (row) => ({ id: Number(row.id), name: row.name });

/** Busca guilda pelo nome (sem diferenciar maiúsculas/minúsculas, igual ao índice único). */
export async function findByName(name, db = getPool()) {
  const rows = await db.unsafe(
    'SELECT id, name, category_id, created_at FROM guilds WHERE LOWER(name) = LOWER($1) LIMIT 1',
    [name],
  );
  return rows[0] ? toGuild(rows[0]) : null;
}

/** Consulta da categoria selecionada. */
export async function findCategoryById(categoryId, db = getPool()) {
  const rows = await db.unsafe('SELECT id, name FROM categories WHERE id = $1', [categoryId]);
  return rows[0] ? toCategory(rows[0]) : null;
}

/** Categorias disponíveis para seleção na UI. */
export async function listCategories(db = getPool()) {
  const rows = await db.unsafe('SELECT id, name FROM categories ORDER BY name');
  return rows.map(toCategory);
}

/**
 * Insere a guilda e o vínculo do criador na MESMA transação (o `tx` recebido).
 * `guildData.adminRole` é definido pela Camada 2; aqui apenas é gravado.
 */
export async function createGuildWithAdmin(tx, guildData, userId) {
  const { name, categoryId, adminRole } = guildData;
  if (!adminRole) throw new TypeError('guildData.adminRole é obrigatório.');

  try {
    const rows = await tx.unsafe(
      'INSERT INTO guilds (name, category_id) VALUES ($1, $2) RETURNING id, name, category_id, created_at',
      [name, categoryId],
    );
    const guild = rows[0];
    await tx.unsafe(
      'INSERT INTO guild_memberships (guild_id, user_id, role) VALUES ($1, $2, $3)',
      [guild.id, userId, adminRole],
    );
    return toGuild(guild);
  } catch (error) {
    throw translateDatabaseError(error);
  }
}
