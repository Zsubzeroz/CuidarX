import React, { useState, useEffect, useRef } from "react";
import { useRealtimeData } from "./hooks/useRealtimeData";
import { useResponsive } from "./hooks/useResponsive";
import {
  isGoogleCalendarConfigured,
  isGoogleCalendarConnected,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  hasPersistedToken,
  extractTokenFromUrl,
  onTokenAcquired,
  onConnectingGoogleChange,
  silentConnectGoogle,
  type GoogleCalendarEvent,
} from "./services/googleCalendar";
import {
  createAppointment as fsCreateAppointment,
  deleteAppointment as fsDeleteAppointment,
} from "./services/firestoreService";
import type { ScheduleBlock } from "./types";
import {
  getConfig as getWhatsAppConfig,
  saveConfig as saveWhatsAppConfig,
  getClinicWhatsAppLink,
  type WhatsAppAutoConfig,
  type WhatsAppProvider,
} from "./services/whatsappAutoService";
import DashboardView from "./components/DashboardView";
import PatientView from "./components/PatientView";
import CalendarView from "./components/CalendarView";
import FinanceView from "./components/FinanceView";
import AiAssistantView from "./components/AiAssistantView";
import BookingPortalView from "./components/BookingPortalView";
import ServicesView from "./components/ServicesView";
import ErrorBoundary from "./components/ErrorBoundary";
// @ts-ignore
import clinicLogo from "./assets/images/clinic_logo_1783686122531.jpg";
import {
  Activity,
  Calendar,
  Users,
  DollarSign,
  Cpu,
  Heart,
  Globe,
  ClipboardList,
  ChevronDown,
  Menu,
  X,
  Phone,
  LayoutDashboard,
  Settings,
  MessageCircle,
  Bell,
  Sun,
  Moon,
} from "lucide-react";

