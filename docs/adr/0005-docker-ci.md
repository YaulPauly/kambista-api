# ADR 0005: Estandarizar Docker y CI

- Estado: Aceptado
- Fecha: 2026-11-25

## Contexto

El proyecto necesita una forma reproducible de ejecutarse localmente y gates
automáticos antes de fusionar cambios en `main`. El proceso no debe publicar
imágenes ni utilizar secretos para validar el código.

## Decisión

- La imagen de la API se construirá mediante un Dockerfile multistage.
- La imagen final utilizará solo dependencias de producción y un usuario no
  root.
- Docker Compose proporcionará la API y MongoDB para desarrollo local.
- MongoDB no se expondrá directamente al host desde Compose; la API accederá a
  través de la red interna de Compose.
- GitHub Actions ejecutará typecheck, lint, format check, build, unit tests,
  E2E, audit de dependencias de producción y build de Docker.
- El workflow tendrá permisos mínimos de lectura y no publicará imágenes.

## Consecuencias

- Los pull requests reciben una validación homogénea antes del merge.
- La imagen de producción no contiene código de pruebas ni archivos de entorno.
- El entorno Compose es local y no debe reutilizarse directamente como
  configuración de producción.
- El despliegue, Container Registry y CD quedan fuera de esta etapa.
