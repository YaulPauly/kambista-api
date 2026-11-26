# Administración de usuarios

- El registro público siempre crea usuarios con rol `user`.
- No existe un endpoint para convertir usuarios en administradores.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD` no deben versionarse.
- Las contraseñas se almacenan únicamente como hashes bcrypt.

## Primer administrador

Configura estas variables en `.env`:

```env
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin.local@example.com
ADMIN_PASSWORD=replace-with-a-local-password
```

Luego levanta la aplicación:

```bash
docker compose up -d --build
```

El `AdminSeeder` es idempotente: si el email ya existe, no crea otro usuario.

## Administrador adicional

Primero genera un hash bcrypt. Reemplaza la contraseña solo localmente:

```bash
docker compose exec -T \
  -e NEW_ADMIN_PASSWORD='replace-with-a-local-password' \
  api node -e 'require("bcrypt").hash(process.env.NEW_ADMIN_PASSWORD, 12).then(console.log)'
```

Después inserta el administrador en MongoDB usando el hash generado:

```bash
docker compose exec mongo mongosh kambista --eval '
  db.users.insertOne({
    _id: "PASTE_UUID",
    name: "Support Administrator",
    email: "support.admin@example.com",
    passwordHash: "PASTE_BCRYPT_HASH",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date()
  })
'
```

Genera un UUID nuevo con:

```bash
uuidgen
```

Verifica usuarios sin mostrar hashes:

```bash
docker compose exec mongo mongosh kambista \
  --eval 'db.users.find({}, {passwordHash: 0}).pretty()'
```

Este procedimiento es administrativo y no debe exponerse como endpoint HTTP.
