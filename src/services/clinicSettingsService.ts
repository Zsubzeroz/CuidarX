import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

export interface ClinicSettings {
  expedienteStart: string;
  expedienteEnd: string;
}

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  expedienteStart: "07:00",
  expedienteEnd: "20:00",
};

const STORAGE_KEY = "clinic_settings";
const FIRESTORE_COLLECTION = "clinicSettings";
const FIRESTORE_DOC_ID = "geral";

export function getLocalSettings(): ClinicSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        expedienteStart: parsed.expedienteStart || DEFAULT_CLINIC_SETTINGS.expedienteStart,
        expedienteEnd: parsed.expedienteEnd || DEFAULT_CLINIC_SETTINGS.expedienteEnd,
      };
    }
  } catch {}
  return { ...DEFAULT_CLINIC_SETTINGS };
}

export function saveLocalSettings(settings: ClinicSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export async function loadSettingsFromFirestore(): Promise<ClinicSettings | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<ClinicSettings>;
      return {
        expedienteStart: data.expedienteStart || DEFAULT_CLINIC_SETTINGS.expedienteStart,
        expedienteEnd: data.expedienteEnd || DEFAULT_CLINIC_SETTINGS.expedienteEnd,
      };
    }
  } catch (err) {
    console.warn("[ClinicSettings] Falha ao ler do Firestore:", err);
  }
  return null;
}

export async function saveSettingsToFirestore(settings: ClinicSettings): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    await setDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID), {
      ...settings,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[ClinicSettings] Falha ao salvar no Firestore:", err);
  }
}
