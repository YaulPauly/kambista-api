# Pruebas y validaciones

Este documento describe cómo validar los cambios del proyecto antes de crear un
commit o abrir un pull request.

## Qué prueba cada comando

### TypeScript

```bash
npm run typecheck
```

Ejecuta TypeScript en modo de verificación sin generar archivos. Detecta errores
de tipos, imports inválidos y problemas de compilación estática.

### ESLint

```bash
npm run lint
```

Revisa problemas de calidad, reglas de TypeScript, imports y convenciones de
código. No modifica archivos.

Para aplicar correcciones automáticas de forma intencional:

```bash
npm run lint:fix
```

### Prettier

```bash
npm run format:check
```

Comprueba que los archivos TypeScript, JSON y configuración mantengan el
formato esperado. No modifica archivos.

Para formatear archivos localmente:

```bash
npm run format
```

### Build

```bash
npm run build
```

Compila la aplicación NestJS en `dist/`. Confirma que el código puede ser
generado para ejecución.

### Pruebas unitarias

```bash
npm run test -- --runInBand
```

Ejecuta las pruebas unitarias con Jest. Estas pruebas validan dominio,
aplicación y reglas aisladas sin depender de MongoDB.

Para ejecutar únicamente las pruebas del login:

```bash
npm run test -- identity/application/use-cases/login-user.use-case.spec.ts --runInBand
```

Para ejecutar únicamente las pruebas del registro:

```bash
npm run test -- identity/application/use-cases/register-user.use-case.spec.ts --runInBand
```

### Pruebas E2E

```bash
npm run test:e2e -- --runInBand
```

Prueba los contratos HTTP completos, incluyendo controllers, DTOs, validación,
casos de uso y respuestas HTTP.

Las pruebas E2E utilizan el repository en memoria durante `NODE_ENV=test`, por
lo que no necesitan un MongoDB externo.

### Cobertura

```bash
npm run test:cov -- --runInBand
```

Genera un reporte de cobertura en `coverage/`. El reporte permite identificar
casos de uso, ramas y adapters que todavía no tienen pruebas suficientes.

### Auditoría de dependencias

```bash
npm audit --omit=dev
```

Revisa únicamente las vulnerabilidades de dependencias de producción.
Actualmente las vulnerabilidades moderadas exclusivamente de desarrollo se
aceptan temporalmente según la decisión del proyecto.

No ejecutar `npm audit fix` ni `npm audit fix --force` sin revisar previamente
el impacto en las versiones del proyecto.

## Verificación manual con Docker

Utiliza Docker cuando el cambio afecte persistencia, configuración de runtime o
la integración real con MongoDB.

Valida la configuración:

```bash
docker compose config --quiet
```

Reconstruye la imagen y recrea los servicios:

```bash
docker compose up -d --build --force-recreate
```

Revisa el estado:

```bash
docker compose ps
```

Revisa los logs de la API:

```bash
docker compose logs -f api
```

Prueba el endpoint raíz y Swagger:

```bash
curl -i http://localhost:3000/
```

```bash
curl -i http://localhost:3000/docs
```

El registro y login pueden probarse con los ejemplos documentados en
[`services.md`](./services.md).

Para verificar los snapshots persistidos del tipo de cambio en MongoDB:

```bash
docker compose exec mongo mongosh kambista --eval \
  'db.exchange_rates.find().sort({fetchedAt: -1}).limit(5).pretty()'
```

La actualización automática se ejecuta al iniciar la API y cada 30 segundos
por defecto. La lectura del último tipo de cambio consulta primero la caché en
memoria y recurre a MongoDB únicamente cuando la entrada no existe o expiró.

Los logs HTTP se emiten como JSON estructurado. Incluyen evento, request ID,
método, endpoint, status, duración, usuario autenticado y rol. Para requests
anónimos `userId` y `userRole` aparecen como `null`. No se registran tokens,
passwords, emails ni cuerpos de requests.

Para detener los servicios sin eliminar el volumen de MongoDB:

```bash
docker compose down
```

No utilizar `docker compose down -v` salvo que se quiera eliminar
intencionalmente toda la información local de MongoDB.

## Checklist antes de un commit

Después ejecuta todas las validaciones del proyecto con un solo comando:

```bash
npm run validate
```

Este script ejecuta, en orden:

- TypeScript.
- ESLint.
- Prettier.
- Build.
- Pruebas unitarias.
- Pruebas E2E.
- Auditoría de dependencias de producción.
