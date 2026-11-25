# API de Kambista

API backend para la prueba técnica de Kambista. Actualmente el proyecto es un
scaffold inicial de NestJS y evolucionará hacia un monolito modular para una
plataforma de cambio de divisas.

## Estado actual

El repositorio actualmente incluye:

- NestJS ejecutándose con Express como adaptador HTTP.
- Un endpoint `GET /` que devuelve `Hello World!`.
- Una prueba unitaria para el controller raíz.
- Una prueba end-to-end para el endpoint raíz.
- Configuración centralizada del entorno con validación mediante Joi.
- Validación global de requests, headers de seguridad con Helmet, CORS
  controlado y logging estructurado de requests HTTP.
- Configuración de TypeScript, ESLint y Prettier.

Todavía no están implementados: los adaptadores de conexión a MongoDB,
autenticación, JWT y roles, operaciones de cambio de divisas, integración con
el tipo de cambio de SUNAT, documentación Swagger, Docker ni workflows de CI.

## Requisitos

- Node.js `>=20.11.0`.
- npm `>=10.2.0`.

El proyecto utiliza exclusivamente npm. `package-lock.json` está versionado
para mantener reproducibles las instalaciones de dependencias.

## Configuración inicial

Instala las dependencias bloqueadas y crea el archivo local de entorno:

```bash
npm ci
cp .env.example .env
```

El scaffold actual no requiere un servicio externo. `MONGODB_URI` se valida
como configuración futura de persistencia, pero no se utiliza hasta que un
módulo incorpore un adaptador concreto de MongoDB.

### Variables de entorno

| Variable      | Requerida | Descripción                                                             |
| ------------- | --------- | ----------------------------------------------------------------------- |
| `NODE_ENV`    | No        | `development`, `test` o `production`; por defecto `development`.        |
| `PORT`        | No        | Puerto HTTP; por defecto `3000`.                                        |
| `CORS_ORIGIN` | No        | Orígenes permitidos separados por comas; vacío desactiva CORS.          |
| `MONGODB_URI` | No        | URI de MongoDB reservada para la futura infraestructura de los módulos. |

## Ejecutar la aplicación

```bash
# desarrollo
npm run start

# modo watch
npm run start:dev

# build de producción
npm run build
npm run start:prod
```

La aplicación escucha en el puerto `3000` por defecto. El scaffold actual
permite seleccionar otro puerto mediante la variable `PORT`.

## Validaciones y pruebas

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test
npm run test:e2e
npm audit --omit=dev
```

`npm run lint:fix` y `npm run format` están disponibles para autocorrecciones
locales intencionales.

## Arquitectura planificada

El backend seguirá un monolito modular basado en arquitectura hexagonal, Clean
Architecture, DDD y SOLID. Los límites iniciales de los módulos son:

- `identity`: usuarios, autenticación y roles.
- `currencies`: monedas soportadas y reglas de pares de divisas.
- `exchange-rates`: obtención y persistencia del tipo de cambio de SUNAT.
- `transactions`: solicitudes de cambio e historial de transacciones.
- `shared`: contratos y utilidades cross-cutting reutilizables.
- `platform`: arranque de NestJS, configuración y concerns HTTP globales.

Los límites de los módulos, las reglas de dependencias y el skeleton de código
están documentados en los siguientes recursos. La funcionalidad de negocio se
incorporará en cambios posteriores.

- [ADR 0001: Monolito modular](./docs/adr/0001-modular-monolith.md)
- [ADR 0002: Límites de arquitectura hexagonal y DDD](./docs/adr/0002-hexagonal-ddd-boundaries.md)
- [ADR 0003: Límites de los módulos](./docs/adr/0003-module-boundaries.md)
- [ADR 0004: Fundamentos de la plataforma](./docs/adr/0004-platform-foundation.md)
- [Diagrama de contexto del sistema](./docs/diagrams/system-context.md)
- [Diagrama de límites de los módulos](./docs/diagrams/module-boundaries.md)

## Flujo de desarrollo

El proyecto sigue GitHub Flow y Conventional Commits. Los cambios deben ser
revisados y todas las validaciones relevantes deben pasar antes de crear un
commit o abrir un pull request.

## Prueba técnica original

Los requerimientos originales están disponibles en
[`prueba -tecnica.md`](./prueba%20-tecnica.md).

## Licencia

La publicación del paquete está deshabilitada mediante `private: true` y el
proyecto todavía no tiene una licencia seleccionada (`UNLICENSED`).
