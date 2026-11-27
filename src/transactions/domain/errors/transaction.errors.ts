export class InvalidTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = InvalidTransactionError.name;
  }
}

export class InvalidTransactionDateRangeError extends Error {
  constructor() {
    super('El rango de fechas no es válido.');
    this.name = InvalidTransactionDateRangeError.name;
  }
}

export class InvalidTransactionPaginationError extends Error {
  constructor() {
    super('La paginación solicitada no es válida.');
    this.name = InvalidTransactionPaginationError.name;
  }
}
