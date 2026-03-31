import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getCredential() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountJson) {
    return applicationDefault();
  }

  try {
    return cert(JSON.parse(serviceAccountJson));
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no contiene un JSON valido.");
  }
}

export function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: getCredential(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  return getFirestore();
}
