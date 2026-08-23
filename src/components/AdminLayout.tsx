import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useClinic } from "../contexts/ClinicContext";
import { Loader2, Stethoscope, AlertCircle, CreditCard, Shield, Calendar, Users, DollarSign, ClipboardList, Package, Bot, Settings } from "lucide-react";

const DashboardView = lazy(() => import("./DashboardView").then(m => ({ default: m.default })));
const PatientView = lazy(() => import("./PatientView").then(m => ({ default: m.default })));
const CalendarView = lazy(() => import("./CalendarView").then(m => ({ default: m.default })));
const FinanceView = lazy(() => import("./FinanceView").then(m => ({ default: m.default })));
const AiAssistantView = lazy(() => import("./AiAssistantView").then(m => ({ default: m.default })));
const ServicesView = lazy(() => import("./ServicesView").then(m => ({ default: m.default })));
const InventoryView = lazy(() => import("./InventoryView").then(m => ({ default: m.default })));
const SettingsView = lazy(() => import("./SettingsView").then(m => ({ default: m.default })));

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] dark:bg-slate-900">
      <div className="relative flex flex-col items-center">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600 dark:text-emerald-400 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Carregando...</p>
      </div>
    </div>
  );
}

// Wrapper components that extract data from ClinicContext and pass as props
function DashboardWrapper() {
  const { patients, appointments, finances, onNavigate, onQuickSchedule } = useClinic();
  return <DashboardView patients={patients} appointments={appointments} finances={finances} onNavigate={onNavigate} onQuickSchedule={onQuickSchedule} />;
}

function PatientWrapper() {
  const { patients, onAddPatient, onUpdatePatient, onDeletePatient } = useClinic();
  return <PatientView patients={patients} onAddPatient={onAddPatient} onUpdatePatient={onUpdatePatient} onDeletePatient={onDeletePatient} />;
}

function CalendarWrapper() {
  const { patients, appointments, services, scheduleBlocks, onAddAppointment, onUpdateAppointment, onUpdateAppointmentStatus, onDeleteAppointment, onAddPatient, onAddScheduleBlock, onUpdateScheduleBlock, onDeleteScheduleBlock, googleEvents, isGoogleConnected, isGoogleConfigured, isSyncingGoogle } = useClinic();
  return (
    <CalendarView
      patients={patients}
      appointments={appointments}
      services={services}
      scheduleBlocks={scheduleBlocks}
      onAddAppointment={onAddAppointment}
      onUpdateAppointment={onUpdateAppointment}
      onUpdateAppointmentStatus={onUpdateAppointmentStatus}
      onDeleteAppointment={onDeleteAppointment}
      onAddPatient={onAddPatient}
      onAddScheduleBlock={onAddScheduleBlock}
      onUpdateScheduleBlock={onUpdateScheduleBlock}
      onDeleteScheduleBlock={onDeleteScheduleBlock}
      googleEvents={googleEvents}
      isGoogleConnected={isGoogleConnected}
      isGoogleConfigured={isGoogleConfigured}
      isSyncingGoogle={isSyncingGoogle}
    />
  );
}

function FinanceWrapper() {
  const { finances, onAddFinanceRecord, onDeleteFinanceRecord } = useClinic();
  return <FinanceView finances={finances} onAddFinanceRecord={onAddFinanceRecord} onDeleteFinanceRecord={onDeleteFinanceRecord} />;
}

function ServicesWrapper() {
  const { services, onAddOrUpdateService, onDeleteService } = useClinic();
  return <ServicesView services={services} onAddOrUpdateService={onAddOrUpdateService} onDeleteService={onDeleteService} />;
}

function InventoryWrapper() {
  return <InventoryView />;
}

function AiAssistantWrapper() {
  const { patients, appointments } = useClinic();
  return <AiAssistantView patients={patients} appointments={appointments} />;
}

function SettingsWrapper() {
  return <SettingsView />;
}

function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { adminUser } = useAuth();
  const { clinicConfig } = useClinic();
  const location = useLocation();

  const subscription = clinicConfig.subscription;
  const isActive = subscription?.status === "active";
  const isFree = subscription?.plan === "free";
  const trialEndsAt = clinicConfig.createdAt ? new Date(new Date(clinicConfig.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000) : null;
  const isTrialActive = trialEndsAt && new Date() < trialEndsAt;

  const hasAccess = isActive || isFree || isTrialActive;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Shield className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Assinatura Necessária</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Seu período de teste de 30 dias expirou. Para continuar acessando o painel administrativo, escolha um plano.
          </p>
          <a
            href="/assinatura"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Ver Planos e Assinar
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AdminSidebar() {
  const { adminUser, logout } = useAuth();
  const { clinicConfig } = useClinic();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const tabs = [
    { id: "agenda", label: "Agenda", icon: Calendar, path: "/app/agenda" },
    { id: "pacientes", label: "Pacientes", icon: Users, path: "/app/pacientes" },
    { id: "financeiro", label: "Financeiro", icon: DollarSign, path: "/app/financeiro" },
    { id: "servicos", label: "Serviços", icon: ClipboardList, path: "/app/servicos" },
    { id: "estoque", label: "Estoque", icon: Package, path: "/app/estoque" },
    { id: "ia", label: "IA Assistant", icon: Bot, path: "/app/ia" },
    { id: "configuracoes", label: "Configurações", icon: Settings, path: "/app/configuracoes" },
  ];

  const activeTab = tabs.find(t => location.pathname.startsWith(t.path))?.id || "agenda";

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 lg:translate-x-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Menu lateral"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-slate-900 dark:text-white truncate">{clinicConfig.clinicName || "CuidarX"}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{clinicConfig.doctorName}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto" role="navigation" aria-label="Menu principal">
            {tabs.map((tab) => (
              <button
                key={tab.id}
onClick={() => { navigate(tab.path); setIsMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{adminUser?.name || adminUser?.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{adminUser?.role || "owner"}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <AlertCircle className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-30 bg-black/50 lg:hidden transition-opacity ${isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />
    </>
  );
}

function AdminHeader() {
  const { clinicConfig } = useClinic();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return localStorage.getItem("theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add("dark"); else root.classList.remove("dark");
    try { localStorage.setItem("theme", isDarkMode ? "dark" : "light"); } catch {}
  }, [isDarkMode]);

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Abrir menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block">
            {clinicConfig.clinicName || "CuidarX"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label={isDarkMode ? "Modo claro" : "Modo escuro"}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout() {
  const { isAuthReady } = useAuth();
  const { clinicId } = useClinic();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 animate-pulse">
            <Stethoscope className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!clinicId) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader />
        <main className="p-4 lg:p-6" id="main-content" role="main">
          <Suspense fallback={<LoadingFallback />}>
            <SubscriptionGate>
              <Routes>
                <Route path="/app/agenda" element={<DashboardWrapper />} />
                <Route path="/app/pacientes" element={<PatientWrapper />} />
                <Route path="/app/financeiro" element={<FinanceWrapper />} />
                <Route path="/app/servicos" element={<ServicesWrapper />} />
                <Route path="/app/estoque" element={<InventoryWrapper />} />
                <Route path="/app/ia" element={<AiAssistantWrapper />} />
                <Route path="/app/configuracoes" element={<SettingsWrapper />} />
                <Route path="/app" element={<Navigate to="/app/agenda" replace />} />
                <Route path="/app/*" element={<Navigate to="/app/agenda" replace />} />
              </Routes>
            </SubscriptionGate>
          </Suspense>
        </main>
      </div>
    </div>
  );
}