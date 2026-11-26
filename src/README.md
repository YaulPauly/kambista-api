# Estructura de `src`

Esta rama establece el árbol fuente del monolito modular. Las carpetas están
intencionalmente vacías: la implementación pertenece a las ramas del roadmap y
debe seguir las reglas de `AGENTS.md` y de los ADRs de arquitectura.

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

Los archivos del scaffold actual permanecen en la raíz de `src/` hasta que las
ramas de plataforma y features introduzcan sus reemplazos deliberadamente.
