import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";

const claimCode = httpsCallable(functions, "claimCode");

function getErrorMessage(error) {
  if (error?.code === "functions/failed-precondition") {
    return "No hay codigos configurados.";
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.replace(/^internal\s*/i, "").trim();
  }

  return "No pudimos asignarte un codigo en este momento.";
}

export const claimDiscount = async () => {
  try {
    const result = await claimCode();
    const data = result.data ?? {};

    if (!data.code) {
      return { error: "No hay codigos configurados." };
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
