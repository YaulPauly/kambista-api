# Despliegue QA en Google Cloud Run

El workflow [`deploy-qa.yml`](../.github/workflows/deploy-qa.yml) ejecuta los
quality gates y despliega la imagen a Cloud Run cuando se fusiona un cambio en
`main`. También puede ejecutarse manualmente desde GitHub Actions.

El flujo utiliza:

- Artifact Registry para almacenar la imagen Docker.
- Cloud Run para ejecutar el servicio.
- Secret Manager para secretos de runtime.
- Workload Identity Federation para autenticar GitHub Actions sin claves JSON
  persistentes.
- El entorno de GitHub `qa` para variables no sensibles.

La región sugerida para usuarios de Perú es `southamerica-west1` (Santiago),
por cercanía geográfica. La región debe ser consistente con los demás servicios
que utilice la aplicación.

## 1. Variables locales de configuración

Ejecuta estos comandos desde Google Cloud Shell o una terminal con `gcloud`
autenticado. Reemplaza los valores entre comillas:

```bash
export PROJECT_ID="tu-project-id"
export REGION="southamerica-west1"
export REPOSITORY="kambista-qa"
export SERVICE="kambista-api-qa"
export DEPLOYER_SA="kambista-qa-deployer"
export RUNTIME_SA="kambista-qa-runtime"
export GITHUB_REPOSITORY="YaulPauly/kambista-api"
```

Selecciona el proyecto y habilita las APIs necesarias:

```bash
gcloud config set project "$PROJECT_ID"
gcloud services enable \
  artifactregistry.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com
```

## 2. Artifact Registry y cuentas de servicio

```bash
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Kambista QA container images"

gcloud iam service-accounts create "$DEPLOYER_SA" \
  --display-name="Kambista QA GitHub deployer"

gcloud iam service-accounts create "$RUNTIME_SA" \
  --display-name="Kambista QA Cloud Run runtime"
```

Otorga al deployer únicamente permisos de despliegue y publicación:

```bash
export DEPLOYER_EMAIL="$DEPLOYER_SA@$PROJECT_ID.iam.gserviceaccount.com"
export RUNTIME_EMAIL="$RUNTIME_SA@$PROJECT_ID.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_EMAIL" \
  --role="roles/run.admin"

gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" \
  --location="$REGION" \
  --member="serviceAccount:$DEPLOYER_EMAIL" \
  --role="roles/artifactregistry.writer"

gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_EMAIL" \
  --member="serviceAccount:$DEPLOYER_EMAIL" \
  --role="roles/iam.serviceAccountUser"
```

## 3. Secret Manager

Crea cuatro secretos. No escribas sus valores directamente en el repositorio:

```bash
gcloud secrets create kambista-api-qa-mongodb-uri --replication-policy=automatic
gcloud secrets create kambista-api-qa-jwt-secret --replication-policy=automatic
gcloud secrets create kambista-api-qa-jwt-refresh-secret --replication-policy=automatic
gcloud secrets create kambista-api-qa-admin-password --replication-policy=automatic
```

Agrega cada valor como una nueva versión. Ejemplo:

```bash
printf '%s' "$MONGODB_URI" | \
  gcloud secrets versions add kambista-api-qa-mongodb-uri --data-file=-

printf '%s' "$JWT_SECRET" | \
  gcloud secrets versions add kambista-api-qa-jwt-secret --data-file=-

printf '%s' "$JWT_REFRESH_SECRET" | \
  gcloud secrets versions add kambista-api-qa-jwt-refresh-secret --data-file=-

printf '%s' "$ADMIN_PASSWORD" | \
  gcloud secrets versions add kambista-api-qa-admin-password --data-file=-
```

Permite que la cuenta de runtime lea los secretos:

```bash
for secret in \
  kambista-api-qa-mongodb-uri \
  kambista-api-qa-jwt-secret \
  kambista-api-qa-jwt-refresh-secret \
  kambista-api-qa-admin-password; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:$RUNTIME_EMAIL" \
    --role="roles/secretmanager.secretAccessor"
done
```

El workflow referencia la versión `latest` para simplificar la operación QA.
Para producción conviene fijar versiones explícitas y actualizar la referencia
de forma controlada.

## 4. Workload Identity Federation

Crea un pool y un proveedor restringido al repositorio:

