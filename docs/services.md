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

El módulo `exchange-rates` ya obtiene y persiste internamente el tipo de cambio
USD/PEN, y mantiene una caché en memoria para evitar consultar MongoDB en cada
lectura. Todavía no expone un endpoint HTTP público; el módulo
`transactions` consumirá su caso de uso cuando se implemente.

Todavía no existen endpoints HTTP para monedas, transacciones, historial ni
refresh tokens. Se documentarán cuando sean implementados.
