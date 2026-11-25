# ADR 0002: Aplicar arquitectura hexagonal y límites DDD

- Estado: Aceptado
- Fecha: 2026-11-25

## Contexto

El dominio debe poder probarse y mantenerse independiente de NestJS, Express,
MongoDB y el proveedor SUNAT. La prueba también evalúa separación de
responsabilidades, inversión de dependencias y mantenibilidad.

## Decisión

Cada módulo de negocio separará:

- `domain`: entities, value objects, domain services e invariantes.
- `application`: casos de uso y ports de entrada/salida.
- `infrastructure`: adapters HTTP de entrada e implementaciones de salida del
  módulo.

Las dependencias apuntan hacia dentro. El dominio no depende de ningún
framework. La aplicación depende de ports y la infraestructura depende de los
contratos de aplicación. La inyección de dependencias de NestJS se utilizará en
los límites de composición y no se convertirá en una dependencia del dominio.

## Consecuencias

- El dominio y los casos de uso pueden probarse sin MongoDB ni un servidor HTTP.
- SUNAT y MongoDB pueden reemplazarse detrás de ports de salida.
- Se introducen más archivos y contratos explícitos donde una función simple
  podría parecer suficiente.
- Las abstracciones solo deben añadirse cuando protejan un límite real o
  habiliten una prueba necesaria.

## Regla de validación

Cuando se añada una dependencia de un módulo de negocio hacia otra capa, el
cambio debe explicar por qué pertenece allí y actualizar el ADR correspondiente
si cambia el límite.