```bash
export POOL_ID="github-actions"
export PROVIDER_ID="kambista-api"

gcloud iam workload-identity-pools create "$POOL_ID" \
  --location="global" \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_ID" \
  --location="global" \
  --workload-identity-pool="$POOL_ID" \
  --display-name="Kambista API GitHub provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository == '$GITHUB_REPOSITORY'"

export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
export WIF_PROVIDER="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID/providers/$PROVIDER_ID"
export WIF_POOL="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL_ID"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$WIF_POOL/attribute.repository/$GITHUB_REPOSITORY"
```

## 5. Variables del entorno `qa` en GitHub

Crea un environment llamado `qa` en `Settings > Environments` y registra estas
variables:

| Variable                            | Ejemplo                                                      |
| ----------------------------------- | ------------------------------------------------------------ |
| `GCP_PROJECT_ID`                    | `tu-project-id`                                              |
| `GCP_REGION`                        | `southamerica-west1`                                         |
| `ARTIFACT_REGISTRY_REPOSITORY`      | `kambista-qa`                                                |
| `CLOUD_RUN_SERVICE`                 | `kambista-api-qa`                                            |
| `GCP_DEPLOYER_SERVICE_ACCOUNT`      | `kambista-qa-deployer@tu-project-id.iam.gserviceaccount.com` |
| `GCP_RUNTIME_SERVICE_ACCOUNT`       | `kambista-qa-runtime@tu-project-id.iam.gserviceaccount.com`  |
| `GCP_WORKLOAD_IDENTITY_PROVIDER`    | valor completo de `WIF_PROVIDER`                             |
| `MONGODB_URI_SECRET_NAME`           | `kambista-api-qa-mongodb-uri`                                |
| `JWT_SECRET_NAME`                   | `kambista-api-qa-jwt-secret`                                 |
| `JWT_REFRESH_SECRET_NAME`           | `kambista-api-qa-jwt-refresh-secret`                         |
| `ADMIN_PASSWORD_SECRET_NAME`        | `kambista-api-qa-admin-password`                             |
| `CORS_ORIGIN`                       | URL del frontend QA o vacío                                  |
| `JWT_EXPIRES_IN`                    | `15m`                                                        |
| `JWT_REFRESH_EXPIRES_IN`            | `7d`                                                         |
| `LOGIN_RATE_LIMIT`                  | `5`                                                          |
| `LOGIN_RATE_WINDOW_MS`              | `60000`                                                      |
| `BCRYPT_SALT_ROUNDS`                | `12`                                                         |
| `ADMIN_NAME`                        | `QA Administrator`                                           |
| `ADMIN_EMAIL`                       | email del administrador QA                                   |
| `EXCHANGE_RATE_PROVIDER_URL`        | `https://api.apis.net.pe/v1/tipo-cambio-sunat`               |
| `EXCHANGE_RATE_REFRESH_INTERVAL_MS` | `30000`                                                      |
| `EXCHANGE_RATE_CACHE_TTL_MS`        | `60000`                                                      |
| `EXCHANGE_RATE_REQUEST_TIMEOUT_MS`  | `5000`                                                       |

No agregues los valores de `MONGODB_URI`, `JWT_SECRET`,
`JWT_REFRESH_SECRET` ni `ADMIN_PASSWORD` como variables de GitHub; el workflow
los obtiene desde Secret Manager.

## 6. Primer despliegue y validación

Después de fusionar el workflow a `main`, puedes ejecutarlo automáticamente o
seleccionar `Run workflow` manualmente.

El workflow ejecutará `npm run validate`, construirá la imagen con el SHA del
commit, la publicará en Artifact Registry y creará una nueva revisión de Cloud
Run con tráfico a la última revisión.

Verifica el servicio desde Cloud Shell:

```bash
gcloud run services describe "$SERVICE" \
  --region="$REGION" \
  --format='value(status.url)'
```

El workflow no cambia la política IAM de invocación. Si la API debe ser pública
para probarla con `curl`, configura esa política una sola vez:

```bash
gcloud run services add-iam-policy-binding "$SERVICE" \
  --region="$REGION" \
  --member="allUsers" \
  --role="roles/run.invoker"
```

Después podrás probar:

```bash
curl -i "$(gcloud run services describe "$SERVICE" \
  --region="$REGION" --format='value(status.url)')/"
```

## Riesgos QA pendientes

- Cloud Run no proporciona una IP de salida fija por defecto. Si MongoDB Atlas
  utiliza una lista de IP permitidas, se necesita configurar NAT/VPC o una
  alternativa de red antes de restringir el acceso por IP.
- La política `allUsers` hace público el endpoint. Para un entorno real debe
  evaluarse autenticación de entrada, API Gateway o un balanceador.
- El workflow publica imágenes por SHA, pero todavía no firma imágenes ni
  ejecuta Binary Authorization.
