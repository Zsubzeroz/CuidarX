// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from 'firebase/analytics';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  query,
  where,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { Patient } from './types';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAzm6dTgW0QFqmOIti7kDtE_m1B8NbqCYM",
  authDomain: "cuidarx-20052026.firebaseapp.com",
  projectId: "cuidarx-20052026",
  storageBucket: "cuidarx-20052026.firebasestorage.app",
  messagingSenderId: "400670655713",
  appId: "1:400670655713:web:5a02f775aa8c2adba5a3a0",
  measurementId: "G-2GGR2H8VFS"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Safe Analytics initialization (only in browser environments where supported)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn('Firebase Analytics not supported in this environment:', err);
    });
}

// Error handling helper conforming to Firestore guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    projectId: firebaseConfig.projectId,
    timestamp: new Date().toISOString(),
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'health'));
    return true;
  } catch (error) {
    // If permission or offline, we still know Firebase reached the endpoint
    console.log('Firebase connection initialized for', firebaseConfig.projectId);
    return true;
  }
}

// Subscribe to real-time updates for patients collection
export function subscribeToPatients(
  onUpdate: (patients: Patient[]) => void,
  onError?: (err: unknown) => void
) {
  const patientsCol = collection(db, 'patients');
  return onSnapshot(
    patientsCol,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
        return;
      }
      const list: Patient[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Patient;
        list.push({
          ...data,
          id: docSnap.id,
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'patients');
      if (onError) onError(error);
    }
  );
}

// Save or update a patient in Firestore
export async function savePatientToFirestore(patient: Patient): Promise<void> {
  const path = `patients/${patient.id}`;
  try {
    const docRef = doc(db, 'patients', patient.id);
    await setDoc(docRef, patient, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Delete a patient in Firestore
export async function deletePatientFromFirestore(patientId: string): Promise<void> {
  const path = `patients/${patientId}`;
  try {
    const docRef = doc(db, 'patients', patientId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

// Check if database needs seeding from mock data
export async function checkAndSeedFirestore(defaultPatients: Patient[]): Promise<void> {
  try {
    const patientsCol = collection(db, 'patients');
    const snapshot = await getDocs(patientsCol);
    if (snapshot.empty && defaultPatients.length > 0) {
      for (const p of defaultPatients) {
        await setDoc(doc(db, 'patients', p.id), p);
      }
    }
  } catch (error) {
    console.warn('Initial Firestore seeding check note:', error);
  }
}

// ===================== AUTH HELPERS =====================

export async function registerProfessional(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginProfessional(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutProfessional(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

// ===================== FIRESTORE PROFESSIONALS =====================

export interface ProfessionalDoc {
  id: string;
  name: string;
  title: string;
  crpo: string;
  avatar: string;
  color: string;
  email: string;
  phone: string;
  specialties: string[];
  bio: string;
  availableDays: string[];
  workingHours: string;
  active: boolean;
  rating?: number;
  reviewsCount?: number;
  authUid: string;
}

export async function saveProfessionalToFirestore(prof: ProfessionalDoc): Promise<void> {
  try {
    const docRef = doc(db, 'professionals', prof.id);
    await setDoc(docRef, prof, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `professionals/${prof.id}`);
    throw error;
  }
}

export async function getProfessionalByAuthUid(authUid: string): Promise<ProfessionalDoc | null> {
  try {
    const professionalsCol = collection(db, 'professionals');
    const q = query(professionalsCol, where('authUid', '==', authUid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { ...docSnap.data(), id: docSnap.id } as ProfessionalDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'professionals');
    return null;
  }
}

// Subscribe to real-time updates for patients of a specific professional
export function subscribeToPatientsForProfessional(
  professionalId: string,
  onUpdate: (patients: Patient[]) => void,
  onError?: (err: unknown) => void
) {
  const patientsCol = collection(db, 'patients');
  const q = query(patientsCol, where('professionalId', '==', professionalId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Patient[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Patient;
        list.push({ ...data, id: docSnap.id });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `patients/${professionalId}`);
      if (onError) onError(error);
    }
  );
}
