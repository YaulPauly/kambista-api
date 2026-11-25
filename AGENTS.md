# Repository Guidelines

## Current scope

This repository is the backend for the Kambista technical challenge. The
current branch establishes the architecture baseline only. Business behavior
must be implemented in the dedicated roadmap branches.

Do not add MongoDB, authentication, Docker, CI/CD, or external-provider
integrations to `chore/architecture`.

## Architecture

The backend is a modular monolith using NestJS with Express as the HTTP
adapter. The planned modules are:

- `identity`: users, authentication, roles and authorization policies.
- `currencies`: supported currencies and currency-pair rules.
- `exchange-rates`: exchange-rate retrieval, persistence, freshness and cache
  policies.
- `transactions`: conversion use cases and transaction history.
- `shared`: small, genuinely cross-cutting primitives and contracts.
- `platform`: application bootstrap, configuration and global HTTP concerns.

Each business module owns its domain and application behavior. A future module
should prefer this shape when it has real behavior:

```text
<module>/
├── domain/
├── application/
│   └── ports/
└── infrastructure/
```

Module-specific infrastructure can add focused folders such as `http`,
`persistence` or `providers` only when a concrete adapter is introduced. Do
not create generic layers, repositories, or utilities before a concrete use
case needs them.

The architecture branch versions the initial skeleton with these additional
technical areas:

- `shared/` for proven cross-cutting contracts and primitives.
- `platform/config` and `platform/http` for technical composition and global
  HTTP behavior.

These folders contain placeholders only until their roadmap branches add real
implementations.

## Dependency rules

- Domain code is framework-agnostic and must not import NestJS, Express,
  MongoDB, HTTP clients or environment access.
- Application services orchestrate use cases through explicit ports.
- Inbound HTTP adapters live in the owning module's `infrastructure/http`.
- Outbound adapters implement application output ports in the owning module's
  `infrastructure` area.
- `platform` wires dependencies and configures global concerns; it must not
  contain domain business rules.
- Modules must not access another module's persistence models directly.
- `shared` is not a dumping ground. Promote code there only after reuse is
  demonstrated.

## Naming and code quality

- Use English names for code, folders, classes, methods and public contracts.
- Keep controllers and transport DTOs thin; validation belongs at the input
  boundary and business invariants belong in the domain/application layers.
- Prefer explicit types and keep TypeScript strict mode enabled.
- Do not introduce import aliases until there is a documented need.
- Avoid leaking passwords, tokens, hashes or provider credentials into logs or
  responses.

## Testing

- Domain and application behavior should have focused unit tests.
- Adapter behavior should have integration tests when infrastructure exists.
- E2E tests belong in `test/` and should cover public HTTP contracts.
- Run the relevant checks before opening a pull request:

  ```bash
  npm run typecheck
  npm run lint
  npm run format:check
  npm run build
  npm run test
  npm run test:e2e
  ```

## Documentation

Architecture decisions belong in `docs/adr/` using sequential filenames. Use
Mermaid diagrams in `docs/diagrams/` when they clarify boundaries or flows.
Keep the README accurate: distinguish implemented behavior from planned work.

## Git workflow

- Use GitHub Flow: create a focused branch from `main` and merge through a
  reviewed pull request.
- Use Conventional Commits, for example `chore: define architecture ADRs`.
- Do not commit generated output, secrets, local environment files or
  dependency directories.
