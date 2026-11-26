export class InvalidEmailError extends Error {
  constructor() {
    super('The email address is invalid.');
    this.name = InvalidEmailError.name;
  }
}

export class Email {
  private constructor(public readonly value: string) {}

  static create(value: string): Email {
    const normalizedValue = value.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
      throw new InvalidEmailError();
    }

    return new Email(normalizedValue);
  }
}
