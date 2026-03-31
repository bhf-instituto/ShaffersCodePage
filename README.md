# ShaffersCodePage Demo

Demo en React + Vite con backend serverless en Firebase.

La experiencia visual se mantiene igual, pero el flujo ahora es mucho mas simple:

- cualquier visitante puede abrir la web desde cualquier dispositivo
- el frontend pide el codigo a una Cloud Function
- la Cloud Function rota los codigos guardados en Firestore
- si no hay codigos cargados, se muestra el error real

## Saneamiento del repo

Este proyecto tenia archivos sensibles versionados. Ya quedaron ignorados:

- `.env`
- `scripts/serviceAccountKey.json`

Los scripts admin ahora usan:

- `GOOGLE_APPLICATION_CREDENTIALS`
- o `FIREBASE_SERVICE_ACCOUNT_KEY`

Importante:
Las credenciales que ya estuvieron publicadas en el historial viejo deben rotarse o revocarse antes de abrir el nuevo repositorio.

## Frontend

1. Crear `.env` a partir de `.env.example`
2. Ejecutar `npm install`
3. Ejecutar `npm run dev`

## Backend serverless

1. Entrar a `functions`
2. Ejecutar `npm install`
3. Desplegar con `firebase deploy --only functions`

La funcion publicada es `claimCode`.

## Carga y reseteo de codigos

Antes de correr scripts admin, configurar credenciales con una de estas opciones:

- `GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/serviceAccountKey.json`
- `FIREBASE_SERVICE_ACCOUNT_KEY='{\"type\":\"service_account\",...}'`

Si hace falta, tambien se puede definir `FIREBASE_PROJECT_ID`.

Scripts:

- `node scripts/seedDiscountCodes.js`
- `node scripts/resetDiscounts.js`
