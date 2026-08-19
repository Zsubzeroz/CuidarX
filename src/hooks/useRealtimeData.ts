import { useState, useEffect, useCallback, useRef } from "react";
import {
  listenPatients,
  listenAppointments,
  listenFinances,
  listenServices,
  listenScheduleBlocks,
  listenBlockedDays,
  createPatient as fsCreatePatient,
  updatePatient as fsUpdatePatient,
  deletePatient as fsDeletePatient,
  createAppointment as fsCreateAppointment,
  updateAppointment as fsUpdateAppointment,
  deleteAppointment as fsDeleteAppointment,
  createFinanceRecord as fsCreateFinanceRecord,
  deleteFinanceRecord as fsDeleteFinanceRecord,
  createOrUpdateService as fsCreateOrUpdateService,
  deleteService as fsDeleteService,
  createScheduleBlock as fsCreateScheduleBlock,
  updateScheduleBlock as fsUpdateScheduleBlock,
  deleteScheduleBlock as fsDeleteScheduleBlock,
  syncPublicScheduleBlocks,
  logSyncError,
} from "../services/firestoreService";
import type { Patient, Appointment, FinanceRecord, ClinicService, ScheduleBlock } from "../types";
import { auth } from "../services/firebase";
import { onAuthStateChange } from "../services/googleAuth";
import { normalizeReason } from "../utils/normalizeReason";

