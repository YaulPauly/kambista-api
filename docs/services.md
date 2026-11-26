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

## Transactions

Todos los endpoints de este módulo requieren:

```http
Authorization: Bearer <access_token>
```

### Crear solicitud de cambio

```http
POST /v1/transactions
Content-Type: application/json
Authorization: Bearer <access_token>
```

Request:

```json
{
  "monedaOrigen": "USD",
  "monedaDestino": "PEN",
  "monto": 100
}
```

Respuesta exitosa: `201 Created`

```json
{
  "id": "65328d68-32d5-4881-b381-4ff2c4e1dec0",
  "monedaOrigen": "USD",
  "monedaDestino": "PEN",
  "monto": 100,
  "montoCambiado": 373.9,
  "tipoCambio": 3.739,
  "fecha": "2026-11-26T15:00:00.000Z"
}
```

Reglas actuales:

- El monto debe ser mayor que cero.
- El monto admite como máximo dos decimales y siete dígitos enteros.
- Las monedas de origen y destino no pueden ser iguales.
- `USD → PEN` utiliza el tipo de cambio de venta.
- `PEN → USD` utiliza el tipo de cambio de compra.
- Si no existe un tipo de cambio disponible, la API responde `503 Service
  Unavailable`.

### Consultar historial

```http
GET /v1/transactions/history?startDate=2026-11-01&endDate=2026-11-30
Authorization: Bearer <access_token>
```

Un administrador puede consultar el historial de otro usuario:

```http
GET /v1/transactions/history?startDate=2026-11-01&endDate=2026-11-30&userId=<USER_ID>
Authorization: Bearer <admin_access_token>
```

Un usuario normal siempre consulta únicamente su propio historial, aunque envíe
un `userId` diferente.

Respuesta exitosa: `200 OK`

```json
[
  {
    "id": "65328d68-32d5-4881-b381-4ff2c4e1dec0",
    "monedaOrigen": "USD",
    "monedaDestino": "PEN",
    "monto": 100,
    "montoCambiado": 373.9,
    "tipoCambio": 3.739,
    "fecha": "2026-11-26T15:00:00.000Z"
  }
]
```

## Pendiente

El módulo `exchange-rates` ya obtiene y persiste internamente el tipo de cambio
USD/PEN, y mantiene una caché en memoria para evitar consultar MongoDB en cada
lectura. Todavía no expone un endpoint HTTP público.

Todavía no existen endpoints HTTP para monedas ni refresh tokens. La
paginación del historial y las funcionalidades extra se documentarán cuando se
implementen.
