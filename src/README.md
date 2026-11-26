# Estructura de `src`

El árbol fuente pertenece a un monolito modular. Cada módulo mantiene sus
reglas de dominio, casos de uso y adapters de infraestructura siguiendo
`AGENTS.md` y los ADRs de arquitectura.

```text
src/
├── identity/
│   ├── domain/
│   ├── application/
│   │   └── ports/
│   └── infrastructure/
│       ├── http/
│       ├── persistence/
│       └── security/
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

Los archivos del arranque de la aplicación permanecen en la raíz de `src/`.
Los módulos incorporan solo las capas y adapters que ya tienen un uso real.
