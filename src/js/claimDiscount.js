import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions, isAppCheckConfigured } from "../config/firebase";

let authStatePromise;

function waitForInitialAuthState() {
  if (!authStatePromise) {
    authStatePromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        reject
      );
    });
  }

  return authStatePromise;
}

async function ensureAnonymousSession() {
  const currentUser = auth.currentUser ?? (await waitForInitialAuthState());

  if (currentUser) {
    await currentUser.getIdToken();
    return currentUser;
  }

  const credential = await signInAnonymously(auth);
  await credential.user.getIdToken();
  return credential.user;
}

function getErrorMessage(error) {
  if (error?.code === "functions/failed-precondition") {
    return "No quedan codigos disponibles.";
  }

  if (error?.code === "functions/unauthenticated") {
    return "No pudimos validar tu sesion en este momento.";
  }

  if (error?.code === "functions/permission-denied") {
    return "La aplicacion no pudo validar la solicitud.";
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message
      .replace(
        /^(internal|permission-denied|unavailable|unauthenticated|failed-precondition)\s*/i,
        ""
      )
      .trim();
  }

  return "No pudimos asignarte un codigo en este momento.";
}

export const claimDiscount = async () => {
  try {
    if (!isAppCheckConfigured) {
      return {
        error:
          "Falta configurar VITE_FIREBASE_APPCHECK_SITE_KEY para reclamar codigos.",
      };
    }

    await ensureAnonymousSession();
    const claimCode = httpsCallable(functions, "claimCode", {
      limitedUseAppCheckTokens: true,
    });
    const result = await claimCode();
    const data = result.data ?? {};

    if (!data.code) {
      return { error: "No quedan codigos disponibles." };
    }

    return {
      code: data.code,
      price: data.price ?? "",
    };
  } catch (error) {
    console.error("Error requesting code", error);
    return { error: getErrorMessage(error) };
  }
};
