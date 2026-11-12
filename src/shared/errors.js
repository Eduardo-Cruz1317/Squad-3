// Utilitário transversal (NÃO é camada). Erros carregam `code`, nunca status HTTP:
// quem traduz código -> status é a Camada 1 (Route Handlers).

export class AppError extends Error {
  constructor(code, message, { details, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}

/** Dados de entrada inválidos. `fields` = { campo: mensagem }. */
export class ValidationError extends AppError {
  constructor(fields, message = 'Dados inválidos.') {
    super('VALIDATION_ERROR', message, { details: fields });
    this.fields = fields;
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Usuário não autenticado.') {
    super('UNAUTHENTICATED', message);
  }
}

/** Conflito de negócio (ex.: nome já em uso). */
export class ConflictError extends AppError {
  constructor(code, message) {
    super(code, message);
  }
}

// ---- Erros de persistência (lançados pela Camada 3, interpretados pela Camada 2) ----

/** Violação de UNIQUE. `field` é um nome lógico (ex.: 'name'), não o nome da constraint. */
export class UniqueViolationError extends AppError {
  constructor(field, cause) {
    super('UNIQUE_VIOLATION', `Valor duplicado em "${field}".`, { cause });
    this.field = field;
  }
}

/** Violação de FOREIGN KEY. `field` é um nome lógico (ex.: 'categoryId'). */
export class ForeignKeyViolationError extends AppError {
  constructor(field, cause) {
    super('FOREIGN_KEY_VIOLATION', `Referência inexistente em "${field}".`, { cause });
    this.field = field;
  }
}
