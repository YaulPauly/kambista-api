# API de Kambista

API backend para la prueba técnica de Kambista. El proyecto es un monolito
modular de NestJS para una plataforma de cambio de divisas.

## Estado actual

El repositorio actualmente incluye:

- NestJS ejecutándose con Express como adaptador HTTP.
- Un endpoint `GET /` que devuelve `Hello World!`.
- Una prueba unitaria para el controller raíz.
- Una prueba end-to-end para el endpoint raíz.
- Configuración centralizada del entorno con validación mediante Joi.
- Validación global de requests, headers de seguridad con Helmet, CORS
  controlado y logging estructurado de requests HTTP.
- Dockerfile multistage y Docker Compose para desarrollo local.
- Workflow de GitHub Actions con quality gates y build de Docker.
- Registro, login, hashing bcrypt, JWT y guards de roles para `identity`.
- Obtención del tipo de cambio USD/PEN desde el proveedor externo, persistencia
  de snapshots y caché en memoria con TTL.
- Actualización automática del tipo de cambio al iniciar la aplicación y cada
  30 segundos por defecto.
- Creación de solicitudes de cambio USD/PEN y PEN/USD.
- Historial de transacciones con filtros por rango de fechas y autorización
  según el rol del usuario, paginado con 12 elementos por página por defecto.
- Refresh tokens con rotación y revocación de sesiones persistidas.
- Rate limiting configurable para intentos de login.
- Documentación Swagger para los endpoints HTTP implementados.
- Configuración de TypeScript, ESLint y Prettier.

Todavía no están implementados: frontend, Container Registry, CD y despliegue.

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

La ejecución local sin `MONGODB_URI` utiliza repositories en memoria. Docker
configura MongoDB y permite verificar la persistencia real de usuarios y tipos
de cambio.

### Variables de entorno

| Variable                            | Requerida | Descripción                                                           |
| ----------------------------------- | --------- | --------------------------------------------------------------------- |
| `NODE_ENV`                          | No        | `development`, `test` o `production`; por defecto `development`.      |
| `PORT`                              | No        | Puerto HTTP; por defecto `3000`.                                      |
| `CORS_ORIGIN`                       | No        | Orígenes permitidos separados por comas; vacío desactiva CORS.        |
| `JWT_SECRET`                        | No        | Secreto JWT; obligatorio en producción y con mínimo 32 caracteres.    |
| `JWT_EXPIRES_IN`                    | No        | Duración del access token; por defecto `15m`.                         |
| `JWT_REFRESH_SECRET`                | No        | Secreto independiente para refresh tokens; obligatorio en producción. |
| `JWT_REFRESH_EXPIRES_IN`            | No        | Duración del refresh token; por defecto `7d`.                         |
| `LOGIN_RATE_LIMIT`                  | No        | Intentos de login permitidos por ventana; por defecto `5`.            |
| `LOGIN_RATE_WINDOW_MS`              | No        | Ventana del rate limiting en milisegundos; por defecto `60000`.       |
| `BCRYPT_SALT_ROUNDS`                | No        | Coste de bcrypt entre `10` y `15`; por defecto `12`.                  |
| `ADMIN_NAME`                        | No        | Nombre utilizado por el seeder opcional del administrador.            |
| `ADMIN_EMAIL`                       | No        | Email opcional del administrador.                                     |
| `ADMIN_PASSWORD`                    | No        | Password opcional del administrador; nunca debe versionarse.          |
| `MONGODB_URI`                       | No        | URI de MongoDB; obligatoria en producción.                            |
| `EXCHANGE_RATE_PROVIDER_URL`        | No        | URL del proveedor USD/PEN; tiene un valor por defecto.                |
| `EXCHANGE_RATE_PROVIDER_TOKEN`      | No        | Token opcional del proveedor; nunca debe versionarse.                 |
| `EXCHANGE_RATE_REFRESH_INTERVAL_MS` | No        | Intervalo de actualización; por defecto `30000`.                      |
| `EXCHANGE_RATE_CACHE_TTL_MS`        | No        | Vigencia de la caché; por defecto `60000`.                            |
| `EXCHANGE_RATE_REQUEST_TIMEOUT_MS`  | No        | Timeout de la consulta externa; por defecto `5000`.                   |

El repository en memoria se utiliza durante los tests. Cuando existe
`MONGODB_URI`, los entornos de desarrollo y producción utilizan el adapter
Mongoose.

## Servicios HTTP

La documentación interactiva de los endpoints actuales está disponible en:

`http://localhost:3000/docs`

Los ejemplos de registro y login están documentados en
[`docs/services.md`](./docs/services.md).

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

La aplicación escucha en el puerto `3000` por defecto y permite seleccionar
otro puerto mediante la variable `PORT`.

## Validaciones y pruebas

Los comandos y el propósito de cada validación están documentados en
[`docs/testing.md`](./docs/testing.md).

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test
npm run test:e2e
npm audit --omit=dev
npm run validate
```

`npm run lint:fix` y `npm run format` están disponibles para autocorrecciones
locales intencionales.

## Docker

Docker es opcional para el desarrollo local. Para levantar la API junto con
MongoDB:

```bash
docker compose up --build
```

La API estará disponible en `http://localhost:3000`. Para detener los
contenedores:

```bash
docker compose down
```

El volumen `mongo_data` conserva los datos locales. El Compose incluido no es
una configuración de producción y no contiene credenciales reales.

## Arquitectura

El backend seguirá un monolito modular basado en arquitectura hexagonal, Clean
Architecture, DDD y SOLID. Los límites iniciales de los módulos son:

- `identity`: usuarios, autenticación y roles.
- `currencies`: monedas soportadas y reglas de pares de divisas.
- `exchange-rates`: obtención, persistencia y caché del tipo de cambio USD/PEN.
- `transactions`: solicitudes de cambio e historial de transacciones.
- `shared`: contratos y utilidades cross-cutting reutilizables.
- `platform`: arranque de NestJS, configuración y concerns HTTP globales.

Los límites de los módulos, las reglas de dependencias y las decisiones de
implementación están documentados en los siguientes recursos.

- [ADR 0001: Monolito modular](./docs/adr/0001-modular-monolith.md)
- [ADR 0002: Límites de arquitectura hexagonal y DDD](./docs/adr/0002-hexagonal-ddd-boundaries.md)
- [ADR 0003: Límites de los módulos](./docs/adr/0003-module-boundaries.md)
- [ADR 0004: Fundamentos de la plataforma](./docs/adr/0004-platform-foundation.md)
- [ADR 0005: Docker y CI](./docs/adr/0005-docker-ci.md)
- [ADR 0006: Fundamentos de identity](./docs/adr/0006-identity-foundation.md)
- [ADR 0007: Reglas del dominio de currencies](./docs/adr/0007-currencies-domain-rules.md)
- [ADR 0008: Proveedor, persistencia y caché de exchange-rates](./docs/adr/0008-exchange-rates-provider-cache.md)
- [ADR 0009: Solicitudes e historial de transacciones](./docs/adr/0009-transactions-conversion-history.md)
- [ADR 0010: Conexión MongoDB e índices de consulta](./docs/adr/0010-mongodb-connection-and-indexes.md)
- [ADR 0011: Precisión monetaria y seguridad de sesiones](./docs/adr/0011-monetary-precision-and-session-security.md)
- [Diagrama de contexto del sistema](./docs/diagrams/system-context.md)
- [Diagrama de límites de los módulos](./docs/diagrams/module-boundaries.md)
