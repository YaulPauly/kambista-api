export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('El email ya está registrado.');
    this.name = EmailAlreadyRegisteredError.name;
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Las credenciales no son válidas.');
    this.name = InvalidCredentialsError.name;
  }
}
