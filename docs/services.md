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
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

Los intentos repetidos de login se limitan mediante `LOGIN_RATE_LIMIT` y
`LOGIN_RATE_WINDOW_MS`. Cuando se supera el límite, la API responde `429 Too
Many Requests`.

### Renovar tokens

```http
POST /v1/auth/refresh
Content-Type: application/json
```

Request:

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

La respuesta contiene un nuevo `access_token` y un nuevo `refresh_token`. El
refresh token anterior se revoca y no puede reutilizarse.

## Exchange rates

Todos los endpoints de este módulo requieren:

```http
Authorization: Bearer <access_token>
```

### Consultar el tipo de cambio actual

```http
GET /v1/exchange-rates?monedaOrigen=USD&monedaDestino=PEN
Authorization: Bearer <access_token>
```

La API consulta primero la caché en memoria. Si no encuentra un valor vigente,
consulta el último valor persistido en MongoDB y actualiza la caché.

Respuesta exitosa: `200 OK`

```json
{
  "monedaOrigen": "USD",
  "monedaDestino": "PEN",
  "compra": 3.733,
  "venta": 3.739,
  "fuente": "SUNAT",
  "fechaEfectiva": "2026-11-26T00:00:00.000Z",
  "consultadoEn": "2026-11-26T15:00:00.000Z"
}
```

El scheduler continúa actualizando el tipo de cambio desde SUNAT cada 30
segundos por defecto. Si no existe información disponible, la API responde
`503 Service Unavailable`.

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

Si el administrador omite `userId`, consulta el historial de todos los usuarios
dentro del rango de fechas indicado:

```http
GET /v1/transactions/history?startDate=2026-11-01&endDate=2026-11-30&page=1&pageSize=12
Authorization: Bearer <admin_access_token>
```

Un usuario normal siempre consulta únicamente su propio historial, aunque envíe
un `userId` diferente.

La paginación es opcional. Usa `page=1` y `pageSize=12` por defecto; `pageSize`
acepta como máximo 100 elementos.

```http
GET /v1/transactions/history?startDate=2026-11-01&endDate=2026-11-30&page=1&pageSize=12
```

Respuesta exitosa: `200 OK`

```json
{
  "data": [
    {
      "id": "65328d68-32d5-4881-b381-4ff2c4e1dec0",
      "monedaOrigen": "USD",
      "monedaDestino": "PEN",
      "monto": 100,
      "montoCambiado": 373.9,
      "tipoCambio": 3.739,
      "fecha": "2026-11-26T15:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 12,
    "total": 1,
    "totalPages": 1
  }
}
```

## Pendiente

Todavía no existe un endpoint HTTP público para el catálogo de monedas.
