import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRealtimeData } from "../hooks/useRealtimeData";
import { getClinicId } from "../services/firestoreService";
import { getClinicConfig } from "../config";
import { loadClinicConfig } from "../services/clinicConfigService";
import type { Patient, Appointment, FinanceRecord, ClinicService, ScheduleBlock } from "../types";

interface ClinicContextType {
  clinicId: string | null;
  clinicConfig: ReturnType<typeof getClinicConfig>;
  patients: Patient[];
  appointments: Appointment[];
  finances: FinanceRecord[];
  services: ClinicService[];
  scheduleBlocks: ScheduleBlock[];
  isLoading: boolean;
  syncStatus: "synced" | "syncing" | "error";
  syncError: string | null;
  refreshClinic: () => Promise<void>;
  
  // Patient handlers
  handleAddPatient: (data: Omit<Patient, "id" | "createdAt" | "footIssues" | "evolutions">) => Promise<string>;
  handleUpdatePatient: (patient: Patient) => Promise<void>;
  handleDeletePatient: (id: string) => Promise<void>;
  handleUpdatePatientIssues: (patientId: string, updatedIssues: Patient["footIssues"]) => Promise<void>;
  handleAddPatientEvolution: (patientId: string, newEvo: Omit<import("../types").Evolution, "id">) => Promise<void>;
  // Aliases for backward compatibility
  onAddPatient: (data: Omit<Patient, "id" | "createdAt" | "footIssues" | "evolutions">) => Promise<string>;
  onUpdatePatient: (patient: Patient) => Promise<void>;
  onDeletePatient: (id: string) => Promise<void>;
  
  // Appointment handlers
  handleAddAppointment: (apptData: Omit<Appointment, "id">) => Promise<void>;
  handleUpdateAppointment: (appointment: Appointment) => Promise<void>;
  handleUpdateAppointmentStatus: (id: string, status: Appointment["status"]) => Promise<void>;
  handleDeleteAppointment: (id: string) => Promise<void>;
  // Aliases for backward compatibility
  onAddAppointment: (apptData: Omit<Appointment, "id">) => Promise<void>;
  onUpdateAppointment: (appointment: Appointment) => Promise<void>;
  onUpdateAppointmentStatus: (id: string, status: Appointment["status"]) => Promise<void>;
  onDeleteAppointment: (id: string) => Promise<void>;
  
  // Finance handlers
  handleAddFinanceRecord: (recordData: Omit<FinanceRecord, "id">) => Promise<void>;
  handleDeleteFinanceRecord: (id: string) => Promise<void>;
  // Aliases for backward compatibility
  onAddFinanceRecord: (recordData: Omit<FinanceRecord, "id">) => Promise<void>;
  onDeleteFinanceRecord: (id: string) => Promise<void>;
  
  // Service handlers
  handleAddOrUpdateService: (serviceData: Omit<ClinicService, "id"> & { id?: string }) => Promise<void>;
  handleDeleteService: (id: string) => Promise<void>;
  // Aliases for backward compatibility
  onAddOrUpdateService: (serviceData: Omit<ClinicService, "id"> & { id?: string }) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  
  // Schedule block handlers
  handleAddScheduleBlock: (blockData: Omit<ScheduleBlock, "id" | "createdAt">) => Promise<ScheduleBlock>;
  handleUpdateScheduleBlock: (block: ScheduleBlock) => Promise<void>;
  handleDeleteScheduleBlock: (id: string) => Promise<void>;
  // Aliases for backward compatibility
  onAddScheduleBlock: (blockData: Omit<ScheduleBlock, "id" | "createdAt">) => Promise<ScheduleBlock>;
  onUpdateScheduleBlock: (block: ScheduleBlock) => Promise<void>;
  onDeleteScheduleBlock: (id: string) => Promise<void>;
  
  // Google Calendar state (from App.tsx)
  googleEvents: any[];
  isGoogleConnected: boolean;
  isGoogleConfigured: boolean;
  isSyncingGoogle: boolean;
  onConnectGoogle: () => Promise<void>;
  onDisconnectGoogle: () => Promise<void>;
  onSyncGoogleEvents: () => Promise<void>;
  onCreateGoogleEvent: (summary: string, description: string, start: string, end: string, colorId?: string) => Promise<string | null>;
  onUpdateGoogleEvent: (eventId: string, summary: string, description: string, start: string, end: string) => Promise<boolean>;
  onDeleteGoogleEvent: (eventId: string) => Promise<void>;
  
  // Navigation helpers
  onNavigate: (tab: string) => void;
  onQuickSchedule: () => void;
}

const ClinicContext = createContext<ClinicContextType | null>(null);

export function ClinicProvider({ children }: { children: ReactNode }) {
  const clinicId = getClinicId();
  const config = getClinicConfig();

  const {
    patients,
    appointments,
    finances,
    services,
    scheduleBlocks,
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
    handleAddScheduleBlock,
    handleUpdateScheduleBlock,
    handleDeleteScheduleBlock,
  } = useRealtimeData(!!clinicId);

  const refreshClinic = useCallback(async () => {
    if (clinicId) {
      await loadClinicConfig(clinicId);
    }
  }, [clinicId]);

  // Google Calendar state - will be set by App.tsx via a separate mechanism
  // For now, provide defaults
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  const onConnectGoogle = useCallback(async () => {}, []);
  const onDisconnectGoogle = useCallback(async () => {}, []);
  const onSyncGoogleEvents = useCallback(async () => {}, []);
  const onCreateGoogleEvent = useCallback(async () => null, []);
  const onUpdateGoogleEvent = useCallback(async () => false, []);
  const onDeleteGoogleEvent = useCallback(async () => {}, []);
  const onNavigate = useCallback((tab: string) => {}, []);
  const onQuickSchedule = useCallback(() => {}, []);

  return (
    <ClinicContext.Provider value={{
      clinicId,
      clinicConfig: config,
      patients,
      appointments,
      finances,
      services,
      scheduleBlocks,
      isLoading,
      syncStatus,
      syncError,
      refreshClinic,
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
      handleAddScheduleBlock,
      handleUpdateScheduleBlock,
      handleDeleteScheduleBlock,
      // Aliases for backward compatibility
      onAddPatient: handleAddPatient,
      onUpdatePatient: handleUpdatePatient,
      onDeletePatient: handleDeletePatient,
      onAddAppointment: handleAddAppointment,
      onUpdateAppointment: handleUpdateAppointment,
      onUpdateAppointmentStatus: handleUpdateAppointmentStatus,
      onDeleteAppointment: handleDeleteAppointment,
      onAddFinanceRecord: handleAddFinanceRecord,
      onDeleteFinanceRecord: handleDeleteFinanceRecord,
      onAddOrUpdateService: handleAddOrUpdateService,
      onDeleteService: handleDeleteService,
      onAddScheduleBlock: handleAddScheduleBlock,
      onUpdateScheduleBlock: handleUpdateScheduleBlock,
      onDeleteScheduleBlock: handleDeleteScheduleBlock,
      googleEvents,
      isGoogleConnected,
      isGoogleConfigured,
      isSyncingGoogle,
      onConnectGoogle,
      onDisconnectGoogle,
      onSyncGoogleEvents,
      onCreateGoogleEvent,
      onUpdateGoogleEvent,
      onDeleteGoogleEvent,
      onNavigate,
      onQuickSchedule,
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error("useClinic deve ser usado dentro de ClinicProvider");
  return ctx;
}