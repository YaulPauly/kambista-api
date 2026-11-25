# Source structure

This branch establishes the source tree for the modular monolith. The folders
are intentionally empty: implementation belongs to the roadmap branches and
must follow the rules in the root `AGENTS.md` and the architecture ADRs.

```text
src/
├── identity/
│   ├── domain/
│   ├── application/
│   │   └── ports/
│   └── infrastructure/
│       ├── http/
│       └── persistence/
├── currencies/
│   ├── domain/
│   ├── application/
│   │   └── ports/
│   └── infrastructure/
├── exchange-rates/
│   ├── domain/
│   ├── application/
│   │   └── ports/
│   └── infrastructure/
├── transactions/
│   ├── domain/
│   ├── application/
│   │   └── ports/
│   └── infrastructure/
├── shared/
└── platform/
    ├── config/
    └── http/
```

The existing scaffold files remain at the `src/` root until the platform and
feature branches introduce their replacements deliberately.
