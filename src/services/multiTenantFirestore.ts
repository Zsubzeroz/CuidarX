import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDoc,
  getDocs,
  writeBatch,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "./firebase";
import type { Patient, Appointment, FinanceRecord, ClinicService, ScheduleBlock } from "../types";

type Unsubscribe = () => void;

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  doctorName: string;
  doctorSpecialty: string;
  logoPath: string;
  primaryColor: string;
  accentColor: string;
  whatsappDefaultMessage: string;
  clinicUrl: string;
  createdAt: string;
  updatedAt: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  acceptsInsurance?: boolean;
  ownerEmail?: string;
  appId?: string;
  averageRating?: number;
  reviewCount?: number;
  priceRange?: { min: number; max: number };
  subscription?: {
    plan: "free" | "basic" | "pro" | "enterprise";
    status: "active" | "canceled" | "past_due";
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodEnd?: string;
  };
  settings?: {
    allowOnlineBooking: boolean;
    requireConfirmation: boolean;
    bookingWindowDays: number;
    timezone: string;
    expedienteStart?: string;
    expedienteEnd?: string;
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  clinicId: string;
  role: "owner" | "admin" | "professional" | "receptionist";
  createdAt: string;
  lastLoginAt: string;
}

const COLLECTIONS = {
  clinics: "clinics",
  users: "users",
  patients: "patients",
  appointments: "appointments",
  finances: "finances",
  services: "services",
  scheduleBlocks: "scheduleBlocks",
  blockedDays: "blockedDays",
  appData: "appData",
} as const;

function getClinicId(): string | null {
  return auth?.currentUser?.uid ? null : null;
}

async function getCurrentUserClinicId(): Promise<string | null> {
  if (!auth?.currentUser) return null;
  const userDoc = await getDoc(doc(db!, COLLECTIONS.users, auth.currentUser.uid));
  if (!userDoc.exists()) return null;
  return userDoc.data().clinicId || null;
}

function clinicCollection<T extends { id: string }>(
  clinicId: string,
  collectionName: string
) {
  return collection(db!, COLLECTIONS.clinics, clinicId, collectionName);
}

function clinicDoc(clinicId: string, collectionName: string, docId: string) {
  return doc(db!, COLLECTIONS.clinics, clinicId, collectionName, docId);
}

export function listenCollection<T extends { id: string }>(
  clinicId: string,
  collectionName: string,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void,
  constraints?: any[]
): Unsubscribe {
  if (!isFirebaseConfigured || !db || !clinicId) {
    callback([]);
    return () => {};
  }

  const collRef = clinicCollection<T>(clinicId, collectionName);
  const q = constraints ? query(collRef, ...constraints) : collRef;
  
  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as T);
      });
      callback(items);
    },
    (error) => {
      console.error(`Firestore listener error [${clinicId}/${collectionName}]:`, error);
      onError?.(error);
    }
  );
}

export async function createDocument<T extends { id: string }>(
  clinicId: string,
  collectionName: string,
  document: T
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  if (!auth?.currentUser) throw new Error("Faça login para criar documentos");
  const docRef = clinicDoc(clinicId, collectionName, document.id);
  const { id, ...data } = document;
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now().toDate().toISOString(),
    updatedAt: Timestamp.now().toDate().toISOString(),
  });
}

export async function updateDocument<T extends { id: string }>(
  clinicId: string,
  collectionName: string,
  document: T
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  if (!auth?.currentUser) throw new Error("Faça login para atualizar documentos");
  const docRef = clinicDoc(clinicId, collectionName, document.id);
  const { id, ...data } = document;
  const cleanData = Object.fromEntries(
    Object.entries({ ...data, updatedAt: Timestamp.now().toDate().toISOString() }).filter(
      ([, value]) => value !== undefined
    )
  );
  await updateDoc(docRef, cleanData as any);
}

