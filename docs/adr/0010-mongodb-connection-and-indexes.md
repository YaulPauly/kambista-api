# ADR 0010: Conexión MongoDB e índices de consulta

- Estado: Aceptada
- Fecha: 2026-11-26

## Contexto

Los módulos `identity`, `exchange-rates` y `transactions` utilizan MongoDB.
Registrar una conexión Mongoose por módulo puede crear conexiones duplicadas y
dificulta controlar el ciclo de vida de la base de datos.

Las consultas actuales tienen patrones concretos de búsqueda y ordenamiento:

- Usuarios por email.
- Último tipo de cambio por par y fecha de consulta.
- Historial por usuario y rango de fechas, ordenado del más reciente al más
  antiguo.

## Decisión

- `platform/persistence` registra una sola conexión mediante
  `MongoDbModule.register()`.
- Los módulos de negocio solo registran sus modelos con
  `MongooseModule.forFeature()`.
- `users` mantiene un índice único por `email`.
- `exchange_rates` mantiene el índice compuesto
  `{ baseCurrency: 1, quoteCurrency: 1, fetchedAt: -1 }`.
- `transactions` mantiene el índice compuesto
  `{ userId: 1, createdAt: -1 }`.
- No se mantienen índices individuales de `fetchedAt`, `userId` o `createdAt`
  porque las consultas actuales ya están cubiertas por los índices compuestos.

## Consecuencias

Las búsquedas principales pueden filtrar y ordenar usando un solo índice
compuesto. Cada inserción actualiza menos índices secundarios y reduce el costo
de escritura.

El cambio de schema no elimina automáticamente índices ya creados en una base
existente. La eliminación de índices redundantes debe ejecutarse como una tarea
controlada de mantenimiento después de verificar los nombres y planes de
ejecución en el entorno correspondiente.

La conexión queda centralizada en `platform`, mientras cada módulo conserva la
propiedad de su schema y repository.
