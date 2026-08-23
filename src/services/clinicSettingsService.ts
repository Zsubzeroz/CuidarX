import { getClinicId } from "./firestoreService";
import { loadClinicConfig, saveClinicConfig } from "./clinicConfigService";

export interface ClinicSettings {
  expedienteStart: string;
  expedienteEnd: string;
}

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  expedienteStart: "07:00",
  expedienteEnd: "20:00",
};

const STORAGE_KEY = "clinic_settings";

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
  try {
    const clinicId = getClinicId();
    if (!clinicId) return null;
    
    const config = await loadClinicConfig(clinicId);
    if (!config) return null;
    
    return {
      expedienteStart: config.settings?.expedienteStart || DEFAULT_CLINIC_SETTINGS.expedienteStart,
      expedienteEnd: config.settings?.expedienteEnd || DEFAULT_CLINIC_SETTINGS.expedienteEnd,
    };
  } catch (err) {
    console.warn("[ClinicSettings] Falha ao ler do Firestore:", err);
    return null;
  }
}

export async function saveSettingsToFirestore(settings: ClinicSettings): Promise<void> {
  try {
    const clinicId = getClinicId();
    if (!clinicId) throw new Error("Nenhuma clínica selecionada");
    
    await saveClinicConfig(clinicId, {
      settings: {
        ...settings,
        allowOnlineBooking: true,
        requireConfirmation: true,
        bookingWindowDays: 30,
        timezone: "America/Sao_Paulo",
      },
    });
  } catch (err) {
    console.warn("[ClinicSettings] Falha ao salvar no Firestore:", err);
  }
}