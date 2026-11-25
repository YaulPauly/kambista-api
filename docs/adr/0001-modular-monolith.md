# ADR 0001: Use a Modular Monolith

- Status: Accepted
- Date: 2026-11-25

## Context

The technical challenge requires a single backend API with authentication,
exchange-rate management and transaction history. The project is small enough
to deploy as one service, while the business areas have clear boundaries that
should remain maintainable as functionality grows.

## Decision

We will implement the backend as a modular monolith with NestJS and Express.
The initial business modules are `identity`, `currencies`, `exchange-rates` and
`transactions`. `shared` contains only proven cross-cutting primitives, and
`platform` owns application composition, configuration and global HTTP
concerns. Module-specific persistence and external-service adapters remain in
the owning module's infrastructure.

Modules are deployed together but own their domain rules, application use
cases and public contracts. Cross-module collaboration happens through those
contracts rather than direct access to another module's persistence details.

## Consequences

Positive consequences:

- One deployment and one operational boundary for the technical challenge.
- Clear ownership of domain behavior and data access.
- A path to extract a module later if scale or ownership requires it.

Trade-offs:

- Module boundaries must be actively protected because the compiler cannot
  enforce every architectural rule.
- A shared database does not remove the need for module-level ownership.
- The application will require integration tests for module collaboration.

## Alternatives considered

- A distributed microservice architecture was rejected as unnecessary
  operational complexity for the current scope.
- A flat NestJS structure was rejected because it would mix transport,
  business and infrastructure concerns as features are added.
