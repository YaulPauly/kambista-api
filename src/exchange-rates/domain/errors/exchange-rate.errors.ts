export class InvalidExchangeRateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = InvalidExchangeRateError.name;
  }
}

export class ExchangeRateNotAvailableError extends Error {
  constructor() {
    super('No hay un tipo de cambio disponible para el par solicitado.');
    this.name = ExchangeRateNotAvailableError.name;
  }
}

export class ExchangeRateProviderError extends Error {
  constructor() {
    super('No fue posible obtener el tipo de cambio del proveedor externo.');
    this.name = ExchangeRateProviderError.name;
  }
}
