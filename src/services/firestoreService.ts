import { getCurrentClinicData } from "./multiTenantAuth";
import {
  listenPatients as mtListenPatients,
  listenAppointments as mtListenAppointments,
  listenFinances as mtListenFinances,
  listenServices as mtListenServices,
  listenScheduleBlocks as mtListenScheduleBlocks,
  listenBlockedDays as mtListenBlockedDays,
  createPatient as mtCreatePatient,
  updatePatient as mtUpdatePatient,
  deletePatient as mtDeletePatient,
  createAppointment as mtCreateAppointment,
  updateAppointment as mtUpdateAppointment,
  deleteAppointment as mtDeleteAppointment,
  createFinanceRecord as mtCreateFinanceRecord,
  deleteFinanceRecord as mtDeleteFinanceRecord,
  createOrUpdateService as mtCreateOrUpdateService,
  deleteService as mtDeleteService,
  createScheduleBlock as mtCreateScheduleBlock,
  updateScheduleBlock as mtUpdateScheduleBlock,
  deleteScheduleBlock as mtDeleteScheduleBlock,
  saveBlockedDays as mtSaveBlockedDays,
  syncPublicScheduleBlocks as mtSyncPublicScheduleBlocks,
  logSyncError as mtLogSyncError,
} from "./multiTenantFirestore";
import type { Patient, Appointment, FinanceRecord, ClinicService, ScheduleBlock } from "../types";

type Unsubscribe = () => void;

let currentClinicId: string | null = null;

export function setClinicId(clinicId: string | null): void {
  currentClinicId = clinicId;
}

export function getClinicId(): string | null {
  return currentClinicId;
}

async function ensureClinicId(): Promise<string> {
  if (currentClinicId) return currentClinicId;
  
  const clinicData = await getCurrentClinicData();
  if (!clinicData?.clinicId) {
    throw new Error("Nenhuma clínica selecionada. Faça login novamente.");
  }
  
  currentClinicId = clinicData.clinicId;
  return currentClinicId;
}

export function listenPatients(
  callback: (patients: Patient[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return (async () => {
    try {
      const clinicId = await ensureClinicId();
      return mtListenPatients(clinicId, callback, onError);
    } catch (e) {
      onError?.(e as Error);
      return () => {};
    }
  })() as any;
}

export function listenAppointments(
  callback: (appointments: Appointment[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return (async () => {
    try {
      const clinicId = await ensureClinicId();
      return mtListenAppointments(clinicId, callback, onError);
    } catch (e) {
      onError?.(e as Error);
      return () => {};
    }
  })() as any;
}

export function listenFinances(
  callback: (finances: FinanceRecord[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return (async () => {
    try {
      const clinicId = await ensureClinicId();
      return mtListenFinances(clinicId, callback, onError);
    } catch (e) {
      onError?.(e as Error);
      return () => {};
    }
  })() as any;
}

export function listenServices(
  callback: (services: ClinicService[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return (async () => {
    try {
      const clinicId = await ensureClinicId();
      return mtListenServices(clinicId, callback, onError);
    } catch (e) {
      onError?.(e as Error);
      return () => {};
    }
  })() as any;
}

export function listenScheduleBlocks(
  callback: (blocks: ScheduleBlock[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return (async () => {
    try {
      const clinicId = await ensureClinicId();
      return mtListenScheduleBlocks(clinicId, callback, onError);
    } catch (e) {
      onError?.(e as Error);
      return () => {};
    }
  })() as any;
}

export function listenBlockedDays(
  callback: (blocks: ScheduleBlock[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return (async () => {
    try {
      const clinicId = await ensureClinicId();
      return mtListenBlockedDays(clinicId, callback, onError);
    } catch (e) {
      onError?.(e as Error);
      return () => {};
    }
  })() as any;
}

export async function createPatient(patient: Patient): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtCreatePatient(clinicId, patient);
}

export async function updatePatient(patient: Patient): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtUpdatePatient(clinicId, patient);
}

export async function deletePatient(id: string): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtDeletePatient(clinicId, id);
}

export async function createAppointment(appointment: Appointment): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtCreateAppointment(clinicId, appointment);
}

export async function updateAppointment(appointment: Appointment): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtUpdateAppointment(clinicId, appointment);
}

export async function deleteAppointment(id: string): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtDeleteAppointment(clinicId, id);
}

export async function createFinanceRecord(record: FinanceRecord): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtCreateFinanceRecord(clinicId, record);
}

export async function deleteFinanceRecord(id: string): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtDeleteFinanceRecord(clinicId, id);
}

export async function createOrUpdateService(service: ClinicService): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtCreateOrUpdateService(clinicId, service);
}

export async function deleteService(id: string): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtDeleteService(clinicId, id);
}

export async function createScheduleBlock(block: ScheduleBlock): Promise<void> {
  const clinicId = await ensureClinicId();
  await mtCreateScheduleBlock(clinicId, block);
  await mtSyncPublicScheduleBlocks(clinicId).catch((e) =>
    mtLogSyncError("createScheduleBlock", e)
  );
}

export async function updateScheduleBlock(block: ScheduleBlock): Promise<void> {
  const clinicId = await ensureClinicId();
  await mtUpdateScheduleBlock(clinicId, block);
  await mtSyncPublicScheduleBlocks(clinicId).catch((e) =>
    mtLogSyncError("updateScheduleBlock", e)
  );
}

export async function deleteScheduleBlock(id: string): Promise<void> {
  const clinicId = await ensureClinicId();
  await mtDeleteScheduleBlock(clinicId, id);
  await mtSyncPublicScheduleBlocks(clinicId).catch((e) =>
    mtLogSyncError("deleteScheduleBlock", e)
  );
}

export async function saveBlockedDays(items: any[]): Promise<void> {
  const clinicId = await ensureClinicId();
  return mtSaveBlockedDays(clinicId, items);
}

export async function syncPublicScheduleBlocks(): Promise<{ written: number; deleted: number }> {
  const clinicId = await ensureClinicId();
  return mtSyncPublicScheduleBlocks(clinicId);
}

export function logSyncError(context: string, error: unknown): void {
  mtLogSyncError(context, error);
}