# ADR 0008: Proveedor, persistencia y caché de exchange-rates

- Estado: Aceptada
- Fecha: 2026-11-26

## Contexto

La plataforma necesita obtener el tipo de cambio USD/PEN desde un proveedor
externo, conservar snapshots para disponer de un último valor persistido y
evitar consultar MongoDB en cada operación futura de conversión.

La implementación debe permitir incorporar otros pares y proveedores sin llevar
HTTP, configuración ni persistencia al dominio.

## Decisión

- El dominio representa un `ExchangeRate` asociado a un `CurrencyPair` y
  conserva compra, venta, origen, fecha efectiva y fecha de consulta.
- El proveedor externo se consume mediante el port
  `ExchangeRateProvider`; el adapter SUNAT traduce la respuesta externa al
  contrato interno y valida su forma antes de entregarla a la aplicación.
- La URL, token opcional, timeout e intervalos se configuran mediante variables
  de entorno. La actualización ocurre al iniciar la aplicación y cada 30
  segundos por defecto.
- `RefreshExchangeRateUseCase` obtiene el valor externo, lo persiste y
  actualiza la caché en memoria.
- `GetLatestExchangeRateUseCase` consulta primero la caché en memoria. Si no
  encuentra una entrada vigente, consulta el repository, actualiza la caché y
  devuelve el resultado.
- La caché utiliza TTL configurable y una implementación local basada en
  `Map`, suficiente para el monolito actual. No se agrega Redis en esta etapa.
- MongoDB es el repository de producción cuando existe `MONGODB_URI`; los tests
  y la ejecución sin MongoDB utilizan un repository en memoria.
- El scheduler registra un mensaje genérico cuando una actualización falla y no
  detiene la aplicación. No se exponen respuestas ni credenciales del
  proveedor en logs.
- No se agrega todavía un controller HTTP para tipos de cambio. El módulo
  `transactions` consumirá el caso de uso mediante el contrato exportado.

## Consecuencias

La primera lectura después de que la caché expire puede consultar MongoDB, pero
las lecturas siguientes usan memoria hasta el vencimiento del TTL. La
persistencia de snapshots permite recuperar el último valor disponible si el
proveedor externo falla durante una actualización.

La solución actual está preparada para ampliar las monedas, pero cada nuevo
par debe incorporarse explícitamente a `currencies` y contar con una fuente
externa compatible. El proveedor actual entrega USD/PEN.

## Alternativas descartadas

- Consultar el proveedor externo dentro de cada transacción: aumenta la
  latencia y acopla la operación crítica a la disponibilidad del proveedor.
- Consultar MongoDB en cada lectura: evita memoria local, pero genera carga
  innecesaria y no cumple el requisito de caché.
- Agregar Redis ahora: introduce infraestructura y operación adicional sin una
  necesidad demostrada para el monolito de la prueba técnica.
- Añadir `@nestjs/schedule`: un intervalo administrado por el ciclo de vida del
  módulo cubre el requerimiento actual sin instalar otra dependencia.
