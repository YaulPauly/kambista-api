export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('The email address is already registered.');
    this.name = EmailAlreadyRegisteredError.name;
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('The provided credentials are invalid.');
    this.name = InvalidCredentialsError.name;
  }
}
