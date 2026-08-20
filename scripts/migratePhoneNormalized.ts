/**
 * Migration: Add phoneNormalized to existing patients
 * Run once: npx tsx scripts/migratePhoneNormalized.ts
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || "podologa-fabricia",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function migrate() {
  console.log("Starting phoneNormalized migration...");

  const patientsSnap = await getDocs(collection(db, "patients"));
  let updated = 0;
  let skipped = 0;

  for (const docSnap of patientsSnap.docs) {
    const data = docSnap.data();
    const phone = data.phone || "";

    if (data.phoneNormalized) {
      skipped++;
      continue;
    }

    const digits = phone.replace(/\D/g, "");
    if (!digits) {
      console.warn(`  [SKIP] ${docSnap.id} — no phone digits`);
      skipped++;
      continue;
    }

    await updateDoc(doc(db, "patients", docSnap.id), {
      phoneNormalized: digits,
    });
    updated++;
    console.log(`  [OK] ${docSnap.id} "${data.name}" → ${digits}`);
  }

  console.log(`Migration complete. Updated: ${updated}, Skipped: ${skipped}`);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
