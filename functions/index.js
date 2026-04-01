const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const logger = require("firebase-functions/logger");
const { HttpsError, onCall } = require("firebase-functions/v2/https");

initializeApp();

const db = getFirestore();

function getCodePayload(documentSnapshot) {
  const data = documentSnapshot.data() ?? {};
  const code =
    typeof data.code === "string" && data.code.trim().length > 0
      ? data.code.trim()
      : documentSnapshot.id;

  return {
    code,
    price: data.price ?? "",
  };
}

exports.claimCode = onCall(
  {
    enforceAppCheck: true,
    consumeAppCheckToken: true,
  },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      throw new HttpsError(
        "unauthenticated",
        "Debes iniciar sesion anonima antes de reclamar un codigo."
      );
    }

    const assignmentRef = db.collection("codeAssignments").doc(uid);

    try {
      return await db.runTransaction(async (transaction) => {
        const assignmentSnapshot = await transaction.get(assignmentRef);

        if (assignmentSnapshot.exists) {
          const assignmentData = assignmentSnapshot.data() ?? {};
          const assignedCodeId = assignmentData.codeId;

          if (typeof assignedCodeId !== "string" || !assignedCodeId.trim()) {
            logger.error("Assignment without valid codeId", {
              uid,
              assignmentId: assignmentSnapshot.id,
            });

            throw new HttpsError(
              "data-loss",
              "La asignacion guardada es invalida."
            );
          }

          const codeRef = db.collection("discountCodes").doc(assignedCodeId);
          const codeSnapshot = await transaction.get(codeRef);

          if (!codeSnapshot.exists) {
            logger.error("Assignment references a missing code", {
              uid,
              assignedCodeId,
            });

            throw new HttpsError(
              "data-loss",
              "La asignacion guardada apunta a un codigo inexistente."
            );
          }

          transaction.set(
            assignmentRef,
            {
              lastSeenAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          return getCodePayload(codeSnapshot);
        }

        const availableCodesQuery = db
          .collection("discountCodes")
          .where("assigned", "==", false)
          .limit(1);

        const availableCodesSnapshot = await transaction.get(availableCodesQuery);

        if (availableCodesSnapshot.empty) {
          throw new HttpsError(
            "failed-precondition",
            "No quedan codigos disponibles."
          );
        }

        const selectedCodeSnapshot = availableCodesSnapshot.docs[0];
        const payload = getCodePayload(selectedCodeSnapshot);

        transaction.set(
          selectedCodeSnapshot.ref,
          {
            assigned: true,
            assignedAt: FieldValue.serverTimestamp(),
            assignedToUid: uid,
          },
          { merge: true }
        );

        transaction.set(
          assignmentRef,
          {
            uid,
            codeId: selectedCodeSnapshot.id,
            code: payload.code,
            price: payload.price,
            appId: request.app?.appId ?? null,
            createdAt: FieldValue.serverTimestamp(),
            lastSeenAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        return payload;
      });
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error("Unexpected error claiming code", error);

      throw new HttpsError(
        "internal",
        "No pudimos asignar un codigo en este momento."
      );
    }
  }
);
