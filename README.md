# Kambista API

Backend API for the Kambista technical challenge. The project is currently an
initial NestJS scaffold and will evolve into a modular monolith for a currency
exchange platform.

## Current status

The repository currently provides:

- NestJS running with Express as the HTTP adapter.
- A `GET /` endpoint that returns `Hello World!`.
- A unit test for the root controller.
- An end-to-end test for the root endpoint.
- TypeScript, ESLint and Prettier configuration.

The following are not implemented yet: MongoDB integration, authentication,
JWT and roles, currency exchange operations, SUNAT exchange-rate integration,
Swagger documentation, Docker and CI workflows.

## Requirements

- Node.js `>=20.11.0`.
- npm `>=10.2.0`.

This project uses npm exclusively. `package-lock.json` is committed to keep
dependency installation reproducible.

## Setup

Install the locked dependencies:

```bash
npm ci
```

No environment variables or external services are required by the current
scaffold.

## Run the application

```bash
# development
npm run start

# watch mode
npm run start:dev

# production build
npm run build
npm run start:prod
```

The application listens on port `3000` by default. The `PORT` environment
variable can be used by the current scaffold to select another port.

## Validation and tests

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test
npm run test:e2e
npm audit --omit=dev
```

`npm run lint:fix` and `npm run format` are available for intentional local
autofixes.

## Planned architecture

The planned backend is a modular monolith following hexagonal architecture,
Clean Architecture, DDD and SOLID principles. The initial module boundaries
are:

- `identity`: users, authentication and roles.
- `currencies`: supported currencies and currency rules.
- `exchange-rates`: SUNAT exchange-rate retrieval and persistence.
- `transactions`: exchange requests and transaction history.
- `shared`: cross-cutting contracts and reusable domain utilities.
- `platform`: NestJS bootstrap, configuration and global HTTP concerns.

The module boundaries, dependency rules and source skeleton are documented in
the architecture branch. Business functionality will be introduced in future
changes.

- [ADR 0001: Modular monolith](./docs/adr/0001-modular-monolith.md)
- [ADR 0002: Hexagonal architecture and DDD boundaries](./docs/adr/0002-hexagonal-ddd-boundaries.md)
- [ADR 0003: Module boundaries](./docs/adr/0003-module-boundaries.md)
- [System context diagram](./docs/diagrams/system-context.md)
- [Module boundaries diagram](./docs/diagrams/module-boundaries.md)

## Development workflow

The project follows GitHub Flow and Conventional Commits. Changes should be
reviewed and all relevant validations should pass before creating a commit or
opening a pull request.

## Original challenge

The original requirements are available in
[`prueba -tecnica.md`](./prueba%20-tecnica.md).

## License

Package publishing is disabled via `private: true`, and no project license has
been selected yet (`UNLICENSED`).
