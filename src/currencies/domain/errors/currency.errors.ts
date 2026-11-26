export class UnsupportedCurrencyError extends Error {
  constructor(currencyCode: string) {
    super(`La moneda "${currencyCode}" no está soportada.`);
    this.name = UnsupportedCurrencyError.name;
  }
}

export class SameCurrencyPairError extends Error {
  constructor(currencyCode: string) {
    super(
      `Un par de monedas no puede utilizar "${currencyCode}" en ambos lados.`,
    );
    this.name = SameCurrencyPairError.name;
  }
}
