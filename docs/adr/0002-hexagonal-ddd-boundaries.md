# ADR 0002: Apply Hexagonal Architecture and DDD Boundaries

- Status: Accepted
- Date: 2026-11-25

## Context

The domain must remain testable and independent from NestJS, Express, MongoDB
and the SUNAT provider. The challenge also evaluates separation of
responsibilities, dependency inversion and maintainability.

## Decision

Each business module will separate:

- `domain`: entities, value objects, domain services and invariants.
- `application`: use cases and input/output ports.
- `infrastructure`: inbound HTTP adapters and outbound implementations for the
  module.

Dependencies point inward. The domain depends on no framework. Application
logic depends on ports, while infrastructure depends on application
contracts. NestJS dependency injection is used at composition boundaries and
must not become a domain dependency.

## Consequences

- Domain and application use cases can be unit-tested without MongoDB or an
  HTTP server.
- SUNAT and MongoDB can be replaced behind output ports.
- More files and explicit contracts are introduced where a simple function
  might otherwise be sufficient.
- Abstractions must be added only when they protect a real boundary or enable
  a required test.

## Validation rule

When adding a dependency from a business module to another layer, the change
must explain why the dependency belongs there and update the relevant ADR if
the boundary changes.