export default function App() {
  // Detect /cliente route — render full-screen public booking portal, no admin chrome
  const isClienteRoute = typeof window !== "undefined" && window.location.pathname === "/cliente";

  const [activeTab, setActiveTab] = useState<string>("agenda");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scheduleFormRequest, setScheduleFormRequest] = useState(0);

  // Dark Mode — class-based, claro por padrão, persistido no localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    } catch {}
  }, [isDarkMode]);

  // Real-time Firestore data
  const {
    patients,
    appointments,
    finances,
    services,
    isLoading,
    syncStatus,
    handleAddPatient,
    handleDeletePatient,
    handleUpdatePatientIssues,
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
    handleDeleteScheduleBlock,
  } = useRealtimeData();

  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Google Calendar state
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googlePermissionError, setGooglePermissionError] = useState(false);

  const googleConfigured = isGoogleCalendarConfigured();

  // WhatsApp Auto state
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppAutoConfig>(getWhatsAppConfig());

  const handleSaveWhatsAppConfig = (config: WhatsAppAutoConfig) => {
    setWhatsAppConfig(config);
    saveWhatsAppConfig(config);
  };

  // Bloquear sábados automaticamente no portal do cliente (padrão: desativado)
  const [blockSaturdays, setBlockSaturdays] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("blockSaturdays");
      return saved === null ? false : saved === "true";
    } catch {
      return false;
    }
  });

  const handleSaveBlockSaturdays = (value: boolean) => {
    setBlockSaturdays(value);
    try {
      localStorage.setItem("blockSaturdays", value ? "true" : "false");
    } catch {}
  };

  // Register connecting callback
  useEffect(() => {
    onConnectingGoogleChange(setIsConnectingGoogle);
  }, []);

  // Register onTokenAcquired for fallback redirect flow
  useEffect(() => {
    onTokenAcquired((token) => {
      console.log("[App] Token acquired (fallback redirect), syncing...");
      setIsGoogleConnected(true);
      const today = new Date().toISOString().split("T")[0];
      handleSyncGoogleEvents(today);
    });
  }, []);

  // Check URL hash for OAuth redirect token (fallback flow)
  useEffect(() => {
    if (isClienteRoute) return;
    const extracted = extractTokenFromUrl();
    if (extracted) {
      console.log("[App] Token from redirect URL, connecting...");
      setIsGoogleConnected(true);
      const today = new Date().toISOString().split("T")[0];
      handleSyncGoogleEvents(today);
    }
  }, []);

  // Log Firestore data for diagnostics
  useEffect(() => {
    console.log(`[App] Firestore data loaded - patients: ${patients.length}, appointments: ${appointments.length}, services: ${services.length}`);
  }, [patients, appointments, services]);

  // Auto-sync on mount: try silent token refresh, then sync
  useEffect(() => {
    if (isClienteRoute) return;
    const init = async () => {
      if (!googleConfigured) return;

      // Try silent token refresh (no consent popup)
      const connected = await silentConnectGoogle();
      if (connected || hasPersistedToken()) {
        const today = new Date().toISOString().split("T")[0];
        handleSyncGoogleEvents(today);
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety reset for connecting state
  useEffect(() => {
    if (!isConnectingGoogle) return;
    const t = setTimeout(() => setIsConnectingGoogle(false), 35000);
    return () => clearTimeout(t);
  }, [isConnectingGoogle]);

  const handleConnectGoogle = async () => {
    try {
      await connectGoogleCalendar();
      setIsGoogleConnected(true);
      const today = new Date().toISOString().split("T")[0];
      setTimeout(() => handleSyncGoogleEvents(today), 300);
    } catch (err: any) {
      if (err.message === "REDIRECT_PENDING") {
        console.log("[App] Redirect fallback in progress — token will be captured on return");
        return;
      }
      console.error("Google Calendar connection failed:", err);
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleGoogleLoginBrowser = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID || "";
    if (!clientId) return;
    const scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
    const redirectUri = "https://podologa-fabricia.web.app";
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&prompt=consent` +
      `&include_granted_scopes=true`;
    window.open(url, "_blank");
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogleCalendar();
    setIsGoogleConnected(false);
    setGoogleEvents([]);
  };

  const handleSyncGoogleEvents = async (date: string) => {
    if (!isGoogleConnected) return;
    setIsSyncingGoogle(true);
    setGooglePermissionError(false);
    try {
      // Try silent refresh if we don't have a token yet
      if (!isGoogleCalendarConnected()) {
        await silentConnectGoogle();
      }

      const d = new Date(date + "T12:00:00-03:00");
      const year = d.getFullYear();
      const month = d.getMonth();
      const start = new Date(year, month, 1, 0, 0, 0).toISOString();
      const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const events = await fetchGoogleCalendarEvents(start, end);
      setGoogleEvents(events);

      // Only sync to Firestore if we got events (avoids clearing stored events when token is missing)
      if (events.length > 0) {
        await syncGoogleEventsToFirestore(events);
        console.log(`[App] Synced ${events.length} Google Calendar events to Firestore`);
      }
    } catch (err: any) {
      if (err.message === "PERMISSION_ERROR") {
        console.warn("[App] Permission denied — wrong account?");
        setGooglePermissionError(true);
        setGoogleEvents([]);
      } else if (err.message === "TOKEN_EXPIRED") {
        console.warn("[App] Token expired — keeping existing events, will retry on next sync");
      } else {
        console.error("Error fetching Google Calendar events:", err);
      }
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleCreateGoogleEvent = async (
    summary: string,
    description: string,
    startTime: string,
    endTime: string
  ): Promise<string | null> => {
    try {
      return await createGoogleCalendarEvent(summary, description, startTime, endTime);
    } catch (err: any) {
      console.error("Error creating Google Calendar event:", err);
      return null;
    }
  };

  const handleDeleteGoogleEvent = async (eventId: string) => {
    try {
      await deleteGoogleCalendarEvent(eventId);
    } catch (err: any) {
      console.error("Error deleting Google Calendar event:", err);
    }
  };

  // Save Google Calendar events to Firestore 'appointments' collection
  // so they appear everywhere (web admin, mobile, etc.)
  const syncGoogleEventsToFirestore = async (events: GoogleCalendarEvent[]) => {
    const currentAppointments = appointmentsRef.current;

    // Build set of existing calendarEventIds to avoid duplicates
    const existingCalendarEventIds = new Set(
      currentAppointments
        .filter((a) => a.calendarEventId)
        .map((a) => a.calendarEventId!)
    );

    // Create Firestore appointments for new Google events
    for (const ge of events) {
      if (existingCalendarEventIds.has(ge.id)) continue;

      const dateStr = ge.start?.slice(0, 10) || "";
      const timeStr = ge.start && ge.start.length > 10 ? ge.start.slice(11, 16) : "00:00";

      if (!dateStr) continue;

      try {
        await fsCreateAppointment({
          id: `gcal-${ge.id}`,
          patientId: "",
          patientName: ge.summary || "(Sem título)",
          date: dateStr,
          time: timeStr,
          service: ge.summary || "(Sem título)",
          price: 0,
          status: "scheduled",
          notes: ge.description || "",
          calendarEventId: ge.id,
          source: "google",
        });
      } catch (err) {
        console.error("Error saving Google event to Firestore:", err);
      }
    }

    // Remove stale Google-sourced appointments (events deleted from Google Calendar)
    const googleEventIds = new Set(events.map((ge) => ge.id));
    for (const appt of currentAppointments) {
      if (
        appt.source === "google" &&
        appt.calendarEventId &&
        !googleEventIds.has(appt.calendarEventId)
      ) {
        try {
          await fsDeleteAppointment(appt.id);
        } catch (err) {
          console.error("Error removing stale Google appointment:", err);
        }
      }
    }
  };

  // Keep a ref to latest appointments for async sync operations
  const appointmentsRef = useRef(appointments);
  appointmentsRef.current = appointments;

  // Auto-sync: create Google Calendar events for appointments from the website (no calendarEventId)
  const initialLoadDone = useRef(false);
  const syncedApptIds = useRef(new Set<string>());

  useEffect(() => {
    if (!isGoogleConnected || appointments.length === 0) return;

    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      appointments.forEach((a) => syncedApptIds.current.add(a.id));
      return;
    }

    appointments.forEach(async (appt) => {
      if (syncedApptIds.current.has(appt.id)) return;
      syncedApptIds.current.add(appt.id);

      if (appt.calendarEventId) return;

      const dtStart = `${appt.date}T${appt.time}:00-03:00`;
      const [h, m] = appt.time.split(":").map(Number);
      const endDate = new Date(new Date(`${appt.date}T${appt.time}:00`).getTime() + (appt.price > 150 ? 60 : 45) * 60000);
      const dtEnd = endDate.toISOString().slice(0, 19) + "-03:00";

      try {
        const eventId = await handleCreateGoogleEvent(
          `${appt.service} - ${appt.patientName}`,
          appt.notes || `Agendamento via Portal Online - ${appt.patientName}`,
          dtStart,
          dtEnd
        );
        if (eventId) {
          await handleUpdateAppointment({ ...appt, calendarEventId: eventId });
        }
      } catch (err) {
        console.error("Auto-sync Google Calendar failed:", err);
      }
    });
  }, [appointments, isGoogleConnected]);

  const navigationItems = [
    { id: "agenda", label: "Minha Agenda", icon: Calendar },
    { id: "portal", label: "Agendamento", icon: Globe },
    { id: "pacientes", label: "Clientes", icon: Users },
    { id: "financeiro", label: "Caixa & Financeiro", icon: DollarSign },
    { id: "servicos", label: "Produtos e Serviços", icon: ClipboardList },
    { id: "configuracoes", label: "Configurações", icon: Settings },
  ];

  // Public client portal — render BookingPortalView full-screen, no admin chrome
  if (isClienteRoute) {
    return <BookingPortalView clientMode blockSaturdays={blockSaturdays} />;
  }

  if (isLoading) {
    return (
      <div id="full-page-loading" className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] relative">
        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none bg-dots-gold">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#0F3B2E]/5 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#C8A45A]/5 blur-3xl" />
        </div>
        <div className="relative flex flex-col items-center">
          <div className="relative mb-6">
            <img
              src={clinicLogo}
              alt="Podologia Fabrícia"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#C8A45A]/40 shadow-xl"
            />
            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#0F3B2E] rounded-full border-2 border-white flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[#C8A45A] animate-spin" />
            </div>
          </div>
          <h1 className="text-lg font-bold text-[#0F3B2E] tracking-tight">FABRÍCIA RODRIGUES</h1>
          <p className="text-[11px] text-[#C8A45A] font-semibold uppercase tracking-widest mt-1">Podologia • Saúde & Bem-Estar</p>
          <div className="flex items-center gap-1.5 mt-6">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#C8A45A]"
                style={{ animation: `gentle-pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-medium">Sincronizando dados...</p>
        </div>
      </div>
    );
  }

  const handleQuickSchedule = () => {
    setActiveTab("agenda");
    setScheduleFormRequest((n) => n + 1);
  };

  // RESPONSIVE AGENDA LAYOUT
  const renderAgenda = () => {
    const calendarPanel = (
      <CalendarView
        patients={patients}
        appointments={appointments}
        services={services}
        scheduleBlocks={scheduleBlocks}
        onAddAppointment={handleAddAppointment}
        onUpdateAppointment={handleUpdateAppointment}
        onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
        onDeleteAppointment={handleDeleteAppointment}
        onAddScheduleBlock={handleAddScheduleBlock}
        onDeleteScheduleBlock={handleDeleteScheduleBlock}
        scheduleFormRequest={scheduleFormRequest}
        googleEvents={googleEvents}
        isGoogleConnected={isGoogleConnected}
        isGoogleConfigured={googleConfigured}
        isSyncingGoogle={isSyncingGoogle}
        isConnectingGoogle={isConnectingGoogle}
        onConnectGoogle={handleConnectGoogle}
        onGoogleLoginBrowser={handleGoogleLoginBrowser}
        onDisconnectGoogle={handleDisconnectGoogle}
        onSyncGoogleEvents={handleSyncGoogleEvents}
        onCreateGoogleEvent={handleCreateGoogleEvent}
                  onDeleteGoogleEvent={handleDeleteGoogleEvent}
                  googlePermissionError={googlePermissionError}
        />
    );

    // Mobile: Calendar only
    if (isMobile) {
      return calendarPanel;
    }

    // Tablet: Calendar only
    if (isTablet) {
      return (
        <div className="w-full">
          {calendarPanel}
        </div>
      );
    }

    // Desktop: Calendar only
    return (
      <div className="w-full">
        {calendarPanel}
      </div>
    );
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1512] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#0F3B2E] border-b border-[#C8A45A]/30 sticky top-0 z-50 shadow-md px-4 md:px-8 py-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          {/* Hamburger menu button - mobile & tablet only */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-[#1B523E] text-white active:scale-95 transition-all cursor-pointer"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5 text-[#C8A45A]" />
          </button>
          <img
            src={clinicLogo}
            alt="Dra. Fabrícia Rodrigues"
            className="w-11 h-11 rounded-2xl object-cover border-2 border-[#C8A45A]/60 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-base md:text-lg font-bold text-white tracking-tight leading-none font-display">FABRÍCIA RODRIGUES</h1>
            <p className="text-[10px] text-[#C8A45A] font-semibold mt-1 uppercase tracking-widest">Podologia • Saúde & Bem-Estar</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle de Tema (Dark / Light) */}
          <button
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="flex items-center gap-2 bg-[#0A2B21] hover:bg-[#1B523E] border border-[#C8A45A]/40 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
            title={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
            aria-label="Alternar tema claro/escuro"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-[#C8A45A]" />
            ) : (
              <Moon className="w-4 h-4 text-[#C8A45A]" />
            )}
            <span className="hidden sm:inline text-[#C8A45A]">{isDarkMode ? "Claro" : "Escuro"}</span>
          </button>

          <a
            href={getClinicWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-[#0A2B21] hover:bg-[#1B523E] border border-[#C8A45A]/40 text-[#C8A45A] px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Falar com o suporte"
          >
            <Phone className="w-3.5 h-3.5 text-[#C8A45A]" />
            <span>Suporte: (19) 99722-2694</span>
          </a>

          <div className="hidden lg:flex items-center gap-2 bg-[#0A2B21] px-3.5 py-1.5 rounded-full text-[#C8A45A] border border-[#C8A45A]/40 shadow-sm shadow-[#C8A45A]/10 text-xs font-bold">
            <span className={`w-2 h-2 rounded-full bg-[#C8A45A] ${syncStatus === "synced" ? "animate-pulse" : ""}`} />
            <span>{syncStatus === "synced" ? "Tempo Real Ativo" : syncStatus === "syncing" ? "Sincronizando..." : "Modo Offline"}</span>
          </div>

          {isGoogleConnected ? (
            <div className="hidden sm:flex items-center gap-2 bg-[#0A2B21] px-3.5 py-1.5 rounded-full text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Google Agenda Conectado</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 bg-[#0A2B21] px-3.5 py-1.5 rounded-full text-slate-300 border border-slate-600/40 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Google Desconectado</span>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/70 dark:border-slate-800 shadow-sm">
        <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 py-3.5">
          {/* Desktop navigation buttons */}
          <div className="hidden lg:flex flex-wrap gap-2 justify-start">
            {navigationItems.map((item) => {
              const ItemIcon = item.icon;
              const isSelected = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-[#0F3B2E] text-white border border-[#C8A45A]/70 shadow-md"
                      : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  }`}
                >
                  <ItemIcon className={`w-4 h-4 transition-colors ${
                    isSelected ? "text-[#C8A45A]" : "text-slate-400 group-hover:text-slate-600"
                  }`} />
                  <span>{item.label}</span>
                  {isSelected && (
                    <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-10 h-1 bg-[#C8A45A] rounded-full shadow-sm shadow-[#C8A45A]/50" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile/Tablet Drawer */}
          {isMobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-[#0F3B2E]/40 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div className="fixed top-0 left-0 bottom-0 z-50 w-[82vw] max-w-[300px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col drawer-enter">
                {/* Drawer Header */}
                <div className="bg-gradient-to-b from-[#0F3B2E] to-[#0A2B21] px-5 pt-5 pb-4 border-b border-[#C8A45A]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={clinicLogo}
                        alt="Dra. Fabrícia Rodrigues"
                        className="w-10 h-10 rounded-xl object-cover border-2 border-[#C8A45A]/50 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-[#C8A45A]">Menu Principal</p>
                        <h3 className="text-sm font-bold text-white leading-tight mt-0.5">FABRÍCIA RODRIGUES</h3>
                        <p className="text-[9px] text-[#C8A45A]/70 font-medium mt-0.5">Podologia • Saúde & Bem-Estar</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white active:scale-95 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Divider dourado */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C8A45A]/50 to-transparent" />

                {/* Navigation items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
                  {navigationItems.map((item) => {
                    const ItemIcon = item.icon;
                    const isSelected = item.id === activeTab;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 text-sm font-semibold transition-all text-left cursor-pointer rounded-xl ${
                          isSelected
                            ? "text-white bg-[#0F3B2E] shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <div className={`p-1 rounded-lg ${
                          isSelected ? "bg-[#C8A45A]/20" : ""
                        }`}>
                          <ItemIcon className={`w-4.5 h-4.5 ${
                            isSelected ? "text-[#C8A45A]" : "text-slate-400"
                          }`} />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {isSelected && (
                          <div className="w-1 h-1 rounded-full bg-[#C8A45A]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom status */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      syncStatus === "synced" ? "bg-emerald-500" : syncStatus === "syncing" ? "bg-amber-500 animate-pulse" : "bg-red-500"
                    }`} />
                    {syncStatus === "synced" ? "Firebase • Sincronizado" : syncStatus === "syncing" ? "Sincronizando..." : "Erro de conexão"}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 w-full mx-auto p-4 md:p-6 pb-12 ${isDesktop ? "max-w-[1600px]" : "max-w-7xl"}`}>
        <ErrorBoundary>
        {activeTab === "dashboard" && (
          <DashboardView
            patients={patients}
            appointments={appointments}
            finances={finances}
            onNavigate={(tab) => setActiveTab(tab)}
            onQuickSchedule={handleQuickSchedule}
          />
        )}

        {activeTab === "configuracoes" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 dark:border-slate-800 rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-50 rounded-xl">
                  <Settings className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Configurações</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Gerencie as preferências da clínica</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Sync Status */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Status da Sincronização</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {syncStatus === "synced"
                        ? "Dados sincronizados em tempo real com o Firestore"
                        : syncStatus === "syncing"
                        ? "Sincronizando dados..."
                        : "Erro ao sincronizar"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                    syncStatus === "synced"
                      ? "bg-emerald-50 text-emerald-700"
                      : syncStatus === "syncing"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                  }`}>
                    {syncStatus === "synced" ? "Ativo" : syncStatus === "syncing" ? "Sincronizando" : "Erro"}
                  </span>
                </div>

                {/* Google Calendar */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Google Agenda</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {isGoogleConnected
                        ? "Conectado — eventos sincronizados automaticamente"
                        : "Desconectado — conecte para sincronizar"}
                    </p>
                  </div>
                  {isGoogleConnected ? (
                    <button
                      onClick={handleDisconnectGoogle}
                      className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-100 transition-all cursor-pointer"
                    >
                      Desconectar
                    </button>
                  ) : googleConfigured ? (
                    <button
                      onClick={handleConnectGoogle}
                      className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-100 transition-all cursor-pointer"
                    >
                      Conectar
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">Não configurado</span>
                  )}
                </div>

                {/* Database info */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-700">Base de Dados</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {patients.length} pacientes · {appointments.length} agendamentos · {finances.length} registros financeiros
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
                    Firestore
                  </span>
                </div>

                {/* Portal do Cliente */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gold" />
                      <p className="text-xs font-bold text-slate-700">Portal do Cliente</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={blockSaturdays}
                        onChange={(e) => handleSaveBlockSaturdays(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                    </label>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1.5">Bloquear sábados automaticamente no agendamento online. Domingos ficam sempre bloqueados.</p>
                </div>

                {/* WhatsApp da Clínica */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4 text-gold" />
                    <p className="text-xs font-bold text-slate-700">WhatsApp da Clínica</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={whatsAppConfig.clinicPhone || "19997270910"}
                      onChange={(e) => handleSaveWhatsAppConfig({ ...whatsAppConfig, clinicPhone: e.target.value })}
                      placeholder="19997270910"
                      className="flex-1 text-xs bg-white border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                    <a
                      href={getClinicWhatsAppLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-100 transition-all flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Testar
                    </a>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1.5">Número usado nos links de suporte e contato do sistema. Inclua apenas o DDD + número (ex: 19997270910).</p>
                </div>

                {/* WhatsApp Auto */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gold" />
                      <p className="text-xs font-bold text-slate-700">Envio Automático de WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsAppConfig.enabled}
                        onChange={(e) => handleSaveWhatsAppConfig({ ...whatsAppConfig, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                    </label>
                  </div>
                  {whatsAppConfig.enabled && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Provedor</label>
                        <select
                          value={whatsAppConfig.provider}
                          onChange={(e) => handleSaveWhatsAppConfig({ ...whatsAppConfig, provider: e.target.value as WhatsAppProvider })}
                          className="w-full text-xs bg-white border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
                        >
                          <option value="">Selecione um provedor</option>
                          <option value="z-api">Z-API</option>
                          <option value="ultramsg">UltraMsg</option>
                          <option value="evolution">Evolution API</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">API Key / Token</label>
                        <input
                          type="password"
                          value={whatsAppConfig.apiKey}
                          onChange={(e) => handleSaveWhatsAppConfig({ ...whatsAppConfig, apiKey: e.target.value })}
                          placeholder="Chave da API do provedor"
                          className="w-full text-xs bg-white border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Instance ID</label>
                        <input
                          type="text"
                          value={whatsAppConfig.instanceId || ""}
                          onChange={(e) => handleSaveWhatsAppConfig({ ...whatsAppConfig, instanceId: e.target.value })}
                          placeholder="ID da instância (Z-API: id, UltraMsg: instance, Evolution: instance)"
                          className="w-full text-xs bg-white border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                      </div>
                      {whatsAppConfig.provider === "evolution" && (
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Evolution API URL</label>
                          <input
                            type="url"
                            value={whatsAppConfig.evolutionUrl || ""}
                            onChange={(e) => handleSaveWhatsAppConfig({ ...whatsAppConfig, evolutionUrl: e.target.value })}
                            placeholder="http://localhost:8080"
                            className="w-full text-xs bg-white border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
                          />
                        </div>
                      )}
                      <p className="text-[9px] text-slate-400">Ligado = o robô envia mensagens automáticas de confirmação/lembrete nas consultas. Desligado = apenas modo manual (1-clique).</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pacientes" && (
          <PatientView
            patients={patients}
            onAddPatient={handleAddPatient}
            onDeletePatient={handleDeletePatient}
            onUpdatePatientIssues={handleUpdatePatientIssues}
          />
        )}

        {activeTab === "agenda" && renderAgenda()}

        {activeTab === "financeiro" && (
          <FinanceView
            finances={finances}
            onAddFinanceRecord={handleAddFinanceRecord}
            onDeleteFinanceRecord={handleDeleteFinanceRecord}
          />
        )}

        {activeTab === "servicos" && (
          <ServicesView
            services={services}
            onAddOrUpdateService={handleAddOrUpdateService}
            onDeleteService={handleDeleteService}
          />
        )}

        {activeTab === "assistente" && <AiAssistantView patients={patients} />}

        {activeTab === "portal" && <BookingPortalView blockSaturdays={blockSaturdays} />}
      </ErrorBoundary></main>

      {/* Mobile Support Footer */}
      <div className="sm:hidden px-4 pb-4">
        <a
          href={getClinicWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#0F3B2E] to-[#0A2B21] border border-[#C8A45A]/30 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg hover:border-[#C8A45A]/60 active:scale-[0.98]"
        >
          <Phone className="w-4 h-4 text-[#C8A45A]" />
          <span>Suporte: (19) 99722-2694</span>
        </a>
      </div>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-6 px-4">
        <div className="divider-gold mb-4" />
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-medium">
          <p>© 2026 <span className="text-[#0F3B2E] font-semibold">Clínica Podologia Fabrícia</span>. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A45A] inline-block" />
            Desenvolvido com IA Google Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
