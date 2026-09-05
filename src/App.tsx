import React, { useState, useEffect } from 'react';
import { Patient, TabType, TimelineItem, Appointment, Professional } from './types';
import { INITIAL_PATIENTS, INITIAL_APPOINTMENTS } from './data/mockPatients';
import { INITIAL_PROFESSIONALS } from './data/mockProfessionals';
import { BrandLogo } from './components/BrandLogo';
import { PatientCard } from './components/PatientCard';
import { DetailScreen } from './components/DetailScreen';
import { NewPatientWizard } from './components/NewPatientWizard';
import { NewSessionModal } from './components/NewSessionModal';
import { PhotoInspectionModal } from './components/PhotoInspectionModal';
import { AgendaTab } from './components/AgendaTab';
import { RecordsTab } from './components/RecordsTab';
import { ProfileTab } from './components/ProfileTab';
import { NotificationsModal } from './components/NotificationsModal';
import { ClientPortal } from './components/ClientPortal';
import { ClientShareModal } from './components/ClientShareModal';
import { FinanceiroTab } from './components/FinanceiroTab';
import { ServicosTab } from './components/ServicosTab';
import { EstoqueTab } from './components/EstoqueTab';
import { IaTab } from './components/IaTab';
import { ConfiguracoesTab } from './components/ConfiguracoesTab';
import { ProfessionalLoginModal } from './components/ProfessionalLoginModal';
import { LoginScreen } from './components/LoginScreen';
import { Avatar } from './components/Avatar';
import {
  firebaseConfig,
  subscribeToPatients,
  savePatientToFirestore,
  checkAndSeedFirestore,
  testFirestoreConnection,
  onAuthChange,
  logoutProfessional,
} from './firebase';
import {
  Bell,
  Search,
  Plus,
  Home,
  Calendar as CalendarIcon,
  FileText,
  User,
  Monitor,
  Smartphone,
  CheckCircle2,
  CalendarCheck,
  Award,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Share2,
  ExternalLink,
  Cloud,
  DollarSign,
  Package,
  Settings,
  LogIn,
  Sliders,
  MoreVertical,
} from 'lucide-react';

