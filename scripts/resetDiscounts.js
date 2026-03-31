import { getAdminDb } from "./firebaseAdmin.js";

const db = getAdminDb();

async function deleteCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();

  snapshot.forEach((document) => {
    batch.delete(document.ref);
  });

  await batch.commit();
  console.log(`${snapshot.size} documentos eliminados de ${collectionName}.`);
}

async function resetDiscounts() {
  const discountSnapshot = await db.collection("discountCodes").get();
  const batch = db.batch();

  discountSnapshot.forEach((document) => {
    batch.set(
      document.ref,
      {
        claimed: false,
        assignmentsCount: 0,
        lastAssignedAt: null,
      },
      { merge: true }
    );
  });

  await batch.commit();
  console.log(`${discountSnapshot.size} codigos reiniciados.`);

  await deleteCollection("claims");
  await deleteCollection("logs");
}

resetDiscounts().catch(console.error);
