# ADR 0007: Definir las reglas de currencies

- Estado: Aceptado
- Fecha: 2026-11-26

## Contexto

La prueba técnica actualmente requiere conversiones entre USD y PEN. El diseño
debe permitir incorporar EUR u otras monedas cuando exista un proveedor de tipo
de cambio que las soporte, sin acoplar las reglas del dominio a ese proveedor.

## Decisión

- `CurrencyCode` será un value object que normaliza y valida códigos soportados.
- La lista inicial de códigos soportados será `USD` y `PEN`.
- `CurrencyPair` validará que las monedas sean soportadas y diferentes.
- No se agregará persistencia ni un CRUD HTTP de monedas en esta etapa.
- La integración con proveedores, persistencia del tipo de cambio y scheduler de
  30 segundos pertenecerán al módulo `exchange-rates`.

## Consecuencias

- `transactions` podrá validar pares mediante un contrato de dominio explícito.
- Agregar EUR requerirá ampliar la lista de códigos y el proveedor de rates,
  sin cambiar la regla general de pares.
- El módulo `currencies` no depende de MongoDB, NestJS ni de un proveedor externo.
