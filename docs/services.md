# Servicios HTTP

Esta documentación describe únicamente los endpoints implementados actualmente.

## Documentación interactiva

Con la aplicación ejecutándose localmente, Swagger está disponible en:

```text
http://localhost:3000/docs
```

## Identity

### Registrar usuario

```http
POST /v1/auth/register
Content-Type: application/json
```

Request:

```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "contraseña123"
}
```

Respuesta exitosa: `201 Created`

```json
{
  "usuario": {
    "id": "65328d68-32d5-4881-b381-4ff2c4e1dec0",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "user"
  }
}
```

El rol asignado durante el registro es siempre `user`. El cliente no puede
enviar un rol para convertirse en administrador.

Errores principales:

- `400 Bad Request`: request inválido.
- `409 Conflict`: el email ya está registrado.

### Iniciar sesión

```http
POST /v1/auth/login
Content-Type: application/json
```

Request:

```json
{
  "email": "juan@example.com",
  "password": "contraseña123"
}
```

Respuesta exitosa: `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "65328d68-32d5-4881-b381-4ff2c4e1dec0",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "user"
  }
}
```

El `access_token` debe enviarse posteriormente en endpoints protegidos mediante
el header:

```http
Authorization: Bearer <access_token>
```

Errores principales:

- `400 Bad Request`: request inválido.
- `401 Unauthorized`: las credenciales no son válidas.

## Pendiente

Todavía no existen endpoints HTTP para monedas, tipos de cambio,
transacciones, historial ni refresh tokens. Se documentarán cuando sean
implementados.
