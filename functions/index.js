const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");

initializeApp();

function getTimestampMillis(value) {
  return typeof value?.toMillis === "function" ? value.toMillis() : 0;
}

function pickNextCode(documents) {
  return documents
    .filter((document) => {
      const code = document.data().code;
      return typeof code === "string" && code.trim().length > 0;
    })
    .sort((left, right) => {
      const leftData = left.data();
      const rightData = right.data();

      const timestampDelta =
        getTimestampMillis(leftData.lastAssignedAt) -
        getTimestampMillis(rightData.lastAssignedAt);

      if (timestampDelta !== 0) {
        return timestampDelta;
      }

      const assignmentsDelta =
        (leftData.assignmentsCount ?? 0) - (rightData.assignmentsCount ?? 0);

      if (assignmentsDelta !== 0) {
        return assignmentsDelta;
      }

      return left.id.localeCompare(right.id);
    })[0];
}

exports.claimCode = onCall(async () => {
  const db = getFirestore();

  try {
    return await db.runTransaction(async (transaction) => {
      const collectionRef = db.collection("discountCodes");
      const snapshot = await transaction.get(collectionRef);
      const nextCode = pickNextCode(snapshot.docs);

      if (!nextCode) {
        throw new HttpsError(
          "failed-precondition",
          "No hay codigos configurados."
        );
      }

      const data = nextCode.data();

      transaction.set(
        nextCode.ref,
        {
          assignmentsCount: FieldValue.increment(1),
          lastAssignedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        code: data.code,
        price: data.price ?? "",
      };
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    console.error("Error assigning discount code", error);
    throw new HttpsError(
      "internal",
      "No pudimos asignar un codigo en este momento."
    );
  }
});
