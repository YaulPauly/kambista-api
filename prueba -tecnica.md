# Kambista Fullstack!

👋 Somos [Kambista](https://kambista.com) y estamos en la búsqueda de un nuevo miembro
para nuestro equipo de tech que nos ayude a seguir ofreciendo la mejor experiencia de
cambio. Para esto hemos preparado un reto técnico que deben completar y enviarnos
con las instrucciones de entrega.

---

## 📓 Descripción general

Se necesita construir un sistema de cambio de divisas con autenticación de usuarios. El sistema está compuesto por:

1. Una **API backend** que gestione el registro e inicio de sesión de usuarios, el tipo de cambio y las solicitudes de cambio de moneda.
2. Una **página web frontend** que permita a los usuarios registrarse, iniciar sesión y operar el cambio de divisas.

Todo el sistema de negocio está protegido por autenticación. Un usuario debe estar registrado e identificado para poder realizar o consultar operaciones de cambio.

Ambas partes deben entregarse como repositorios públicos en GitHub con instrucciones claras para levantarlas en local.

---

## 🔐 Autenticación y Roles

La API debe incluir un sistema de autenticación basado en **JWT** con gestión de roles. Este es el punto de partida del sistema — sin un usuario registrado y autenticado no se puede operar.

### Endpoints

```
POST /v1/auth/register   ← registrar un nuevo usuario
POST /v1/auth/login      ← iniciar sesión, devuelve un access_token JWT
```

**Registro** — body esperado:
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "contraseña123"
}
```

> El rol asignado por defecto al registrarse es siempre `user`. El rol `admin` se gestiona directamente desde la base de datos.

**Login** — body esperado:
```json
{
  "email": "juan@example.com",
  "password": "contraseña123"
}
```

**Login** — respuesta:
```json
{
  "access_token": "eyJhbGci...",
  "usuario": {
    "id": "xxxxxxxxxxxxx",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "user"
  }
}
```

### Roles y permisos

| Rol | Permisos |
|-----|----------|
| `user` | Puede crear solicitudes de cambio y consultar **solo su propio** historial |
| `admin` | Puede consultar el historial de **cualquier usuario** |

Todos los endpoints de negocio deben requerir un token JWT válido en el header:
```
Authorization: Bearer <token>
```

### Consideraciones de seguridad

- Las contraseñas deben almacenarse hasheadas (bcrypt u otro algoritmo seguro).
- El token JWT debe tener una expiración razonable.
- No exponer información sensible (contraseña, hash) en las respuestas.

---

## 🖧 Backend

### 1. Tipo de cambio

La API debe obtener y guardar el tipo de cambio de SUNAT cada **30 segundos** usando el siguiente proveedor:

```
GET https://api.apis.net.pe/v1/tipo-cambio-sunat
```

Respuesta del proveedor:
```json
{
  "compra": 3.733,
  "venta": 3.739,
  "origen": "SUNAT",
  "moneda": "USD",
  "fecha": "2024-01-18"
}
```

El tipo de cambio guardado más reciente es el que se usa al momento de calcular una operación de cambio.

---

### 2. Solicitudes de cambio

**Endpoint:** `POST /v1/transactions`

Recibe del cliente:
```json
{
  "monedaOrigen": "USD",
  "monedaDestino": "PEN",
  "monto": 100
}
```

Dependiendo del sentido de la operación, se calcula el monto resultante:

| Dirección | Cálculo |
|-----------|---------|
| USD → PEN | `montoCambiado = monto * tipoCambio.venta` |
| PEN → USD | `montoCambiado = monto / tipoCambio.compra` |

La solicitud se guarda y se responde con:
```json
{
  "id": "xxxxxxxxxxxxx",
  "monedaOrigen": "USD",
  "monedaDestino": "PEN",
  "monto": 100,
  "montoCambiado": 373.9,
  "tipoCambio": 3.739,
  "fecha": "$TIME_STAMP"
}
```

---

### 3. Historial de solicitudes

**Endpoint:** `GET /v1/transactions/history`

Parámetros de consulta:

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `startDate` | fecha | Sí | Inicio del rango |
| `endDate` | fecha | Sí | Fin del rango |
| `userId` | string | No | Solo disponible para `admin`. Permite consultar el historial de otro usuario. Si no se envía, el `admin` ve el suyo propio. El rol `user` siempre ve solo el suyo, independientemente de este parámetro. |

Respuesta:
```json
[
  {
    "id": "xxxxxxxxxxxxx",
    "monedaOrigen": "USD",
    "monedaDestino": "PEN",
    "monto": 100,
    "montoCambiado": 373.9,
    "tipoCambio": 3.739,
    "fecha": "$TIME_STAMP"
  }
]
```

---

### 4. Validaciones generales

Se deben agregar las validaciones necesarias para mantener la consistencia de los datos, por ejemplo:

- No se puede realizar un cambio si no existe un tipo de cambio registrado.
- Las monedas de origen y destino no pueden ser iguales.
- El monto debe ser mayor a cero.

---

## 🖥️ Frontend

Se debe crear una página web **separada** del backend. Las tecnologías permitidas son:

- **Vue 3** o **Nuxt**
- Estilos: personalizados, [Tailwind CSS](https://tailwindcss.com/) u otros

El diseño es a elección, pero se tendrán muy en cuenta los detalles y el cuidado visual.

### Pantallas requeridas

#### Autenticación
- Pantalla de **registro** de nuevo usuario.
- Pantalla de **inicio de sesión**.
- Opción para **cerrar sesión** desde cualquier pantalla protegida.
- Las rutas de negocio deben ser accesibles solo con sesión activa (route guards).

#### Formulario de cambio de divisas
Los campos del formulario son:

- Monto a cambiar
- Moneda del monto que envía el cliente
- Moneda del monto que quiere recibir

**Validaciones requeridas:**

- No se aceptan campos vacíos.
- Las monedas de origen y destino no pueden ser iguales.
- El monto admite como máximo **2 decimales**.
- El monto no puede superar **7 dígitos enteros** (máximo 9,999,999.99).
- Se deben mostrar mensajes de error claros al usuario.

#### Historial de transacciones
- El usuario puede consultar su historial de operaciones filtrando por rango de fechas.

---

## ⚙️ Stack tecnológico

| Área | Tecnología |
|------|-----------|
| Lenguaje | `Node.js` con `TypeScript` |
| Framework backend | Cualquier framework de Node.js (NestJS, Express, Fastify, etc.) |
| Base de datos | `MongoDB` |
| Arquitectura | `Clean Architecture` + `DDD` |
| Frontend | `Vue 3` o `Nuxt` |
| Estilos | Tailwind CSS u otros |
| Control de versiones | `Git` — se evaluará el historial de commits |
| Pruebas | Unitarias y/o de integración (requeridas) |
| Documentación | La API debe estar documentada (Swagger u otro) |

---

## ⭐ Criterios de evaluación

Se evaluarán los siguientes aspectos. Los marcados con ✨ suman puntos adicionales:

| Criterio | Descripción |
|----------|-------------|
| Funcionalidad | Los endpoints y el frontend funcionan correctamente según lo especificado |
| Pruebas | Cobertura de pruebas unitarias y/o de integración |
| Documentación | La API está documentada y el README es claro |
| Control de versiones | Historial de commits ordenado y con mensajes descriptivos |
| ✨ Arquitectura backend | Aplicación sólida de Clean Architecture y DDD (separación de capas, inyección de dependencias, etc.) |
| ✨ Arquitectura frontend | Organización del proyecto, separación de responsabilidades, composables, manejo de estado |
| ✨ Código limpio | Código legible, bien nombrado, sin duplicación innecesaria y fácil de mantener |
| ✨ Detalles de UI/UX | Cuidado visual, experiencia de usuario fluida y manejo de estados (carga, error, vacío) |

### 🏆 Puntos extra para nivel senior

Los siguientes aspectos no son obligatorios, pero se valorarán especialmente en candidatos que aspiran a un nivel senior. Se tendrán muy en cuenta en la entrevista técnica:

| Aspecto | Descripción |
|---------|-------------|
| Rate limiting en auth | Limitar intentos fallidos de login para prevenir ataques de fuerza bruta |
| Refresh tokens | Implementar `refresh_token` para renovar el acceso sin volver a iniciar sesión |
| Paginación en historial | Devolver el historial paginado en lugar de un array sin límite |
| Caché del tipo de cambio | Evitar consultar la base de datos en cada transacción, usando caché en memoria |
| Logging estructurado | Logs con contexto (usuario, endpoint, duración) útiles para observabilidad |
| Manejo de errores robusto | Errores específicos y descriptivos según el dominio, no mensajes genéricos |
| Tests E2E | Pruebas que cubran flujos completos (registro → login → transacción → historial) |
| Decisiones documentadas | Breve explicación en el README de las decisiones de arquitectura más relevantes |

---

## 📍 Instrucciones de entrega

- Crear un **repositorio público en GitHub** para el backend y otro para el frontend (o un monorepo si se prefiere).
- El `README.md` de cada repositorio debe incluir:
  - Descripción del proyecto.
  - Requisitos previos (Node.js, pnpm/npm, MongoDB, Docker, etc.).
  - Pasos detallados para levantar el proyecto en local.
  - Variables de entorno necesarias (acompañado de un archivo `.env.example`).
  - Cómo ejecutar las pruebas.
- Compartir el link del repositorio con la persona que te contactó una vez que la solución esté completa.
- En la siguiente etapa se realizará una entrevista técnica para revisar la solución.
- El tiempo estimado para completar la prueba es de **5 días** desde el inicio de la misma.

---

Quedamos atentos a cualquier consulta adicional, ¡muchos éxitos! 🚀
