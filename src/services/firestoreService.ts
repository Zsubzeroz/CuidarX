import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type { Patient, Appointment, FinanceRecord, ClinicService, ScheduleBlock } from "../types";

type Unsubscribe = () => void;

// ============================================================
// GENERIC REAL-TIME LISTENER
// ============================================================

function listenCollection<T extends { id: string }>(
  collectionName: string,
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    console.warn(`Firestore not configured. Skipping listener for ${collectionName}.`);
    callback([]);
    return () => {};
  }

  const q = query(collection(db, collectionName));
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
      console.error(`Firestore listener error [${collectionName}]:`, error);
      onError?.(error);
    }
  );
}

// ============================================================
// PATIENTS CRUD
// ============================================================

export function listenPatients(callback: (patients: Patient[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return listenCollection<Patient>("patients", callback, onError);
}

export async function createPatient(patient: Patient): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, "patients", patient.id);
  const { id, ...data } = patient;
  await setDoc(docRef, data);
}

export async function updatePatient(patient: Patient): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, "patients", patient.id);
  const { id, ...data } = patient;
  // Firestore's updateDoc throws on undefined values, which occur when
  // optional fields (cpf, email, address, responsable*) are missing.
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
  await updateDoc(docRef, cleanData as any);
}

export async function deletePatient(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  try {
    await deleteDoc(doc(db, "patients", id));
  } catch (error) {
    console.error("Erro ao excluir paciente:", error);
    throw error;
  }
}

// ============================================================
// APPOINTMENTS CRUD
// ============================================================

export function listenAppointments(callback: (appointments: Appointment[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return listenCollection<Appointment>("appointments", callback, onError);
}

export async function createAppointment(appointment: Appointment): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, "appointments", appointment.id);
  const { id, ...data } = appointment;
  await setDoc(docRef, data);
}

export async function updateAppointment(appointment: Appointment): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, "appointments", appointment.id);
  const { id, ...data } = appointment;
  await updateDoc(docRef, data as any);
}

export async function deleteAppointment(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, "appointments", id));
}

// ============================================================
// FINANCES CRUD
// ============================================================

export function listenFinances(callback: (finances: FinanceRecord[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return listenCollection<FinanceRecord>("finances", callback, onError);
}

export async function createFinanceRecord(record: FinanceRecord): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, "finances", record.id);
  const { id, ...data } = record;
  await setDoc(docRef, data);
}

export async function deleteFinanceRecord(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firestore não configurado");
  }
  try {
    await deleteDoc(doc(db, "finances", id));
  } catch (error) {
    console.error("Erro ao excluir lançamento financeiro:", error);
    throw error;
  }
}

// ============================================================
// SERVICES CRUD
// ============================================================

export function listenServices(callback: (services: ClinicService[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return listenCollection<ClinicService>("services", callback, onError);
}

export async function createOrUpdateService(service: ClinicService): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, "services", service.id);
  const { id, ...data } = service;
  await setDoc(docRef, data);
}

export async function deleteService(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, "services", id));
}

// ============================================================
// SCHEDULE BLOCKS CRUD (native collection)
// ============================================================

export function listenScheduleBlocks(callback: (blocks: ScheduleBlock[]) => void, onError?: (e: Error) => void): Unsubscribe {
  return listenCollection<ScheduleBlock>("scheduleBlocks", callback, onError);
}

export async function createScheduleBlock(block: ScheduleBlock): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, "scheduleBlocks", block.id);
  const { id, ...data } = block;
  await setDoc(docRef, data);
}

export async function updateScheduleBlock(block: ScheduleBlock): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, "scheduleBlocks", block.id);
  const { id, ...data } = block;
  await updateDoc(docRef, data as any);
}

export async function deleteScheduleBlock(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, "scheduleBlocks", id));
}

// ============================================================
// BLOCKED DAYS (Web Admin: appData/blockedDays)
// The web admin stores blocks in a single Firestore document
// at "appData/blockedDays" with { items: [...] } structure.
// ============================================================

interface BlockedDayItem {
  id?: number | string;
  dayOfWeek?: string;   // "0"-"6" (Sun-Sat) for recurring weekly
  date?: string;        // "YYYY-MM-DD" start date
  endDate?: string;     // "YYYY-MM-DD" end date
  startTime?: string;   // "HH:MM" (if absent = full day block)
  endTime?: string;     // "HH:MM"
  type?: string;        // "Recorrente Semanal"
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

    // Recurring weekly block
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

    // Date range block (date + endDate)
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

    // Single date block
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

export function listenBlockedDays(callback: (blocks: ScheduleBlock[]) => void, onError?: (e: Error) => void): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  const docRef = doc(db, "appData", "blockedDays");
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
      console.error("Firestore listener error [appData/blockedDays]:", error);
      onError?.(error);
    }
  );
}
