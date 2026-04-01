import { getAdminDb } from "./firebaseAdmin.js";

const db = getAdminDb();

const codes = [
  { code: "SH-9X3K2L", price: "PAPAS EXTRA" },
  { code: "SH-Y8J4D1", price: "MEDALLON EXTRA" },
  { code: "SH-V3B7N9", price: "MEDALLON EXTRA" },
  { code: "SH-W6Z2K8", price: "10% OFF" },
  { code: "SH-P9J1A2", price: "10% OFF" },
  { code: "SH-Q3M4N5", price: "10% OFF" },
  { code: "SH-F9V5G1", price: "10% OFF" },
  { code: "SH-A1R2D9", price: "10% OFF" },
  { code: "SH-T8L5X3", price: "10% OFF" },
  { code: "SH-B4Y6E7", price: "10% OFF" },
];

async function seedCodes() {
  const batch = db.batch();

  codes.forEach((data) => {
    const docRef = db.collection("discountCodes").doc(data.code);

    batch.set(
      docRef,
      {
        code: data.code,
        price: data.price,
        assigned: false,
        assignedAt: null,
        assignedToUid: null,
      },
      { merge: true }
    );
  });

  await batch.commit();
  console.log(`${codes.length} codigos cargados correctamente.`);
}

seedCodes().catch(console.error);
