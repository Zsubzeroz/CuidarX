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
  type GoogleCalendarEvent,
} from "./services/googleCalendar";
import DashboardView from "./components/DashboardView";
import PatientView from "./components/PatientView";
import CalendarView from "./components/CalendarView";
import FinanceView from "./components/FinanceView";
import AiAssistantView from "./components/AiAssistantView";
import BookingPortalView from "./components/BookingPortalView";
import ServicesView from "./components/ServicesView";
import AnamneseView from "./components/AnamneseView";
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
  FileText,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedAnamnesePatientId, setSelectedAnamnesePatientId] = useState<string | null>(null);

  // Real-time Firestore data
  const {
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
  } = useRealtimeData();

  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Google Calendar state
  const [isGoogleConnected, setIsGoogleConnected] = useState(isGoogleCalendarConnected());
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);

  const googleConfigured = isGoogleCalendarConfigured();

  const handleConnectGoogle = async () => {
    try {
      await connectGoogleCalendar();
      setIsGoogleConnected(true);
    } catch (err) {
      console.error("Google Calendar connection failed:", err);
    }
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogleCalendar();
    setIsGoogleConnected(false);
    setGoogleEvents([]);
  };

  const handleSyncGoogleEvents = async (date: string) => {
    if (!isGoogleConnected) return;
    try {
      const start = new Date(date + "T00:00:00-03:00").toISOString();
      const end = new Date(date + "T23:59:59-03:00").toISOString();
      const events = await fetchGoogleCalendarEvents(start, end);
      setGoogleEvents(events);
    } catch (err: any) {
      if (err.message === "TOKEN_EXPIRED") {
        setIsGoogleConnected(false);
        setGoogleEvents([]);
      }
      console.error("Error fetching Google Calendar events:", err);
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
      if (err.message === "TOKEN_EXPIRED") {
        setIsGoogleConnected(false);
      }
      console.error("Error creating Google Calendar event:", err);
      return null;
    }
  };

  const handleDeleteGoogleEvent = async (eventId: string) => {
    try {
      await deleteGoogleCalendarEvent(eventId);
    } catch (err: any) {
      if (err.message === "TOKEN_EXPIRED") {
        setIsGoogleConnected(false);
      }
      console.error("Error deleting Google Calendar event:", err);
    }
  };

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
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "agenda", label: "Minha Agenda", icon: Calendar },
    { id: "financeiro", label: "Caixa", icon: DollarSign },
    { id: "pacientes", label: "Clientes", icon: Users },
    { id: "anamnese", label: "Anamnese / Fichas", icon: FileText },
    { id: "servicos", label: "Produtos e Serviços", icon: ClipboardList },
    { id: "assistente", label: "Assistente Clínico IA", icon: Cpu },
    { id: "portal", label: "Agendamento Online", icon: Globe },
  ];

  const activeItem = navigationItems.find(item => item.id === activeTab) || navigationItems[0];
  const ActiveIcon = activeItem.icon;

  if (isLoading) {
    return (
      <div id="full-page-loading" className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500">
        <Activity className="w-10 h-10 text-teal-600 animate-spin" />
        <h3 className="text-sm font-semibold mt-4 text-slate-700">Carregando Podologia Fabrícia...</h3>
        <p className="text-xs text-slate-400 mt-1">Sincronizando dados com o servidor...</p>
      </div>
    );
  }

  // RESPONSIVE AGENDA LAYOUT
  const renderAgenda = () => {
    const calendarPanel = (
      <CalendarView
        patients={patients}
        appointments={appointments}
        services={services}
        onAddAppointment={handleAddAppointment}
        onUpdateAppointment={handleUpdateAppointment}
        onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
        onDeleteAppointment={handleDeleteAppointment}
        googleEvents={googleEvents}
        isGoogleConnected={isGoogleConnected}
        isGoogleConfigured={googleConfigured}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        onSyncGoogleEvents={handleSyncGoogleEvents}
        onCreateGoogleEvent={handleCreateGoogleEvent}
        onDeleteGoogleEvent={handleDeleteGoogleEvent}
        scheduleBlocks={scheduleBlocks}
        onAddScheduleBlock={handleAddScheduleBlock}
        onDeleteScheduleBlock={handleDeleteScheduleBlock}
        onSelectPatientForAnamnese={(patientId) => {
          setSelectedAnamnesePatientId(patientId);
          setActiveTab("anamnese");
        }}
      />
    );

    // Mobile: Calendar only
    if (isMobile) {
      return calendarPanel;
    }

    // Tablet: Calendar + Anamnese viewer (compact)
    if (isTablet) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
          <div className="lg:col-span-3">{calendarPanel}</div>
          <div className="lg:col-span-2">
            <AnamneseView
              patients={patients}
              onUpdatePatient={handleUpdatePatient}
              onNavigate={setActiveTab}
              embeddedPatientId={selectedAnamnesePatientId || undefined}
              compact
            />
          </div>
        </div>
      );
    }

    // Desktop: Calendar + Anamnese editor
    return (
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <div className="xl:col-span-3">{calendarPanel}</div>
        <div className="xl:col-span-2">
          <AnamneseView
            patients={patients}
            onUpdatePatient={handleUpdatePatient}
            onNavigate={setActiveTab}
            embeddedPatientId={selectedAnamnesePatientId || undefined}
          />
        </div>
      </div>
    );
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src={clinicLogo}
            alt="Dra. Fabrícia Rodrigues"
            className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">FABRÍCIA RODRIGUES</h1>
            <p className="text-[10px] text-teal-600 font-semibold mt-1 uppercase tracking-wider">Podologia • Saúde & Bem-Estar</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/5519997222694"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100/80 border border-teal-100 text-teal-700 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Falar com o suporte"
          >
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            <span>Suporte: (19) 99722-2694</span>
          </a>

          <div className="hidden lg:flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full text-emerald-700 border border-emerald-100 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{syncStatus === "synced" ? "Tempo Real Ativo" : syncStatus === "syncing" ? "Sincronizando..." : "Modo Offline"}</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-slate-100 shadow-xs">
        <div className="max-w-[1600px] w-full mx-auto px-4 md:px-6 py-3.5">
          <div className="hidden md:flex flex-wrap gap-2 justify-start">
            {navigationItems.map((item) => {
              const ItemIcon = item.icon;
              const isSelected = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0B4C33] text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-100"
                  }`}
                >
                  <ItemIcon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.id === "assistente" && (
                    <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1 py-0.5 rounded ml-1 ${
                      isSelected ? "bg-emerald-500/20 text-emerald-200" : "bg-teal-50 text-teal-700"
                    }`}>
                      IA
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mobile Drawer */}
          <div className="md:hidden w-full">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-2.5">
                <ActiveIcon className="w-4 h-4 text-teal-600" />
                <span>{activeItem.label}</span>
              </div>
              <Menu className="w-4 h-4 text-slate-400" />
            </button>

            {isMobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px]"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <div className="fixed top-0 left-0 bottom-0 z-50 w-[82vw] max-w-xs bg-white border-r border-slate-100 shadow-2xl p-4 animate-[slide-in-left_0.2s_ease-out]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-teal-600">Menu</p>
                      <h3 className="text-sm font-bold text-slate-800">FABRÍCIA RODRIGUES</h3>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-2 rounded-xl hover:bg-slate-50 text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
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
                          className={`w-full flex items-center gap-3 px-3 py-3 text-xs font-bold transition-all text-left cursor-pointer rounded-xl ${
                            isSelected
                              ? "text-teal-700 bg-teal-50"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <ItemIcon className={`w-4 h-4 ${isSelected ? "text-teal-600" : "text-slate-400"}`} />
                          <span className="flex-1">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 w-full mx-auto p-4 md:p-6 pb-12 ${isDesktop ? "max-w-[1600px]" : "max-w-7xl"}`}>
        {activeTab === "dashboard" && (
          <DashboardView
            patients={patients}
            appointments={appointments}
            finances={finances}
            onNavigate={(tab) => setActiveTab(tab)}
            onQuickSchedule={() => setActiveTab("agenda")}
          />
        )}

        {activeTab === "pacientes" && (
          <PatientView
            patients={patients}
            onAddPatient={handleAddPatient}
            onDeletePatient={handleDeletePatient}
            onUpdatePatientIssues={handleUpdatePatientIssues}
            onAddPatientEvolution={handleAddPatientEvolution}
          />
        )}

        {activeTab === "anamnese" && (
          <AnamneseView
            patients={patients}
            onUpdatePatient={handleUpdatePatient}
            onNavigate={setActiveTab}
            embeddedPatientId={selectedAnamnesePatientId || undefined}
          />
        )}

        {activeTab === "agenda" && renderAgenda()}

        {activeTab === "financeiro" && (
          <FinanceView finances={finances} onAddFinanceRecord={handleAddFinanceRecord} />
        )}

        {activeTab === "servicos" && (
          <ServicesView
            services={services}
            onAddOrUpdateService={handleAddOrUpdateService}
            onDeleteService={handleDeleteService}
          />
        )}

        {activeTab === "assistente" && <AiAssistantView patients={patients} />}

        {activeTab === "portal" && <BookingPortalView />}
      </main>

      {/* Mobile Support Footer */}
      <div className="sm:hidden px-4 pb-4">
        <a
          href="https://wa.me/5519997222694"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-teal-50 hover:bg-teal-100 border border-teal-100 text-teal-700 py-3 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Phone className="w-4 h-4 text-teal-600" />
          <span>Suporte: (19) 99722-2694</span>
        </a>
      </div>

      <footer className="bg-white border-t border-slate-100 py-5 text-center text-[10px] text-slate-400 font-medium">
        <p>© 2026 Clínica Podologia Fabrícia. Todos os direitos reservados.</p>
        <p className="mt-1 text-slate-300">Desenvolvido em Cloud Run com suporte de Inteligência Artificial Google Gemini</p>
      </footer>
    </div>
  );
}
