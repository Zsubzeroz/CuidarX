import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

let dbFirestore: any = null;
let isFirebaseEnabled = false;

// Initialize Firebase client SDK lazily if key is provided
if (process.env.FIREBASE_API_KEY) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbFirestore = getFirestore(app);
    isFirebaseEnabled = true;
    console.log("🔥 Firebase initialized successfully! Connected to Project:", firebaseConfig.projectId);
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
  }
} else {
  console.log("ℹ️ FIREBASE_API_KEY not set. Continuing with local file storage.");
}

/**
 * Fetch all collections from Firestore
 */
export async function fetchFromFirestore() {
  if (!isFirebaseEnabled || !dbFirestore) return null;
  try {
    console.log("📡 Fetching clinical data from Cloud Firestore...");
    
    // Fetch patients
    const patientsSnap = await getDocs(collection(dbFirestore, "patients"));
    const patients: any[] = [];
    patientsSnap.forEach((docSnap) => {
      patients.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Fetch appointments
    const appointmentsSnap = await getDocs(collection(dbFirestore, "appointments"));
    const appointments: any[] = [];
    appointmentsSnap.forEach((docSnap) => {
      appointments.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Fetch finances
    const financesSnap = await getDocs(collection(dbFirestore, "finances"));
    const finances: any[] = [];
    financesSnap.forEach((docSnap) => {
      finances.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Fetch services
    const servicesSnap = await getDocs(collection(dbFirestore, "services"));
    const services: any[] = [];
    servicesSnap.forEach((docSnap) => {
      services.push({ id: docSnap.id, ...docSnap.data() });
    });

    console.log(`✅ Fetched: ${patients.length} patients, ${appointments.length} appointments, ${finances.length} finances, ${services.length} services from Firestore.`);
    return { patients, appointments, finances, services };
  } catch (error) {
    console.error("❌ Error fetching from Firestore:", error);
    return null;
  }
}

/**
 * Save or update a single document in a collection
 */
export async function saveToFirestore(collectionName: string, id: string, data: any) {
  if (!isFirebaseEnabled || !dbFirestore) return;
  try {
    // Avoid saving the id inside the data payload if redundant, but keep for consistency
    const docRef = doc(dbFirestore, collectionName, id);
    // Remove the id from data to avoid duplicating it as a field and document ID
    const cleanData = { ...data };
    delete cleanData.id;
    await setDoc(docRef, cleanData);
    console.log(`☁️ Saved doc ${id} to collection ${collectionName} in Firestore.`);
  } catch (error) {
    console.error(`❌ Error saving doc ${id} to Firestore:`, error);
  }
}

/**
 * Delete a single document from a collection
 */
export async function deleteFromFirestore(collectionName: string, id: string) {
  if (!isFirebaseEnabled || !dbFirestore) return;
  try {
    const docRef = doc(dbFirestore, collectionName, id);
    await deleteDoc(docRef);
    console.log(`☁️ Deleted doc ${id} from collection ${collectionName} in Firestore.`);
  } catch (error) {
    console.error(`❌ Error deleting doc ${id} from Firestore:`, error);
  }
}

/**
 * Upload all local data to Firestore (used for seeding/initial migration)
 */
export async function uploadLocalToFirestore(localDb: { patients: any[]; appointments: any[]; finances: any[]; services?: any[] }) {
  if (!isFirebaseEnabled || !dbFirestore) return;
  try {
    console.log("🚀 Migrating local clinic data to Cloud Firestore...");
    
    // Migrate patients
    for (const patient of localDb.patients) {
      await saveToFirestore("patients", patient.id, patient);
    }

    // Migrate appointments
    for (const appt of localDb.appointments) {
      await saveToFirestore("appointments", appt.id, appt);
    }

    // Migrate finances
    for (const finance of localDb.finances) {
      await saveToFirestore("finances", finance.id, finance);
    }

    // Migrate services
    if (localDb.services) {
      for (const service of localDb.services) {
        await saveToFirestore("services", service.id, service);
      }
    }

    console.log("🏆 Local data successfully synchronized with Cloud Firestore.");
  } catch (error) {
    console.error("❌ Error during local migration to Firestore:", error);
  }
}

export { isFirebaseEnabled };
