# ADR 0009: Solicitudes e historial de transacciones

- Estado: Aceptada
- Fecha: 2026-11-26

## Contexto

La prueba técnica requiere crear solicitudes de cambio USD/PEN y PEN/USD, usar
el último tipo de cambio disponible, guardar la operación y consultar el
historial filtrado por rango de fechas.

También requiere que un usuario solo consulte sus propias operaciones, mientras
que un administrador pueda consultar las operaciones de cualquier usuario.

## Decisión

- `transactions` es dueño de la entidad `Transaction`, el cálculo de la
  conversión y el historial.
- La aplicación obtiene el tipo de cambio mediante
  `GetLatestExchangeRateUseCase`; no consulta directamente SUNAT, MongoDB ni la
  caché.
- Para `USD → PEN` se utiliza la tasa de venta y para `PEN → USD` se utiliza la
  tasa de compra como divisor.
- Los montos recibidos admiten hasta dos decimales y un máximo de
  `9,999,999.99`. El resultado se redondea a dos decimales.
- La solicitud se persiste con el usuario autenticado, par, monto original,
  monto cambiado, tipo de cambio aplicado y fecha de creación.
- El historial recibe un rango obligatorio `startDate`/`endDate`.
- El caso de uso de historial resuelve el usuario objetivo:
  - `user`: siempre su propio `sub` del JWT.
  - `admin`: `userId` solicitado si existe; de lo contrario, su propio `sub`.
- La autorización se aplica en la capa HTTP con `JwtAuthGuard` y la regla de
  ownership se mantiene en el caso de uso para que no dependa del controller.
- El repository de MongoDB tiene un índice compuesto por `userId` y
  `createdAt` para soportar el filtro y el orden descendente del historial.
- El historial utiliza paginación con `page=1` y `pageSize=12` por defecto; el
  tamaño máximo permitido es 100.
- La respuesta del historial utiliza `{ data, meta }` para que el contrato
  pueda crecer sin romper la lista de transacciones.
- Los tests utilizan repositories en memoria y cubren cálculo, autorización,
  validaciones y contratos HTTP E2E.

## Consecuencias

El módulo puede evolucionar hacia más pares de monedas sin que los controllers
consulten proveedores o persistencia directamente. El cálculo actual está
limitado a las monedas soportadas por `currencies` y utiliza la precisión
monetaria requerida por la prueba.

La respuesta del historial deja de ser un array plano y ahora incluye
metadatos de paginación. Las pruebas E2E actuales continúan usando repositorios
en memoria; la persistencia real se verifica mediante Docker e integración con
MongoDB.
