# Guía del repositorio

## Alcance actual

Este repositorio contiene el backend de la prueba técnica de Kambista. La rama
actual establece únicamente la base de la plataforma. La lógica de negocio debe
implementarse en las ramas correspondientes del roadmap.

No agregues MongoDB, autenticación, Docker, CI/CD ni integraciones con
proveedores externos a `chore/architecture`.

## Arquitectura

El backend es un monolito modular construido con NestJS y Express como
adaptador HTTP. Los módulos planificados son:

- `identity`: usuarios, autenticación, roles y políticas de autorización.
- `currencies`: monedas soportadas y reglas de pares de divisas.
- `exchange-rates`: obtención, persistencia, vigencia y caché del tipo de cambio.
- `transactions`: casos de uso de conversión e historial de transacciones.
- `shared`: primitives y contratos cross-cutting pequeños y realmente
  reutilizables.
- `platform`: arranque de la aplicación, configuración y concerns HTTP globales.

Cada módulo de negocio es dueño de su dominio y comportamiento de aplicación.
Cuando un módulo tenga comportamiento real, debe seguir preferentemente esta
estructura:

```text
<module>/
├── domain/
├── application/
│   └── ports/
└── infrastructure/
```

La infraestructura específica de un módulo puede añadir carpetas como `http`,
`persistence` o `providers` únicamente cuando se introduzca un adapter concreto.
No crees capas, repositories o utilidades genéricas antes de que un caso de uso
real las necesite.

La estructura base incluye además:

- `shared/` para contratos y primitives cross-cutting con reutilización
  demostrada.
- `platform/config` y `platform/http` para composición técnica y comportamiento
  HTTP global.

Estas carpetas contienen placeholders hasta que las ramas del roadmap añadan
implementaciones reales.

## Reglas de dependencias

- El código de dominio debe ser independiente de frameworks y no importar
  NestJS, Express, MongoDB, clientes HTTP ni variables de entorno.
- Los servicios de aplicación orquestan casos de uso mediante ports explícitos.
- Los adapters HTTP de entrada viven en `infrastructure/http` del módulo dueño.
- Los adapters de salida implementan los ports de aplicación dentro de
  `infrastructure` del módulo dueño.
- `platform` conecta dependencias y configura concerns globales; no contiene
  reglas de negocio.
- Un módulo no debe acceder directamente a los modelos de persistencia de otro.
- `shared` no es un cajón de sastre. El código solo debe llegar allí cuando
  exista reutilización demostrada.

## Nombres y calidad de código

- Utiliza nombres en inglés para código, carpetas, clases, métodos y contratos
  públicos.
- Mantén controllers y DTOs de transporte delgados; la validación pertenece al
  boundary de entrada y las invariantes al dominio o a la aplicación.
- Mantén TypeScript en modo strict y prefiere tipos explícitos.
- No introduzcas aliases de importación hasta documentar una necesidad real.
- No expongas passwords, tokens, hashes ni credenciales de proveedores en logs o
  responses.

## Pruebas

- El dominio y la aplicación deben tener unit tests enfocados.
- Los adapters deben tener integration tests cuando exista infraestructura.
- Las pruebas E2E pertenecen a `test/` y deben cubrir contratos HTTP públicos.
- Ejecuta estas validaciones antes de abrir un pull request:

  ```bash
  npm run typecheck
  npm run lint
  npm run format:check
  npm run build
  npm run test
  npm run test:e2e
  ```

## Documentación

Las decisiones arquitectónicas deben vivir en `docs/adr/` con nombres
secuenciales. Utiliza diagramas Mermaid en `docs/diagrams/` cuando aclaren
límites o flujos. Mantén el README actualizado y diferencia el comportamiento
implementado del trabajo planificado.

## Flujo de Git

- Utiliza GitHub Flow: crea una rama enfocada desde `main` y fusiónala mediante
  un pull request revisado.
- Utiliza Conventional Commits, por ejemplo `chore: define architecture ADRs`.
- No versiones output generado, secretos, archivos de entorno locales ni
  directorios de dependencias.
