# ADR 0003: Define Initial Module Boundaries

- Status: Accepted
- Date: 2026-11-25

## Decision

The initial modules own the following responsibilities:

| Module | Owns |
| --- | --- |
| `identity` | Users, credentials, authentication, roles and authorization policies. |
| `currencies` | Supported currencies and valid currency-pair rules. |
| `exchange-rates` | Exchange-rate provider integration, stored rates, freshness and cache policy. |
| `transactions` | Conversion use cases, transaction records and history queries. |
| `shared` | Small cross-cutting primitives that have demonstrated reuse. |
| `platform` | NestJS bootstrap, configuration and global HTTP concerns. |

`transactions` may consume an exchange-rate application contract and an
authenticated-user context. It must not query the identity or exchange-rate
storage directly. `identity` owns authorization decisions; transport
controllers only enforce the boundary and delegate to application use cases.

## Rationale

These boundaries reflect the responsibilities described in the original
technical challenge while avoiding a premature split into deployable services.
They also keep provider, persistence and transport details outside the core
business rules.

## Consequences

- Each module can evolve independently within the same process.
- Cross-module contracts become explicit and testable.
- New shared abstractions require evidence of reuse rather than convenience.
- Changes that move ownership between modules require an ADR update.
