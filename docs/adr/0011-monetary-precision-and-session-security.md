# ADR 0011: Precisión monetaria y seguridad de sesiones

- Estado: Aceptada
- Fecha: 2026-11-26

## Contexto

Las conversiones de divisas no deben depender de la aritmética binaria de
`number`. Además, el login necesita protección contra intentos repetidos y la
sesión debe poder renovarse y revocarse.

## Decisión

- El dominio y la aplicación utilizan `decimal.js` para monto, tipo de cambio
  y resultado de conversión.
- MongoDB persiste esos valores como `Decimal128`; la API conserva números en
  sus responses para no cambiar el contrato HTTP actual.
- El access token y el refresh token utilizan secretos independientes y tipos
  explícitos dentro del JWT.
- Los refresh tokens se almacenan únicamente como hashes SHA-256, se rotan al
  renovarse y la sesión anterior se revoca.
- Las solicitudes de login se limitan por ventana configurable. El resto de
  endpoints no comparte ese límite.
- El historial utiliza paginación con doce registros por página por defecto.

## Consecuencias

Los cálculos monetarios son deterministas y la base de datos conserva precisión
decimal. Los documentos existentes almacenados como `double` requieren una
migración de tipo antes de usarse con los nuevos esquemas `Decimal128`.

La revocación requiere persistencia de sesiones, pero permite invalidar tokens
sin esperar su expiración. El rate limiting protege el login y puede ajustarse
por entorno sin cambiar el código.