export function useRealtimeData(enabled = true) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [services, setServices] = useState<ClinicService[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [nativeBlocks, setNativeBlocks] = useState<ScheduleBlock[]>([]);
  const [webAdminBlocks, setWebAdminBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const [syncError, setSyncError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const firebaseUidRef = useRef<string | null>(null);
  const listenersStartedRef = useRef(false);

  // Track Firebase Auth state internally.
  // Use ref to avoid restarting listeners when uid changes.
  useEffect(() => {
    return onAuthStateChange((user) => {
      const uid = user?.uid ?? null;
      console.warn(`[useRealtimeData] onAuthStateChanged: uid=${uid}`);
      firebaseUidRef.current = uid;
      setFirebaseUid(uid);
    });
  }, []);

  // Start/restart listeners when enabled becomes true.
  // Use firebaseUidRef to avoid unnecessary restarts.
  useEffect(() => {
    if (!enabled) {
      console.warn("[useRealtimeData] not enabled, skipping listeners");
      return;
    }

    const hasUser = !!firebaseUidRef.current || !!auth?.currentUser;
    console.warn(`[useRealtimeData] starting listeners (enabled=${enabled}, hasUser=${hasUser})`);

    cleanupRef.current?.();
    startListeners(hasUser);

    return () => { cleanupRef.current?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  function startListeners(hasUser: boolean) {
    console.warn(`[useRealtimeData] Auth ready (hasUser=${hasUser}), starting Firestore listeners...`);
    // Only show loading on initial start, not on auth reconnect
    if (!listenersStartedRef.current) {
      setIsLoading(true);
    }
    listenersStartedRef.current = true;
    setSyncStatus("synced");
    setSyncError(null);

    let loadedCount = 0;
    const totalCollections = 6;

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalCollections) {
        setIsLoading(false);
      }
    };

    // Safety timeout: force-load after 8s even if some listeners haven't responded
    const safetyTimer = setTimeout(() => {
      if (loadedCount < totalCollections) {
        console.warn(`[useRealtimeData] Safety timeout: only ${loadedCount}/${totalCollections} collections loaded, forcing UI ready`);
        setIsLoading(false);
      }
    }, 8000);

    const unsubPatients = listenPatients(
      (data) => { console.warn(`[useRealtimeData] patients OK: ${data.length}`); setPatients(data); setSyncStatus("synced"); setSyncError(null); checkLoaded(); },
      (err) => { console.error("[useRealtimeData] patients FAIL:", err); setSyncStatus("error"); setSyncError(`Pacientes: ${err.message || err}`); checkLoaded(); }
    );

    const unsubAppointments = listenAppointments(
      (data) => { console.warn(`[useRealtimeData] appointments OK: ${data.length}`); setAppointments(data); setSyncStatus("synced"); setSyncError(null); checkLoaded(); },
      (err) => { console.error("[useRealtimeData] appointments FAIL:", err); setSyncStatus("error"); setSyncError(`Agendamentos: ${err.message || err}`); checkLoaded(); }
    );

    const unsubFinances = listenFinances(
      (data) => { console.warn(`[useRealtimeData] finances OK: ${data.length}`); setFinances(data); setSyncStatus("synced"); setSyncError(null); checkLoaded(); },
      (err) => { console.error("[useRealtimeData] finances FAIL:", err); setSyncStatus("error"); setSyncError(`Financeiro: ${err.message || String(err)}`); checkLoaded(); }
    );

    const unsubServices = listenServices(
      (data) => { console.warn(`[useRealtimeData] services OK: ${data.length}`); setServices(data); setSyncStatus("synced"); setSyncError(null); checkLoaded(); },
      (err) => { console.error("[useRealtimeData] services FAIL:", err); setSyncStatus("error"); setSyncError(`Serviços: ${err.message || String(err)}`); checkLoaded(); }
    );

    const unsubScheduleBlocks = listenScheduleBlocks(
      (data) => { console.warn(`[useRealtimeData] blocks OK: ${data.length}`); setNativeBlocks(data); setSyncStatus("synced"); setSyncError(null); checkLoaded(); },
      (err) => { console.error("[useRealtimeData] blocks FAIL:", err); setSyncStatus("error"); setSyncError(`Bloqueios: ${err.message || String(err)}`); checkLoaded(); }
    );

    const unsubBlockedDays = listenBlockedDays(
      (data) => { console.warn(`[useRealtimeData] blockedDays OK: ${data.length}`); setWebAdminBlocks(data); setSyncStatus("synced"); setSyncError(null); checkLoaded(); },
      (err) => { console.error("[useRealtimeData] blockedDays FAIL:", err); setSyncStatus("error"); setSyncError(`Dias bloqueados: ${err.message || String(err)}`); checkLoaded(); }
    );

    // Store cleanup refs
    cleanupRef.current = () => {
      clearTimeout(safetyTimer);
      unsubPatients();
      unsubAppointments();
      unsubFinances();
      unsubServices();
      unsubScheduleBlocks();
      unsubBlockedDays();
    };
  }

  // Merge native scheduleBlocks + web admin blockedDays into unified scheduleBlocks
  useEffect(() => {
    const merged = new Map<string, ScheduleBlock>();
    const seenSemantic = new Set<string>();
    for (const b of [...nativeBlocks, ...webAdminBlocks]) {
      const reason = normalizeReason(b.reason);
      const isRecurring = !!(b.recurrence && b.recurrence.frequency !== "none");
      // Recurring blocks: dedup by startTime-reason (date is just creation date)
      // Non-recurring blocks: dedup by date-startTime-reason
      const key = isRecurring
        ? `${b.startTime}-${reason}`
        : `${b.date}-${b.startTime}-${reason}`;
      if (seenSemantic.has(key)) continue;
      seenSemantic.add(key);
      if (merged.has(b.id)) continue;
      merged.set(b.id, b);
    }
    setScheduleBlocks(Array.from(merged.values()));
  }, [nativeBlocks, webAdminBlocks]);

  // Auto-sync publicScheduleBlocks once on admin login
  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (hasSyncedRef.current) return;
    if (!firebaseUid) return;
    if (nativeBlocks.length === 0) return;
    hasSyncedRef.current = true;
    console.warn("[useRealtimeData] Auto-syncing publicScheduleBlocks on admin login...");
    syncPublicScheduleBlocks()
      .then((r) => console.warn(`[useRealtimeData] Auto-sync OK: ${r.written} written, ${r.deleted} deleted`))
      .catch((e) => logSyncError("autoSyncOnLogin", e));
  }, [firebaseUid, nativeBlocks.length]);

  // ---- PATIENT HANDLERS ----
  const handleAddPatient = useCallback(async (newPatientData: Omit<Patient, "id" | "createdAt" | "footIssues" | "evolutions">): Promise<string> => {
    setSyncStatus("syncing");
    setSyncError(null);
    const patient: Patient = {
      ...newPatientData,
      id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      footIssues: [],
      evolutions: [],
      createdAt: new Date().toISOString(),
    };
    try {
      await fsCreatePatient(patient);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Criar paciente: ${e?.message || String(e)}`);
    }
    return patient.id;
  }, []);

  const handleUpdatePatient = useCallback(async (updatedPatient: Patient) => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsUpdatePatient(updatedPatient);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Atualizar paciente: ${e?.message || String(e)}`);
      throw e;
    }
  }, []);

  const handleDeletePatient = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsDeletePatient(id);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Excluir paciente: ${e?.message || String(e)}`);
      throw e;
    }
  }, []);

  const handleUpdatePatientIssues = useCallback(async (patientId: string, updatedIssues: Patient["footIssues"]) => {
    const patientObj = patients.find((p) => p.id === patientId);
    if (!patientObj) return;
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsUpdatePatient({ ...patientObj, footIssues: updatedIssues });
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Atualizar queixas do paciente: ${e?.message || String(e)}`);
    }
  }, [patients]);

  const handleAddPatientEvolution = useCallback(async (patientId: string, newEvo: Omit<import("../types").Evolution, "id">) => {
    const patientObj = patients.find((p) => p.id === patientId);
    if (!patientObj) return;
    setSyncStatus("syncing");
    setSyncError(null);
    const fullEvo = { ...newEvo, id: `evo-${Date.now()}` };
    try {
      await fsUpdatePatient({ ...patientObj, evolutions: [...patientObj.evolutions, fullEvo] });
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Adicionar evolução: ${e?.message || String(e)}`);
    }
  }, [patients]);

  // ---- APPOINTMENT HANDLERS ----
  const handleAddAppointment = useCallback(async (apptData: Omit<Appointment, "id">) => {
    setSyncStatus("syncing");
    setSyncError(null);
    const appointment: Appointment = {
      ...apptData,
      id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    try {
      await fsCreateAppointment(appointment);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Criar agendamento: ${e?.message || String(e)}`);
    }
  }, []);

  const handleUpdateAppointment = useCallback(async (appointment: Appointment) => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsUpdateAppointment(appointment);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Atualizar agendamento: ${e?.message || String(e)}`);
    }
  }, []);

  const handleUpdateAppointmentStatus = useCallback(async (id: string, status: Appointment["status"]) => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsUpdateAppointment({ ...appt, status });
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Atualizar status: ${e?.message || String(e)}`);
    }
  }, [appointments]);

  const handleDeleteAppointment = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsDeleteAppointment(id);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Excluir agendamento: ${e?.message || String(e)}`);
      throw e;
    }
  }, []);

  // ---- FINANCE HANDLERS ----
  const handleAddFinanceRecord = useCallback(async (recordData: Omit<FinanceRecord, "id">) => {
    setSyncStatus("syncing");
    setSyncError(null);
    const record: FinanceRecord = {
      ...recordData,
      id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    try {
      await fsCreateFinanceRecord(record);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Criar registro financeiro: ${e?.message || String(e)}`);
    }
  }, []);

  const handleDeleteFinanceRecord = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsDeleteFinanceRecord(id);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Excluir registro financeiro: ${e?.message || String(e)}`);
      throw e;
    }
  }, []);

  // ---- SERVICES HANDLERS ----
  const handleAddOrUpdateService = useCallback(async (serviceData: Omit<ClinicService, "id"> & { id?: string }) => {
    setSyncStatus("syncing");
    setSyncError(null);
    const service: ClinicService = {
      ...serviceData,
      id: serviceData.id || `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    try {
      await fsCreateOrUpdateService(service);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Salvar serviço: ${e?.message || String(e)}`);
    }
  }, []);

  const handleDeleteService = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsDeleteService(id);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Excluir serviço: ${e?.message || String(e)}`);
      throw e;
    }
  }, []);

  // ---- SCHEDULE BLOCK HANDLERS ----
  const handleAddScheduleBlock = useCallback(async (blockData: Omit<ScheduleBlock, "id" | "createdAt">): Promise<ScheduleBlock> => {
    setSyncStatus("syncing");
    setSyncError(null);
    const block: ScheduleBlock = {
      ...blockData,
      id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    try {
      await fsCreateScheduleBlock(block);
      setSyncStatus("synced");
      setSyncError(null);
      syncPublicScheduleBlocks().catch((e) =>
        logSyncError("handleAddScheduleBlock", e)
      );
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Criar bloqueio: ${e?.message || String(e)}`);
    }
    return block;
  }, []);

  const handleUpdateScheduleBlock = useCallback(async (block: ScheduleBlock) => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsUpdateScheduleBlock(block);
      setSyncStatus("synced");
      setSyncError(null);
      syncPublicScheduleBlocks().catch((e) =>
        logSyncError("handleUpdateScheduleBlock", e)
      );
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Atualizar bloqueio: ${e?.message || String(e)}`);
    }
  }, []);

  const handleDeleteScheduleBlock = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      await fsDeleteScheduleBlock(id);
      setSyncStatus("synced");
      setSyncError(null);
      syncPublicScheduleBlocks().catch((e) =>
        logSyncError("handleDeleteScheduleBlock", e)
      );
    } catch (e: any) {
      console.error(e);
      setSyncStatus("error");
      setSyncError(`Excluir bloqueio: ${e?.message || String(e)}`);
      throw e;
    }
  }, []);

  return {
    patients,
    appointments,
    finances,
    services,
    isLoading,
    syncStatus,
    syncError,
    handleAddPatient,
    handleUpdatePatient,
    handleDeletePatient,
    handleUpdatePatientIssues,
    handleAddPatientEvolution,
    handleAddAppointment,
    handleUpdateAppointment,
    handleUpdateAppointmentStatus,
    handleDeleteAppointment,
    handleAddFinanceRecord,
    handleDeleteFinanceRecord,
    handleAddOrUpdateService,
    handleDeleteService,
    scheduleBlocks,
    handleAddScheduleBlock,
    handleUpdateScheduleBlock,
    handleDeleteScheduleBlock,
  };
}