export default function App() {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('cuidarx_patients');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved patients', e);
      }
    }
    return INITIAL_PATIENTS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('cuidarx_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved appointments', e);
      }
    }
    return INITIAL_APPOINTMENTS;
  });

  const handleBookAppointment = (newApp: Appointment) => {
    setAppointments((prev) => {
      const updated = [newApp, ...prev];
      localStorage.setItem('cuidarx_appointments', JSON.stringify(updated));
      return updated;
    });

    // Also link to patient timeline history if patient matches
    const targetPatient = patients.find(
      (p) =>
        p.id === newApp.patientId ||
        p.name.toLowerCase() === newApp.patientName.toLowerCase()
    );
    if (targetPatient) {
      const updatedPatient: Patient = {
        ...targetPatient,
        timeline: [
          {
            id: `tl-${Date.now()}`,
            date: newApp.date || 'Hoje',
            title: `Agendamento Online`,
            note: `Confirmado: ${newApp.type} às ${newApp.time}`,
            procedure: newApp.type,
            done: true,
          },
          ...targetPatient.timeline,
        ],
      };
      handleUpdatePatient(updatedPatient);
    }
  };

  const handleUpdateAppointmentStatus = (id: string, nextStatus: Appointment['status']) => {
    setAppointments((prev) => {
      const updated = prev.map((app) => (app.id === id ? { ...app, status: nextStatus } : app));
      localStorage.setItem('cuidarx_appointments', JSON.stringify(updated));
      return updated;
    });
  };

  const [professionals, setProfessionals] = useState<Professional[]>(() => {
    const saved = localStorage.getItem('cuidarx_professionals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_PROFESSIONALS;
  });

  const [currentProfessional, setCurrentProfessional] = useState<Professional | null>(() => {
    const savedId = localStorage.getItem('cuidarx_logged_prof_id');
    if (savedId) {
      const found = INITIAL_PROFESSIONALS.find((p) => p.id === savedId);
      if (found) return found;
    }
    return INITIAL_PROFESSIONALS[0];
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cuidarx_authenticated') === 'true';
  });

  const handleSelectProfessional = (prof: Professional) => {
    setCurrentProfessional(prof);
    localStorage.setItem('cuidarx_logged_prof_id', prof.id);
  };

  const handleLogin = (prof: Professional) => {
    setCurrentProfessional(prof);
    localStorage.setItem('cuidarx_logged_prof_id', prof.id);
    setIsAuthenticated(true);
    localStorage.setItem('cuidarx_authenticated', 'true');
  };

  const handleLogout = () => {
    logoutProfessional().catch(() => {});
    setIsAuthenticated(false);
    localStorage.removeItem('cuidarx_authenticated');
    localStorage.removeItem('cuidarx_logged_prof_id');
    setCurrentProfessional(null);
  };

  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(() => {
    return INITIAL_PATIENTS[0]?.id || null;
  });
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Search input on home screen
  const [homeSearchTerm, setHomeSearchTerm] = useState('');

  // Modals state
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [isPhotoGalleryOpen, setIsPhotoGalleryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isClientShareOpen, setIsClientShareOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Client portal view state (URL https://cuidarx-20052026.web.app/cliente)
  const [isClientPortal, setIsClientPortal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      return path.includes('cliente') || hash.includes('cliente') || search.includes('cliente');
    }
    return false;
  });

  // Listen to popstate event so browser back/forward buttons work with /cliente
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      setIsClientPortal(path.includes('cliente') || hash.includes('cliente'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenClientPortal = (patientId?: string) => {
    if (patientId) setSelectedPatientId(patientId);
    setIsClientPortal(true);
    try {
      window.history.pushState(null, '', '/cliente');
    } catch {
      // fallback
    }
  };

  const handleBackToClinic = () => {
    setIsClientPortal(false);
    try {
      window.history.pushState(null, '', '/');
    } catch {
      // fallback
    }
  };

  // View mode toggle: Responsive (Default for PC/mobile) vs Phone Mockup frame
  const [isPhoneMockup, setIsPhoneMockup] = useState(false);

  // Real-time Firebase Firestore Sync state
  const [isFirebaseSynced, setIsFirebaseSynced] = useState(false);

  // Initialize Firebase connection and live Firestore subscription
  useEffect(() => {
    testFirestoreConnection();
    checkAndSeedFirestore(INITIAL_PATIENTS);

    const unsubscribe = subscribeToPatients(
      (firestorePatients) => {
        if (firestorePatients && firestorePatients.length > 0) {
          setPatients(firestorePatients);
          setIsFirebaseSynced(true);
        }
      },
      (err) => {
        console.warn('Firebase sync notice:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        // Find professional by authUid
        const found = professionals.find((p) => p.authUid === user.uid);
        if (found) {
          setCurrentProfessional(found);
          setIsAuthenticated(true);
          localStorage.setItem('cuidarx_logged_prof_id', found.id);
          localStorage.setItem('cuidarx_authenticated', 'true');
        }
      } else {
        // No user logged in
        setCurrentProfessional(null);
        setIsAuthenticated(false);
        localStorage.removeItem('cuidarx_logged_prof_id');
        localStorage.removeItem('cuidarx_authenticated');
      }
    });
    return () => unsubscribe();
  }, [professionals]);

  // Save patients to localStorage as fast offline cache
  useEffect(() => {
    localStorage.setItem('cuidarx_patients', JSON.stringify(patients));
  }, [patients]);

  const selectedPatient =
    patients.find((p) => p.id === selectedPatientId) || patients[0] || null;

  const handleOpenDetail = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const handleSelectPatientById = (patientId: string) => {
    const found = patients.find((p) => p.id === patientId);
    if (found) {
      setSelectedPatientId(found.id);
      setIsDetailOpen(true);
    }
  };

  const handleCreatePatient = (newPatient: Patient) => {
    const patientWithPro = {
      ...newPatient,
      professionalId: currentProfessional?.id || undefined,
    };
    setPatients((prev) => [patientWithPro, ...prev]);
    setSelectedPatientId(patientWithPro.id);
    setIsDetailOpen(true);
    // Persist to Firebase Firestore
    savePatientToFirestore(patientWithPro).catch((err) => {
      console.warn('Could not sync created patient to Firestore:', err);
    });
  };

  const handleAddSession = (session: TimelineItem, photoUrl?: string) => {
    if (!selectedPatientId) return;

    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id === selectedPatientId) {
          const updatedTimeline = [session, ...pat.timeline];
          const updatedPhotos = photoUrl
            ? [
                {
                  id: `photo-${Date.now()}`,
                  type: 'progress' as const,
                  label: session.title,
                  url: photoUrl,
                  date: session.date,
                },
                ...pat.photos,
              ]
            : pat.photos;

          const updatedPatient: Patient = {
            ...pat,
            timeline: updatedTimeline,
            photos: updatedPhotos,
            timeAgo: 'Hoje',
          };

          // Persist session to Firebase Firestore
          savePatientToFirestore(updatedPatient).catch((err) => {
            console.warn('Could not sync session to Firestore:', err);
          });

          return updatedPatient;
        }
        return pat;
      })
    );
  };

  const handleToggleTimelineItem = (itemId: string) => {
    if (!selectedPatientId) return;
    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id === selectedPatientId) {
          const updatedPatient: Patient = {
            ...pat,
            timeline: pat.timeline.map((item) =>
              item.id === itemId ? { ...item, done: !item.done } : item
            ),
          };

          // Persist to Firebase Firestore
          savePatientToFirestore(updatedPatient).catch((err) => {
            console.warn('Could not sync timeline update to Firestore:', err);
          });

          return updatedPatient;
        }
        return pat;
      })
    );
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients((prev) =>
      prev.map((pat) => (pat.id === updatedPatient.id ? updatedPatient : pat))
    );
    // Persist to Firebase Firestore
    savePatientToFirestore(updatedPatient).catch((err) => {
      console.warn('Could not sync updated patient to Firestore:', err);
    });
  };

  // Filtered patients for home screen search
  const filteredHomePatients = patients.filter((p) => {
    if (!homeSearchTerm.trim()) return true;
    const term = homeSearchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.condition.toLowerCase().includes(term) ||
      p.locationDetails.toLowerCase().includes(term)
    );
  });

  /* =======================================================================
     0. ÁREA DO CLIENTE / PACIENTE (https://cuidarx-20052026.web.app/cliente)
     ======================================================================= */
  if (isClientPortal) {
    return (
      <ClientPortal
        patients={patients}
        appointments={appointments}
        professionals={professionals}
        onBackToClinic={handleBackToClinic}
        onBookAppointment={handleBookAppointment}
      />
    );
  }

  /* =======================================================================
     AUTH GATE: Show login screen if not authenticated
     ======================================================================= */
  if (!isAuthenticated) {
    return (
      <LoginScreen
        professionals={professionals}
        onLogin={handleLogin}
        onAddProfessional={(newProf) => setProfessionals((prev) => [...prev, newProf])}
      />
    );
  }

  /* =======================================================================
     1. SIMULATION MOCKUP MODE (If user explicitly toggles phone frame view)
     ======================================================================= */
  if (isPhoneMockup) {
    return (
      <div className="min-h-screen bg-[#E9E1D2] flex flex-col items-center justify-center p-2 sm:p-6 font-inter select-none">
        {/* Switcher bar */}
        <div className="w-full max-w-[390px] mb-3 flex items-center justify-between text-xs text-[#8b8272] px-1">
          <span className="font-medium tracking-wide">
            Simulação Mobile (390px)
          </span>
          <button
            type="button"
            onClick={() => setIsPhoneMockup(false)}
            className="bg-[#FFFDF9] hover:bg-[#F3E6D2] border border-[#E4D8C4] rounded-lg px-2.5 py-1 text-[#24312E] font-medium flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Monitor size={13} className="text-[#0F766E]" />
            <span>Voltar ao Modo PC</span>
          </button>
        </div>

        {/* 390px Phone Frame */}
        <div
          id="phone"
          className="relative bg-[#FBF3E7] overflow-hidden w-[390px] h-[815px] rounded-[44px] shadow-[0_30px_60px_-20px_rgba(20,25,23,0.45),0_0_0_10px_#1c1c1c,0_0_0_12px_#3a3a3a]"
        >
          {/* Dynamic Island / Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[26px] bg-[#1c1c1c] rounded-b-[16px] z-50 pointer-events-none flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#121212] mr-3" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#0a2540] border border-[#1a385c]" />
          </div>

          {/* Screen List */}
          <div
            id="screen-list"
            className="absolute inset-0 flex flex-col transition-all duration-[420ms] ease-[cubic-bezier(0.65,0.05,0.36,1)]"
            style={{
              transform: isDetailOpen ? 'translateX(-28%)' : 'translateX(0%)',
              filter: isDetailOpen ? 'brightness(0.94)' : 'none',
              pointerEvents: isDetailOpen ? 'none' : 'auto',
            }}
          >
            {/* Topbar */}
            <div className="pt-[52px] px-[22px] pb-[6px] flex items-center justify-between bg-[#FBF3E7] z-10">
              <BrandLogo />
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                aria-label="Abrir notificações"
                className="w-[36px] h-[36px] rounded-[12px] bg-[#F3E6D2] hover:bg-[#E4D8C4] flex items-center justify-center text-[#5B665F] transition-all cursor-pointer relative"
              >
                <Bell size={17} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#B5542B] ring-2 ring-[#F3E6D2]" />
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'inicio' && (
              <div className="flex-1 overflow-y-auto px-[22px] pt-[4px] pb-[110px] no-scrollbar">
                <div className="mb-5">
                  <h1 className="font-fraunces font-medium text-[26px] leading-[1.25] text-[#24312E] mt-[14px] mb-[4px]">
                    Boa tarde, Renata
                  </h1>
                  <p className="text-[14.5px] text-[#5B665F] leading-[1.5] m-0">
                    Você tem <b className="text-[#0B5D56] font-semibold">3 atendimentos</b> agendados para hoje.
                  </p>
                </div>

                <div className="flex items-center gap-[10px] bg-[#FFFDF9] border border-[#E4D8C4] rounded-[14px] p-[12px_14px] mb-[26px] shadow-2xs">
                  <Search size={17} className="text-[#5B665F] shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar paciente ou ficha"
                    value={homeSearchTerm}
                    onChange={(e) => setHomeSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none text-[14px] text-[#24312E] placeholder-[#9b9280] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between mb-[12px] ml-[2px]">
                  <p className="text-[13px] text-[#5B665F] font-medium m-0">Fichas recentes</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fichas')}
                    className="text-[12px] text-[#0F766E] font-medium hover:underline"
                  >
                    Ver todas ({patients.length})
                  </button>
                </div>

                <div className="space-y-[10px]">
                  {filteredHomePatients.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      isSelected={selectedPatientId === patient.id}
                      onClick={() => handleOpenDetail(patient)}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'agenda' && (
              <AgendaTab
                appointments={appointments}
                onSelectPatient={handleSelectPatientById}
                onUpdateStatus={handleUpdateAppointmentStatus}
              />
            )}

            {activeTab === 'fichas' && (
              <RecordsTab
                patients={patients}
                onSelectPatient={handleOpenDetail}
              />
            )}

            {activeTab === 'perfil' && <ProfileTab />}

            {/* FAB */}
            {activeTab !== 'perfil' && (
              <button
                type="button"
                onClick={() => setIsNewPatientOpen(true)}
                className="absolute bottom-[96px] right-[22px] bg-[#0F766E] hover:bg-[#0B5D56] active:scale-95 text-white px-[18px] py-[13px] rounded-[16px] text-[14px] font-semibold flex items-center gap-[8px] shadow-[0_10px_24px_-6px_rgba(15,118,110,0.55)] z-20 transition-all cursor-pointer"
              >
                <Plus size={16} strokeWidth={2.4} />
                Nova ficha
              </button>
            )}

            {/* Bottom Nav */}
            <div className="absolute left-0 right-0 bottom-0 bg-[#FBF3E7]/95 backdrop-blur-md border-t border-[#E4D8C4] flex justify-around items-center px-[10px] pt-[12px] pb-[22px] z-15 select-none">
              <button
                type="button"
                onClick={() => setActiveTab('inicio')}
                className={`flex flex-col items-center gap-[4px] text-[10.5px] font-medium ${
                  activeTab === 'inicio' ? 'text-[#0B5D56] font-semibold' : 'text-[#a89f8a]'
                }`}
              >
                <Home size={20} />
                Início
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('agenda')}
                className={`flex flex-col items-center gap-[4px] text-[10.5px] font-medium ${
                  activeTab === 'agenda' ? 'text-[#0B5D56] font-semibold' : 'text-[#a89f8a]'
                }`}
              >
                <CalendarIcon size={20} />
                Agenda
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fichas')}
                className={`flex flex-col items-center gap-[4px] text-[10.5px] font-medium ${
                  activeTab === 'fichas' ? 'text-[#0B5D56] font-semibold' : 'text-[#a89f8a]'
                }`}
              >
                <FileText size={20} />
                Fichas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('perfil')}
                className={`flex flex-col items-center gap-[4px] text-[10.5px] font-medium ${
                  activeTab === 'perfil' ? 'text-[#0B5D56] font-semibold' : 'text-[#a89f8a]'
                }`}
              >
                <User size={20} />
                Perfil
              </button>
            </div>
          </div>

          {/* Mobile Detail Slide-in */}
          <div
            id="screen-detail"
            className="absolute inset-0 bg-[#FBF3E7] flex flex-col transition-transform duration-[420ms] ease-[cubic-bezier(0.65,0.05,0.36,1)] z-30"
            style={{
              transform: isDetailOpen ? 'translateX(0%)' : 'translateX(100%)',
            }}
          >
            <DetailScreen
              patient={selectedPatient}
              onBack={handleCloseDetail}
              onOpenNewSession={() => setIsNewSessionOpen(true)}
              onOpenPhotoGallery={() => setIsPhotoGalleryOpen(true)}
              onToggleTimelineItem={handleToggleTimelineItem}
              onOpenClientShare={() => setIsClientShareOpen(true)}
              onUpdatePatient={handleUpdatePatient}
            />
          </div>
        </div>

        {/* Modals */}
        <NewPatientWizard
          isOpen={isNewPatientOpen}
          onClose={() => setIsNewPatientOpen(false)}
          onSave={handleCreatePatient}
        />
        <NewSessionModal
          isOpen={isNewSessionOpen}
          patientName={selectedPatient?.name || ''}
          onClose={() => setIsNewSessionOpen(false)}
          onSave={handleAddSession}
        />
        <PhotoInspectionModal
          isOpen={isPhotoGalleryOpen}
          patient={selectedPatient}
          onClose={() => setIsPhotoGalleryOpen(false)}
        />
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onSelectPatient={handleSelectPatientById}
        />
        <ClientShareModal
          isOpen={isClientShareOpen}
          onClose={() => setIsClientShareOpen(false)}
          patient={selectedPatient}
          onOpenClientPortal={() => handleOpenClientPortal(selectedPatient?.id)}
        />
      </div>
    );
  }

  /* =======================================================================
     2. DEFAULT RESPONSIVE MODE (For PC, Tablet and Mobile)
     ======================================================================= */
  return (
    <div className="min-h-screen bg-[#FBF3E7] text-[#24312E] flex flex-col font-inter selection:bg-[#0F766E] selection:text-white">
      {/* RESPONSIVE TOPBAR HEADER — Two-row layout */}
      <header className="hidden md:block sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E4D8C4] transition-all">
        {/* ── Row 1: Brand + Actions ── */}
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2.5">
          {/* Left: Brand Logo & Clinical Subtitle */}
          <div className="flex items-center gap-3 shrink-0">
            <BrandLogo />
            <div className="hidden sm:block border-l border-[#E4D8C4] pl-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#0F766E] block">
                Prontuário Podológico
              </span>
              <span className="text-xs text-[#5B665F]">
                Gestão Clínica & Biossegurança
              </span>
            </div>
          </div>

          {/* Right: Primary Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Search on Desktop */}
            <div className="hidden md:flex items-center gap-2 bg-[#FBF3E7] border border-[#E4D8C4] rounded-xl px-3 py-1.5 text-xs text-[#24312E]">
              <Search size={14} className="text-[#5B665F]" />
              <input
                type="text"
                placeholder="Buscar ficha..."
                value={homeSearchTerm}
                onChange={(e) => setHomeSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-32 text-xs placeholder-[#8b8272]"
              />
            </div>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              aria-label="Notificações"
              className="w-9 h-9 rounded-xl bg-[#F3E6D2] hover:bg-[#E4D8C4] flex items-center justify-center text-[#5B665F] transition-all relative cursor-pointer"
            >
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#B5542B] ring-2 ring-[#F3E6D2]" />
            </button>

            {/* Primary Action: + Nova Ficha */}
            <button
              type="button"
              onClick={() => setIsNewPatientOpen(true)}
              className="bg-[#0F766E] hover:bg-[#0B5D56] text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus size={14} strokeWidth={2.4} />
              <span className="hidden sm:inline">Nova Ficha</span>
              <span className="sm:hidden">+</span>
            </button>

            {/* Multi-user Professional Selector & Login */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#E4D8C4]">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 bg-[#FBF3E7] hover:bg-[#F3E6D2] border border-[#E4D8C4] rounded-xl px-2.5 py-1.5 transition-all text-left cursor-pointer group"
                title="Clique para alternar o profissional logado"
              >
                <Avatar
                  src={currentProfessional?.avatar}
                  name={currentProfessional?.name || 'Entrar'}
                  size="xs"
                  rounded="lg"
                  ring="ring-1 ring-[#0F766E]"
                  bgColor="#E3EEEC"
                  textColor="#0F766E"
                />
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <div className="font-bold text-[#24312E] group-hover:text-[#0F766E] flex items-center gap-1">
                    <span>{currentProfessional ? currentProfessional.name : 'Entrar'}</span>
                    <ChevronRight size={12} className="text-[#5B665F] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <div className="text-[11px] text-[#5B665F]">
                    {currentProfessional ? currentProfessional.title.split('&')[0] : 'Profissional'}
                  </div>
                </div>
              </button>
            </div>

            {/* Mais Opções dropdown (Firebase, Simular Celular, Área do Cliente) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="w-9 h-9 rounded-xl bg-[#FBF3E7] hover:bg-[#F3E6D2] border border-[#E4D8C4] flex items-center justify-center text-[#5B665F] transition-all cursor-pointer"
                title="Mais opções"
              >
                <MoreVertical size={16} />
              </button>
              {isMoreMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMoreMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-[#FFFDF9] border border-[#E4D8C4] rounded-xl shadow-lg py-1.5 overflow-hidden">
                    {/* Firebase Status */}
                    <div className="px-3.5 py-2.5 flex items-center gap-2.5 border-b border-[#E4D8C4]">
                      <Cloud size={14} className="text-[#0F766E] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#24312E]">Firebase</div>
                        <div className="text-[11px] text-[#5B665F] font-mono truncate">{firebaseConfig.projectId}</div>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isFirebaseSynced ? 'bg-emerald-600' : 'bg-emerald-500 animate-pulse'}`} />
                    </div>
                    {/* Simular Celular */}
                    <button
                      type="button"
                      onClick={() => { setIsPhoneMockup(true); setIsMoreMenuOpen(false); }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-[#FBF3E7] transition-colors text-left cursor-pointer"
                    >
                      <Smartphone size={14} className="text-[#0F766E] shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-[#24312E]">Simular Celular</div>
                        <div className="text-[11px] text-[#5B665F]">Visualizar em 390px</div>
                      </div>
                    </button>
                    {/* Área do Cliente */}
                    <button
                      type="button"
                      onClick={() => { handleOpenClientPortal(selectedPatientId || undefined); setIsMoreMenuOpen(false); }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-[#FBF3E7] transition-colors text-left cursor-pointer"
                    >
                      <ExternalLink size={14} className="text-[#0F766E] shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-[#24312E]">Área do Cliente</div>
                        <div className="text-[11px] text-[#5B665F] font-mono">/cliente</div>
                      </div>
                    </button>
                    {/* Divider */}
                    <div className="border-t border-[#E4D8C4] my-1" />
                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => { handleLogout(); setIsMoreMenuOpen(false); }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <LogIn size={14} className="text-red-600 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-red-700">Sair da conta</div>
                        <div className="text-[11px] text-[#5B665F]">Voltar para a tela de login</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 2: Navigation Tabs ── */}
        <nav className="max-w-7xl mx-auto flex items-center gap-1 px-4 sm:px-6 lg:px-8 py-1.5 border-t border-[#E4D8C4]/50 overflow-x-auto no-scrollbar">
          {([
            { key: 'inicio' as TabType, icon: Home, label: 'Inicio', badge: null },
            { key: 'agenda' as TabType, icon: CalendarIcon, label: 'Agenda', badge: { count: appointments.length, color: 'bg-[#E3EEEC] text-[#0F766E]' } },
            { key: 'fichas' as TabType, icon: FileText, label: 'Fichas', badge: { count: patients.length, color: 'bg-[#F3E6D2] text-[#5B665F]' } },
            { key: 'financeiro' as TabType, icon: DollarSign, label: 'Financeiro', badge: null },
            { key: 'servicos' as TabType, icon: Sliders, label: 'Servicos', badge: null },
            { key: 'estoque' as TabType, icon: Package, label: 'Estoque', badge: null },
            { key: 'ia' as TabType, icon: Sparkles, label: 'IA', badge: null },
            { key: 'configuracoes' as TabType, icon: Settings, label: 'Ajustes', badge: null },
          ]).map(({ key, icon: Icon, label, badge }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveTab(key);
                setIsDetailOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === key
                  ? 'bg-white text-[#0F766E] shadow-2xs'
                  : 'text-[#5B665F] hover:text-[#24312E] hover:bg-[#FBF3E7]'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
              {badge && (
                <span className={`${badge.color} text-[10px] px-1.5 py-0.2 rounded-full font-bold`}>
                  {badge.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* MAIN RESPONSIVE CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col">
        {/* ===================== TAB: INÍCIO (DASHBOARD) ===================== */}
        {activeTab === 'inicio' && (
          <div className="flex-1 flex flex-col">
            {/* Mobile View with detail opened */}
            {isDetailOpen && selectedPatient ? (
              <div className="lg:hidden flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] overflow-hidden shadow-xs">
                <DetailScreen
                  patient={selectedPatient}
                  onBack={handleCloseDetail}
                  onOpenNewSession={() => setIsNewSessionOpen(true)}
                  onOpenPhotoGallery={() => setIsPhotoGalleryOpen(true)}
                  onToggleTimelineItem={handleToggleTimelineItem}
                  onOpenClientShare={() => setIsClientShareOpen(true)}
                  onUpdatePatient={handleUpdatePatient}
                />
              </div>
            ) : (
              /* DESKTOP & TABLET: MASTER-DETAIL 2-COLUMN WORKSPACE */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
                {/* LEFT COLUMN: GREETING, METRICS, SEARCH & PATIENTS LIST */}
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
                  {/* Greeting & Summary Stats */}
                  <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[20px] p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="font-fraunces font-medium text-[22px] sm:text-[25px] text-[#24312E] leading-tight">
                          Boa tarde, Renata
                        </h1>
                        <p className="text-[13px] text-[#5B665F] mt-0.5">
                          Atendimentos clínicos e prontuários do dia
                        </p>
                      </div>
                      <span className="hidden sm:inline-block px-2.5 py-1 bg-[#E3EEEC] text-[#0F766E] text-[11px] font-bold rounded-lg">
                        Clínica Cuidar+
                      </span>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-[#E4D8C4]/60">
                      <div className="bg-[#FBF3E7] p-2 sm:p-2.5 rounded-xl text-center">
                        <div className="text-[16px] sm:text-[18px] font-bold text-[#0F766E]">
                          3
                        </div>
                        <div className="text-[10px] text-[#5B665F] font-medium leading-tight">
                          Agendados Hoje
                        </div>
                      </div>
                      <div className="bg-[#FBF3E7] p-2 sm:p-2.5 rounded-xl text-center">
                        <div className="text-[16px] sm:text-[18px] font-bold text-[#24312E]">
                          {patients.length}
                        </div>
                        <div className="text-[10px] text-[#5B665F] font-medium leading-tight">
                          Fichas Ativas
                        </div>
                      </div>
                      <div className="bg-[#FBF3E7] p-2 sm:p-2.5 rounded-xl text-center">
                        <div className="text-[16px] sm:text-[18px] font-bold text-[#5B7A63]">
                          1
                        </div>
                        <div className="text-[10px] text-[#5B665F] font-medium leading-tight">
                          Alta Recente
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="flex items-center gap-2.5 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[16px] px-3.5 py-3 shadow-2xs">
                    <Search size={16} className="text-[#5B665F] shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar paciente por nome ou patologia..."
                      value={homeSearchTerm}
                      onChange={(e) => setHomeSearchTerm(e.target.value)}
                      className="w-full bg-transparent border-none text-[13.5px] text-[#24312E] placeholder-[#9b9280] focus:outline-none"
                    />
                    {homeSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setHomeSearchTerm('')}
                        className="text-[11px] text-[#5B665F] bg-[#F3E6D2] px-1.5 py-0.5 rounded-full"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Patients List Header */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[13px] font-bold text-[#24312E] uppercase tracking-wider">
                      Fichas Clínicas Recentes
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('fichas')}
                      className="text-[12px] font-semibold text-[#0F766E] hover:underline"
                    >
                      Ver todas ({patients.length})
                    </button>
                  </div>

                  {/* Patient Cards List */}
                  <div className="space-y-2">
                    {filteredHomePatients.length === 0 ? (
                      <div className="text-center py-8 bg-[#FFFDF9] rounded-2xl border border-[#E4D8C4]">
                        <p className="text-[13px] font-semibold text-[#24312E]">
                          Nenhum paciente encontrado
                        </p>
                        <p className="text-[11.5px] text-[#5B665F] mt-1">
                          Tente buscar por outro termo.
                        </p>
                      </div>
                    ) : (
                      filteredHomePatients.map((patient) => (
                        <PatientCard
                          key={patient.id}
                          patient={patient}
                          isSelected={selectedPatientId === patient.id}
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            setIsDetailOpen(true);
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN (DESKTOP): FULL CLINICAL DOSSIER WORKSPACE */}
                <div className="hidden lg:flex lg:col-span-7 xl:col-span-8 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] shadow-xs overflow-hidden min-h-[700px] flex-col sticky top-20">
                  {selectedPatient ? (
                    <DetailScreen
                      patient={selectedPatient}
                      onBack={handleCloseDetail}
                      onOpenNewSession={() => setIsNewSessionOpen(true)}
                      onOpenPhotoGallery={() => setIsPhotoGalleryOpen(true)}
                      onToggleTimelineItem={handleToggleTimelineItem}
                      onOpenClientShare={() => setIsClientShareOpen(true)}
                      onUpdatePatient={handleUpdatePatient}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center mb-3">
                        <FileText size={28} />
                      </div>
                      <h3 className="font-fraunces text-[18px] font-semibold text-[#24312E]">
                        Selecione um Paciente
                      </h3>
                      <p className="text-[13px] text-[#5B665F] max-w-xs mt-1">
                        Clique em qualquer ficha à esquerda para abrir o prontuário completo, histórico e evolução fotográfica.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: AGENDA ===================== */}
        {activeTab === 'agenda' && (
          <div className="flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-4 sm:p-6 shadow-xs">
            <AgendaTab
              appointments={appointments}
              patients={patients}
              professionals={professionals}
              currentProfessional={currentProfessional}
              onSelectPatient={(id) => {
                handleSelectPatientById(id);
                setActiveTab('inicio');
              }}
              onUpdateStatus={handleUpdateAppointmentStatus}
              onAddAppointment={handleBookAppointment}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
            />
          </div>
        )}

        {/* ===================== TAB: FICHAS ===================== */}
        {activeTab === 'fichas' && (
          <div className="flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-4 sm:p-6 shadow-xs">
            <RecordsTab
              patients={patients}
              onSelectPatient={(patient) => {
                setSelectedPatientId(patient.id);
                setIsDetailOpen(true);
                setActiveTab('inicio');
              }}
            />
          </div>
        )}

        {/* ===================== TAB: FINANCEIRO (CAIXA) ===================== */}
        {activeTab === 'financeiro' && (
          <div className="flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-4 sm:p-6 shadow-xs">
            <FinanceiroTab />
          </div>
        )}

        {/* ===================== TAB: SERVIÇOS & PREÇOS ===================== */}
        {activeTab === 'servicos' && (
          <div className="flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-4 sm:p-6 shadow-xs">
            <ServicosTab />
          </div>
        )}

        {/* ===================== TAB: ESTOQUE & AUTOCLAVE ===================== */}
        {activeTab === 'estoque' && (
          <div className="flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-4 sm:p-6 shadow-xs">
            <EstoqueTab />
          </div>
        )}

        {/* ===================== TAB: IA PODOLOGIA ===================== */}
        {activeTab === 'ia' && (
          <div className="flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-4 sm:p-6 shadow-xs">
            <IaTab
              patients={patients}
              selectedPatientId={selectedPatientId}
            />
          </div>
        )}

        {/* ===================== TAB: CONFIGURAÇÕES ===================== */}
        {activeTab === 'configuracoes' && (
          <div className="flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-4 sm:p-6 shadow-xs">
            <ConfiguracoesTab />
          </div>
        )}

        {/* ===================== TAB: PERFIL ===================== */}
        {activeTab === 'perfil' && (
          <div className="flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-4 sm:p-6 shadow-xs">
            <ProfileTab />
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION (Visible only on screens < md) */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E4D8C4] flex justify-around items-center px-1 py-2 z-20 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setActiveTab('inicio');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition-colors px-1 ${
            activeTab === 'inicio' ? 'text-[#0F766E] font-bold' : 'text-[#86918a]'
          }`}
        >
          <Home size={18} />
          <span>Início</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('agenda');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition-colors px-1 ${
            activeTab === 'agenda' ? 'text-[#0F766E] font-bold' : 'text-[#86918a]'
          }`}
        >
          <CalendarIcon size={18} />
          <span>Agenda</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('fichas');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition-colors px-1 ${
            activeTab === 'fichas' ? 'text-[#0F766E] font-bold' : 'text-[#86918a]'
          }`}
        >
          <FileText size={18} />
          <span>Fichas</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('financeiro');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition-colors px-1 ${
            activeTab === 'financeiro' ? 'text-[#0F766E] font-bold' : 'text-[#86918a]'
          }`}
        >
          <DollarSign size={18} />
          <span>Caixa</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('ia');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition-colors px-1 ${
            activeTab === 'ia' ? 'text-[#0F766E] font-bold' : 'text-[#86918a]'
          }`}
        >
          <Sparkles size={18} />
          <span>IA</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('configuracoes');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-0.5 text-[10.5px] font-medium transition-colors px-1 ${
            activeTab === 'configuracoes' ? 'text-[#0F766E] font-bold' : 'text-[#86918a]'
          }`}
        >
          <Settings size={18} />
          <span>Ajustes</span>
        </button>
      </div>

      {/* MOBILE FLOATING ACTION BUTTON (+ Nova Ficha) */}
      <button
        type="button"
        onClick={() => setIsNewPatientOpen(true)}
        aria-label="Cadastrar nova ficha"
        className="md:hidden fixed bottom-20 right-4 bg-[#0F766E] hover:bg-[#0B5D56] text-white p-3.5 rounded-2xl shadow-lg shadow-[#0F766E]/40 z-25 active:scale-95 transition-all flex items-center justify-center"
      >
        <Plus size={20} strokeWidth={2.4} />
      </button>

      {/* GLOBAL MODALS */}
      <NewPatientWizard
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSave={handleCreatePatient}
      />
      <NewSessionModal
        isOpen={isNewSessionOpen}
        patientName={selectedPatient?.name || ''}
        onClose={() => setIsNewSessionOpen(false)}
        onSave={handleAddSession}
      />
      <PhotoInspectionModal
        isOpen={isPhotoGalleryOpen}
        patient={selectedPatient}
        onClose={() => setIsPhotoGalleryOpen(false)}
      />
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectPatient={(id) => {
          handleSelectPatientById(id);
          setActiveTab('inicio');
        }}
      />
      <ClientShareModal
        isOpen={isClientShareOpen}
        onClose={() => setIsClientShareOpen(false)}
        patient={selectedPatient}
        onOpenClientPortal={() => handleOpenClientPortal(selectedPatient?.id)}
      />
      <ProfessionalLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        professionals={professionals}
        currentProfessional={currentProfessional}
        onSelectProfessional={handleSelectProfessional}
        onAddProfessional={(newProf) => {
          setProfessionals((prev) => {
            const updated = [...prev, newProf];
            localStorage.setItem('cuidarx_professionals', JSON.stringify(updated));
            return updated;
          });
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}