export async function deleteDocument(
  clinicId: string,
  collectionName: string,
  id: string
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  if (!auth?.currentUser) throw new Error("Faça login para excluir documentos");
  try {
    await deleteDoc(clinicDoc(clinicId, collectionName, id));
  } catch (error) {
    console.error(`Erro ao excluir documento [${collectionName}/${id}]:`, error);
    throw error;
  }
}

export async function getDocument<T>(
  clinicId: string,
  collectionName: string,
  id: string
): Promise<T | null> {
  if (!isFirebaseConfigured || !db || !clinicId) return null;
  const docSnap = await getDoc(clinicDoc(clinicId, collectionName, id));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function queryDocuments<T extends { id: string }>(
  clinicId: string,
  collectionName: string,
  constraints: any[]
): Promise<T[]> {
  if (!isFirebaseConfigured || !db || !clinicId) return [];
  const q = query(clinicCollection<T>(clinicId, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  const items: T[] = [];
  snapshot.forEach((docSnap) => {
    items.push({ id: docSnap.id, ...docSnap.data() } as T);
  });
  return items;
}

// ============================================================
// CLINIC MANAGEMENT
// ============================================================

export async function createClinic(
  clinicData: Omit<Clinic, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase não configurado");
  if (!auth?.currentUser) throw new Error("Faça login para criar clínica");

  const clinicId = `clinic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = Timestamp.now().toDate().toISOString();
  
  const clinic: Clinic = {
    ...clinicData,
    id: clinicId,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, COLLECTIONS.clinics, clinicId), clinic);
  
  const userProfile: UserProfile = {
    uid: auth.currentUser.uid,
    email: auth.currentUser.email || "",
    displayName: auth.currentUser.displayName || "",
    photoURL: auth.currentUser.photoURL || undefined,
    clinicId,
    role: "owner",
    createdAt: now,
    lastLoginAt: now,
  };
  
  await setDoc(doc(db, COLLECTIONS.users, auth.currentUser.uid), userProfile);
  
  return clinicId;
}

export async function getClinic(clinicId: string): Promise<Clinic | null> {
  if (!isFirebaseConfigured || !db) return null;
  const docSnap = await getDoc(doc(db, COLLECTIONS.clinics, clinicId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Clinic;
}

export async function getClinicBySlug(slug: string): Promise<Clinic | null> {
  if (!isFirebaseConfigured || !db) return null;
  const q = query(
    collection(db, COLLECTIONS.clinics),
    where("slug", "==", slug),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Clinic;
}

export async function updateClinic(clinicId: string, data: Partial<Clinic>): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  if (!auth?.currentUser) throw new Error("Faça login para atualizar clínica");
  await updateDoc(doc(db, COLLECTIONS.clinics, clinicId), {
    ...data,
    updatedAt: Timestamp.now().toDate().toISOString(),
  } as any);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !db) return null;
  const docSnap = await getDoc(doc(db, COLLECTIONS.users, uid));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as unknown as UserProfile;
}

export async function getCurrentUserClinic(): Promise<Clinic | null> {
  const clinicId = await getCurrentUserClinicId();
  if (!clinicId) return null;
  return getClinic(clinicId);
}

// ============================================================
// PATIENTS CRUD
// ============================================================

export function listenPatients(
  clinicId: string,
  callback: (patients: Patient[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<Patient>(
    clinicId,
    COLLECTIONS.patients,
    callback,
    onError,
    [orderBy("name")]
  );
}

export const createPatient = (clinicId: string, patient: Patient) =>
  createDocument(clinicId, COLLECTIONS.patients, patient);

export const updatePatient = (clinicId: string, patient: Patient) =>
  updateDocument(clinicId, COLLECTIONS.patients, patient);

export const deletePatient = (clinicId: string, id: string) =>
  deleteDocument(clinicId, COLLECTIONS.patients, id);

// ============================================================
// APPOINTMENTS CRUD
// ============================================================

export function listenAppointments(
  clinicId: string,
  callback: (appointments: Appointment[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<Appointment>(
    clinicId,
    COLLECTIONS.appointments,
    callback,
    onError,
    [orderBy("date"), orderBy("time")]
  );
}

export const createAppointment = (clinicId: string, appointment: Appointment) =>
  createDocument(clinicId, COLLECTIONS.appointments, appointment);

export const updateAppointment = (clinicId: string, appointment: Appointment) =>
  updateDocument(clinicId, COLLECTIONS.appointments, appointment);

export const deleteAppointment = (clinicId: string, id: string) =>
  deleteDocument(clinicId, COLLECTIONS.appointments, id);

// ============================================================
// FINANCES CRUD
// ============================================================

export function listenFinances(
  clinicId: string,
  callback: (finances: FinanceRecord[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<FinanceRecord>(
    clinicId,
    COLLECTIONS.finances,
    callback,
    onError,
    [orderBy("date", "desc")]
  );
}

export const createFinanceRecord = (clinicId: string, record: FinanceRecord) =>
  createDocument(clinicId, COLLECTIONS.finances, record);

export const deleteFinanceRecord = (clinicId: string, id: string) =>
  deleteDocument(clinicId, COLLECTIONS.finances, id);

// ============================================================
// SERVICES CRUD
// ============================================================

export function listenServices(
  clinicId: string,
  callback: (services: ClinicService[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<ClinicService>(
    clinicId,
    COLLECTIONS.services,
    callback,
    onError,
    [orderBy("name")]
  );
}

export const createOrUpdateService = (clinicId: string, service: ClinicService) =>
  createDocument(clinicId, COLLECTIONS.services, service);

export const deleteService = (clinicId: string, id: string) =>
  deleteDocument(clinicId, COLLECTIONS.services, id);

// ============================================================
// SCHEDULE BLOCKS CRUD
// ============================================================

export function listenScheduleBlocks(
  clinicId: string,
  callback: (blocks: ScheduleBlock[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return listenCollection<ScheduleBlock>(
    clinicId,
    COLLECTIONS.scheduleBlocks,
    callback,
    onError,
    [orderBy("date"), orderBy("startTime")]
  );
}

export const createScheduleBlock = (clinicId: string, block: ScheduleBlock) =>
  createDocument(clinicId, COLLECTIONS.scheduleBlocks, block);

export const updateScheduleBlock = (clinicId: string, block: ScheduleBlock) =>
  updateDocument(clinicId, COLLECTIONS.scheduleBlocks, block);

export const deleteScheduleBlock = (clinicId: string, id: string) =>
  deleteDocument(clinicId, COLLECTIONS.scheduleBlocks, id);

// ============================================================
// BLOCKED DAYS (appData/blockedDays)
// ============================================================

interface BlockedDayItem {
  id?: number | string;
  dayOfWeek?: string;
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  description?: string;
  motivo?: string;
}

function expandBlockedDays(items: BlockedDayItem[]): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  const today = new Date();
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - 15);
  const windowEnd = new Date(today);
  windowEnd.setDate(today.getDate() + 90);

  for (const item of items) {
    const reason = item.description || item.motivo || "Bloqueado";
    const startTime = item.startTime || "00:00";
    const endTime = item.endTime || "23:59";

    if (item.type === "Recorrente Semanal" && item.dayOfWeek !== undefined) {
      const dow = parseInt(item.dayOfWeek, 10);
      if (isNaN(dow)) continue;
      for (let i = -15; i <= 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        if (d.getDay() === dow) {
          const dateStr = d.toISOString().split("T")[0];
          blocks.push({
            id: `blocked-${item.id}-${dateStr}`,
            date: dateStr,
            startTime,
            endTime,
            reason,
            createdAt: new Date().toISOString(),
          });
        }
      }
      continue;
    }

    if (item.date && item.endDate) {
      const start = new Date(item.date + "T00:00:00");
      const end = new Date(item.endDate + "T00:00:00");
      const effectiveStart = start > windowStart ? start : windowStart;
      const effectiveEnd = end < windowEnd ? end : windowEnd;
      if (effectiveStart > effectiveEnd) continue;
      for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        blocks.push({
          id: `blocked-${item.id}-${dateStr}`,
          date: dateStr,
          startTime,
          endTime,
          reason,
          createdAt: new Date().toISOString(),
        });
      }
      continue;
    }

    if (item.date) {
      blocks.push({
        id: `blocked-${item.id}-${item.date}`,
        date: item.date,
        startTime,
        endTime,
        reason,
        createdAt: new Date().toISOString(),
      });
      continue;
    }
  }

  return blocks;
}

export function listenBlockedDays(
  clinicId: string,
  callback: (blocks: ScheduleBlock[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db || !clinicId) {
    callback([]);
    return () => {};
  }

  const docRef = doc(db, COLLECTIONS.clinics, clinicId, COLLECTIONS.appData, COLLECTIONS.blockedDays);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback([]);
        return;
      }
      const data = docSnap.data();
      const items: BlockedDayItem[] = data.items || [];
      callback(expandBlockedDays(items));
    },
    (error) => {
      console.error(`Firestore listener error [${clinicId}/appData/blockedDays]:`, error);
      onError?.(error);
    }
  );
}

export async function saveBlockedDays(clinicId: string, items: BlockedDayItem[]): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  if (!auth?.currentUser) throw new Error("Faça login para salvar dias bloqueados");
  
  const docRef = doc(db, COLLECTIONS.clinics, clinicId, COLLECTIONS.appData, COLLECTIONS.blockedDays);
  await setDoc(docRef, {
    items,
    updatedAt: Timestamp.now().toDate().toISOString(),
  });
}

// ============================================================
// PUBLIC SCHEDULE BLOCKS (mirror for portal)
// ============================================================

export async function syncPublicScheduleBlocks(clinicId: string): Promise<{ written: number; deleted: number }> {
  if (!isFirebaseConfigured || !db) throw new Error("Firebase não configurado");
  if (!auth?.currentUser) throw new Error("Faça login para sincronizar");

  const sourceSnap = await getDocs(clinicCollection(clinicId, COLLECTIONS.scheduleBlocks));
  const mirrorSnap = await getDocs(clinicCollection(clinicId, "publicScheduleBlocks"));

  const sourceIds = new Set<string>();
  const batches: Promise<void>[] = [];

  let batch = writeBatch(db);
  let batchCount = 0;
  let written = 0;

  for (const srcDoc of sourceSnap.docs) {
    const data = srcDoc.data();
    const { date, startTime, endTime } = data;
    sourceIds.add(srcDoc.id);

    if (!date || !startTime || !endTime) continue;

    const mirrorRef = clinicDoc(clinicId, "publicScheduleBlocks", srcDoc.id);
    batch.set(mirrorRef, { date, startTime, endTime });
    batchCount++;
    written++;

    if (batchCount >= 500) {
      batches.push(batch.commit());
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  let deleted = 0;
  for (const mirrorDoc of mirrorSnap.docs) {
    if (!sourceIds.has(mirrorDoc.id)) {
      batch.delete(mirrorDoc.ref);
      batchCount++;
      deleted++;

      if (batchCount >= 500) {
        batches.push(batch.commit());
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    batches.push(batch.commit());
  }

  await Promise.all(batches);
  return { written, deleted };
}

export function logSyncError(context: string, error: unknown): void {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[syncPublicScheduleBlocks] ${context}:`, msg);
  if (!isFirebaseConfigured || !db) return;
  const logRef = doc(collection(db, "systemLogs"));
  setDoc(logRef, {
    type: "sync_error",
    context,
    message: msg,
    timestamp: new Date().toISOString(),
    userId: auth?.currentUser?.uid || "unknown",
  }).catch(() => {});
}