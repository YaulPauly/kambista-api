# ADR 0006: Establecer la base de identity

- Estado: Aceptado
- Fecha: 2026-11-25

## Contexto

La prueba técnica requiere registro, login, JWT y roles antes de habilitar las
operaciones de negocio. La identidad debe poder probarse sin depender de
MongoDB durante los tests, sin exponer hashes ni secretos en responses.

## Decisión

- Los casos de uso de identity dependen de ports para repository, hashing y
  tokens.
- bcrypt se utiliza para almacenar passwords hasheadas.
- JWT contiene únicamente el identificador, nombre, email y rol del usuario.
- Los endpoints públicos mantienen el contrato externo definido por la prueba:
  `POST /v1/auth/register` y `POST /v1/auth/login`.
- Mongoose es el adapter de persistencia cuando existe `MONGODB_URI`; Jest usa
  un repository en memoria para mantener las pruebas deterministas.
- `JwtAuthGuard`, `Roles` y `RolesGuard` quedan disponibles para proteger las
  rutas de negocio futuras.
- El seeder de administrador es opcional y solo se ejecuta cuando
  `ADMIN_EMAIL` y `ADMIN_PASSWORD` están configurados.

## Consecuencias

- El dominio y los casos de uso no dependen de NestJS, Mongoose ni bcrypt.
- El scaffold puede ejecutar tests sin un MongoDB externo.
- La configuración de producción debe proporcionar un `MONGODB_URI` válido.
- La autorización se aplicará en las rutas de negocio mediante guards y roles,
  no únicamente mediante controles del frontend.
