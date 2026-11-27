# ADR 0012: Despliegue QA en Cloud Run

- Estado: Aceptada
- Fecha: 2026-11-26

## Contexto

El backend debe disponer de un entorno QA reproducible sin introducir todavía
un pipeline de producción. La imagen ya cuenta con un Dockerfile multistage y
GitHub Actions ejecuta los quality gates.

## Decisión

- `main` despliega automáticamente al servicio `kambista-api-qa` mediante
  GitHub Actions.
- El flujo también puede ejecutarse manualmente con `workflow_dispatch`.
- Las imágenes se publican en Artifact Registry con el SHA del commit como tag.
- Cloud Run ejecuta la imagen con una cuenta de runtime separada de la cuenta
  que despliega.
- GitHub Actions utiliza Workload Identity Federation; no se almacenan claves
  JSON de cuentas de servicio.
- Los secretos de runtime se mantienen en Secret Manager y se inyectan como
  variables de entorno de Cloud Run.
- QA utiliza `min=0` y `max=3` instancias para controlar el costo inicial.

## Consecuencias

Cada merge a `main` que pase los quality gates produce una revisión inmutable
de Cloud Run. El servicio puede escalar a cero y la API no requiere administrar
servidores.

La conexión a MongoDB depende de un proveedor externo accesible desde Cloud Run.
La configuración de IP fija, observabilidad avanzada, firma de imágenes y
despliegue de producción quedan fuera de esta etapa.
