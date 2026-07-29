import { useState, useEffect, useCallback } from "react";
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
  createOrUpdateService as fsCreateOrUpdateService,
  deleteService as fsDeleteService,
  createScheduleBlock as fsCreateScheduleBlock,
  deleteScheduleBlock as fsDeleteScheduleBlock,
} from "../services/firestoreService";
import type { Patient, Appointment, FinanceRecord, ClinicService, ScheduleBlock } from "../types";

export function useRealtimeData() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [services, setServices] = useState<ClinicService[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [nativeBlocks, setNativeBlocks] = useState<ScheduleBlock[]>([]);
  const [webAdminBlocks, setWebAdminBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");

  // Start real-time listeners on mount
  useEffect(() => {
    let loadedCount = 0;
    const totalCollections = 6;

    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalCollections) {
        setIsLoading(false);
      }
    };

    // Safety timeout: force-load after 2s even if some listeners haven't responded
    const safetyTimer = setTimeout(() => {
      if (loadedCount < totalCollections) {
        console.warn(`[useRealtimeData] Safety timeout: only ${loadedCount}/${totalCollections} collections loaded, forcing UI ready`);
        setIsLoading(false);
      }
    }, 2000);

    const unsubPatients = listenPatients(
      (data) => { console.log(`[useRealtimeData] patients update: ${data.length} records`); setPatients(data); setSyncStatus("synced"); checkLoaded(); },
      (err) => { console.error("[useRealtimeData] patients listener error:", err); setSyncStatus("error"); checkLoaded(); }
    );

    const unsubAppointments = listenAppointments(
      (data) => { console.log(`[useRealtimeData] appointments update: ${data.length} records`); setAppointments(data); setSyncStatus("synced"); checkLoaded(); },
      (err) => { console.error("[useRealtimeData] appointments listener error:", err); setSyncStatus("error"); checkLoaded(); }
    );

    const unsubFinances = listenFinances(
      (data) => { setFinances(data); setSyncStatus("synced"); checkLoaded(); },
      () => { setSyncStatus("error"); checkLoaded(); }
    );

    const unsubServices = listenServices(
      (data) => { setServices(data); setSyncStatus("synced"); checkLoaded(); },
      () => { setSyncStatus("error"); checkLoaded(); }
    );

    const unsubScheduleBlocks = listenScheduleBlocks(
      (data) => { setNativeBlocks(data); setSyncStatus("synced"); checkLoaded(); },
      () => { setSyncStatus("error"); checkLoaded(); }
    );

    const unsubBlockedDays = listenBlockedDays(
      (data) => { setWebAdminBlocks(data); setSyncStatus("synced"); checkLoaded(); },
      () => { setSyncStatus("error"); checkLoaded(); }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubPatients();
      unsubAppointments();
      unsubFinances();
      unsubServices();
      unsubScheduleBlocks();
      unsubBlockedDays();
    };
  }, []);

  // Merge native scheduleBlocks + web admin blockedDays into unified scheduleBlocks
  useEffect(() => {
    const merged = new Map<string, ScheduleBlock>();
    for (const b of nativeBlocks) merged.set(b.id, b);
    for (const b of webAdminBlocks) merged.set(b.id, b);
    setScheduleBlocks(Array.from(merged.values()));
  }, [nativeBlocks, webAdminBlocks]);

  // ---- PATIENT HANDLERS ----
  const handleAddPatient = useCallback(async (newPatientData: Omit<Patient, "id" | "createdAt" | "footIssues" | "evolutions">) => {
    setSyncStatus("syncing");
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
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  const handleUpdatePatient = useCallback(async (updatedPatient: Patient) => {
    setSyncStatus("syncing");
    try {
      await fsUpdatePatient(updatedPatient);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
      throw e;
    }
  }, []);

  const handleDeletePatient = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    try {
      await fsDeletePatient(id);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  const handleUpdatePatientIssues = useCallback(async (patientId: string, updatedIssues: Patient["footIssues"]) => {
    const patientObj = patients.find((p) => p.id === patientId);
    if (!patientObj) return;
    setSyncStatus("syncing");
    try {
      await fsUpdatePatient({ ...patientObj, footIssues: updatedIssues });
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, [patients]);

  const handleAddPatientEvolution = useCallback(async (patientId: string, newEvo: Omit<import("../types").Evolution, "id">) => {
    const patientObj = patients.find((p) => p.id === patientId);
    if (!patientObj) return;
    setSyncStatus("syncing");
    const fullEvo = { ...newEvo, id: `evo-${Date.now()}` };
    try {
      await fsUpdatePatient({ ...patientObj, evolutions: [...patientObj.evolutions, fullEvo] });
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, [patients]);

  // ---- APPOINTMENT HANDLERS ----
  const handleAddAppointment = useCallback(async (apptData: Omit<Appointment, "id">) => {
    setSyncStatus("syncing");
    const appointment: Appointment = {
      ...apptData,
      id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    try {
      await fsCreateAppointment(appointment);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  const handleUpdateAppointment = useCallback(async (appointment: Appointment) => {
    setSyncStatus("syncing");
    try {
      await fsUpdateAppointment(appointment);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  const handleUpdateAppointmentStatus = useCallback(async (id: string, status: Appointment["status"]) => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    setSyncStatus("syncing");
    try {
      await fsUpdateAppointment({ ...appt, status });
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, [appointments]);

  const handleDeleteAppointment = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    try {
      await fsDeleteAppointment(id);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  // ---- FINANCE HANDLERS ----
  const handleAddFinanceRecord = useCallback(async (recordData: Omit<FinanceRecord, "id">) => {
    setSyncStatus("syncing");
    const record: FinanceRecord = {
      ...recordData,
      id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    try {
      await fsCreateFinanceRecord(record);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  // ---- SERVICES HANDLERS ----
  const handleAddOrUpdateService = useCallback(async (serviceData: Omit<ClinicService, "id"> & { id?: string }) => {
    setSyncStatus("syncing");
    const service: ClinicService = {
      ...serviceData,
      id: serviceData.id || `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    try {
      await fsCreateOrUpdateService(service);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  const handleDeleteService = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    try {
      await fsDeleteService(id);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  // ---- SCHEDULE BLOCK HANDLERS ----
  const handleAddScheduleBlock = useCallback(async (blockData: Omit<ScheduleBlock, "id" | "createdAt">) => {
    setSyncStatus("syncing");
    const block: ScheduleBlock = {
      ...blockData,
      id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    try {
      await fsCreateScheduleBlock(block);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  const handleDeleteScheduleBlock = useCallback(async (id: string) => {
    setSyncStatus("syncing");
    try {
      await fsDeleteScheduleBlock(id);
      setSyncStatus("synced");
    } catch (e) {
      console.error(e);
      setSyncStatus("error");
    }
  }, []);

  return {
    patients,
    appointments,
    finances,
    services,
    isLoading,
    syncStatus,
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
    handleAddOrUpdateService,
    handleDeleteService,
    scheduleBlocks,
    handleAddScheduleBlock,
    handleDeleteScheduleBlock,
  };
}
