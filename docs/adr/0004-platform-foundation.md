# ADR 0004: Establecer una base mínima de plataforma

- Estado: Aceptado
- Fecha: 2026-11-25

## Contexto

La aplicación necesita configuración de runtime y protecciones HTTP globales
antes de introducir módulos de negocio. El scaffold debe seguir ejecutándose sin
un servidor MongoDB mientras ningún módulo consuma un adapter de persistencia.

## Decisión

`platform/config` es dueño de la configuración validada del entorno.
`platform/http` es dueño de los concerns HTTP globales: headers de seguridad,
CORS, validación de requests y logging de requests. La aplicación utiliza el
logger incluido en NestJS con eventos JSON estructurados y no registra query
strings ni credenciales.

`MONGODB_URI` forma parte del contrato de configuración validado, pero la
conexión a MongoDB será creada por la infraestructura específica de un módulo
cuando exista un adapter concreto de persistencia. La plataforma no abrirá una
conexión global que no se utilice.

## Consecuencias

- Los valores inválidos del entorno provocan un fallo durante el arranque.
- Los nuevos DTOs reciben validación consistente mediante whitelist y
  transformación.
- Los defaults de seguridad y observabilidad se aplican uniformemente a las
  rutas HTTP.
- La aplicación puede ejecutarse y probarse sin un servicio externo de MongoDB.
- La propiedad de la conexión MongoDB será explícita cuando se implemente el
  primer repository.
