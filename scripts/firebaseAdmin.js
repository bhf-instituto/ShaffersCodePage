import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localServiceAccountPath = path.join(__dirname, "serviceAccountKey.json");
const firebaseRcPath = path.join(__dirname, "..", ".firebaserc");

function readJsonFile(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    throw new Error(`No se pudo leer ${label}.`);
  }
}

function getConfiguredProjectId() {
  if (process.env.FIREBASE_PROJECT_ID?.trim()) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }

  if (!existsSync(firebaseRcPath)) {
    return null;
  }

  const firebaseRc = readJsonFile(firebaseRcPath, ".firebaserc");
  const configuredProjects = Object.values(firebaseRc.projects ?? {}).filter(Boolean);
  const uniqueProjects = [...new Set(configuredProjects)];

  return uniqueProjects.length === 1 ? uniqueProjects[0] : null;
}

function getServiceAccountConfig() {
  const inlineServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (inlineServiceAccount?.trim()) {
    try {
      return {
        serviceAccount: JSON.parse(inlineServiceAccount),
        source: "FIREBASE_SERVICE_ACCOUNT_KEY",
      };
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no contiene un JSON valido.");
    }
  }

  const customServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (customServiceAccountPath?.trim()) {
    const resolvedPath = path.resolve(customServiceAccountPath.trim());

    if (!existsSync(resolvedPath)) {
      throw new Error(
        `No existe el archivo indicado en FIREBASE_SERVICE_ACCOUNT_PATH: ${resolvedPath}`
      );
    }

    return {
      serviceAccount: readJsonFile(
        resolvedPath,
        `la credencial de Firebase Admin en ${resolvedPath}`
      ),
      source: resolvedPath,
    };
  }

  if (!existsSync(localServiceAccountPath)) {
    return null;
  }

  return {
    serviceAccount: readJsonFile(
      localServiceAccountPath,
      `la credencial local ${localServiceAccountPath}`
    ),
    source: localServiceAccountPath,
  };
}

function getAdminConfig() {
  const configuredProjectId = getConfiguredProjectId();
  const serviceAccountConfig = getServiceAccountConfig();

  if (serviceAccountConfig) {
    const serviceAccountProjectId = serviceAccountConfig.serviceAccount.project_id ?? null;

    if (
      configuredProjectId &&
      serviceAccountProjectId &&
      configuredProjectId !== serviceAccountProjectId
    ) {
      throw new Error(
        `La credencial de Firebase Admin en ${serviceAccountConfig.source} pertenece a "${serviceAccountProjectId}", pero este repo esta configurado para "${configuredProjectId}". Descarga una nueva service account key del proyecto correcto o actualiza FIREBASE_SERVICE_ACCOUNT_KEY/FIREBASE_SERVICE_ACCOUNT_PATH.`
      );
    }

    return {
      credential: cert(serviceAccountConfig.serviceAccount),
      projectId: configuredProjectId ?? serviceAccountProjectId ?? undefined,
    };
  }

  if (!configuredProjectId) {
    throw new Error(
      "No se pudo detectar el project id de Firebase Admin. Define FIREBASE_PROJECT_ID o configura un unico proyecto en .firebaserc."
    );
  }

  return {
    credential: applicationDefault(),
    projectId: configuredProjectId,
  };
}

export function getAdminDb() {
  if (!getApps().length) {
    initializeApp(getAdminConfig());
  }

  return getFirestore();
}
