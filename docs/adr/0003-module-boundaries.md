# ADR 0003: Definir los límites iniciales de los módulos

- Estado: Aceptado
- Fecha: 2026-11-25

## Decisión

Los módulos iniciales serán responsables de lo siguiente:

| Módulo           | Responsabilidad                                                              |
| ---------------- | ---------------------------------------------------------------------------- |
| `identity`       | Usuarios, credenciales, autenticación, roles y políticas de autorización.    |
| `currencies`     | Monedas soportadas y reglas para pares de divisas válidos.                   |
| `exchange-rates` | Integración con el proveedor, tipos de cambio almacenados, vigencia y caché. |
| `transactions`   | Casos de uso de conversión, registros e historial de transacciones.          |
| `shared`         | Primitives cross-cutting pequeñas y con reutilización demostrada.            |
| `platform`       | Arranque de NestJS, configuración y concerns HTTP globales.                  |

`transactions` podrá consumir un contrato de aplicación de `exchange-rates` y
un contexto del usuario autenticado. No debe consultar directamente el storage
de `identity` o `exchange-rates`. `identity` es dueño de las decisiones de
autorización; los controllers de transporte solo aplican el boundary y delegan
en casos de uso de aplicación.

## Justificación

Estos límites reflejan las responsabilidades descritas en la prueba técnica
original y evitan dividir prematuramente el sistema en servicios desplegables.
También mantienen los detalles de proveedores, persistencia y transporte fuera
de las reglas principales del negocio.

## Consecuencias

- Cada módulo puede evolucionar de forma independiente dentro del mismo
  proceso.
- Los contratos entre módulos son explícitos y comprobables.
- Las nuevas abstracciones shared requieren evidencia de reutilización.
- Los cambios de ownership entre módulos requieren actualizar un ADR.
