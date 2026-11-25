# ADR 0001: Utilizar un monolito modular

- Estado: Aceptado
- Fecha: 2026-11-25

## Contexto

La prueba técnica requiere una única API backend con autenticación, gestión del
tipo de cambio e historial de transacciones. El proyecto es lo suficientemente
pequeño para desplegarse como un solo servicio, pero sus áreas de negocio tienen
límites claros que deben mantenerse a medida que crezca la funcionalidad.

## Decisión

Implementaremos el backend como un monolito modular con NestJS y Express. Los
módulos de negocio iniciales son `identity`, `currencies`, `exchange-rates` y
`transactions`. `shared` contendrá únicamente primitives cross-cutting
demostradas, mientras `platform` será responsable de la composición,
configuración y concerns HTTP globales. La persistencia y los adapters de
servicios externos pertenecerán a la infraestructura del módulo dueño.

Los módulos se desplegarán juntos, pero serán dueños de sus reglas de dominio,
casos de uso y contratos públicos. La colaboración entre módulos ocurrirá a
través de esos contratos, no mediante el acceso directo a detalles de
persistencia de otro módulo.

## Consecuencias

Consecuencias positivas:

- Un único despliegue y límite operativo para la prueba técnica.
- Propiedad clara del comportamiento de negocio y del acceso a datos.
- Posibilidad de extraer un módulo más adelante si la escala o la propiedad lo
  requieren.

Trade-offs:

- Los límites entre módulos deben protegerse activamente porque el compilador
  no puede imponer todas las reglas arquitectónicas.
- Una base de datos compartida no elimina la necesidad de propiedad por módulo.
- La aplicación necesitará integration tests para la colaboración entre módulos.

## Alternativas consideradas

- Se rechazó una arquitectura de microservicios por añadir complejidad
  operativa innecesaria para el alcance actual.
- Se rechazó una estructura NestJS plana porque mezclaría transporte, negocio e
  infraestructura al añadir nuevas funcionalidades.
