import React, { useState, useEffect } from 'react';
import { Patient, TabType, TimelineItem } from './types';
import { INITIAL_PATIENTS, INITIAL_APPOINTMENTS } from './data/mockPatients';
import { BrandLogo } from './components/BrandLogo';
import { PatientCard } from './components/PatientCard';
import { DetailScreen } from './components/DetailScreen';
import { NewPatientModal } from './components/NewPatientModal';
import { NewSessionModal } from './components/NewSessionModal';
import { PhotoInspectionModal } from './components/PhotoInspectionModal';
import { AgendaTab } from './components/AgendaTab';
import { RecordsTab } from './components/RecordsTab';
import { ProfileTab } from './components/ProfileTab';
import { NotificationsModal } from './components/NotificationsModal';
import { ClientPortal } from './components/ClientPortal';
import { ClientShareModal } from './components/ClientShareModal';
import {
  firebaseConfig,
  subscribeToPatients,
  savePatientToFirestore,
  checkAndSeedFirestore,
  testFirestoreConnection,
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

  const [appointments] = useState(INITIAL_APPOINTMENTS);
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
    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id);
    setIsDetailOpen(true);
    // Persist to Firebase Firestore
    savePatientToFirestore(newPatient).catch((err) => {
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
        selectedPatientId={selectedPatientId}
        onSelectPatientId={(id) => setSelectedPatientId(id)}
        onBackToClinic={handleBackToClinic}
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
            />
          </div>
        </div>

        {/* Modals */}
        <NewPatientModal
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
      {/* RESPONSIVE TOPBAR HEADER */}
      <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E4D8C4] px-4 sm:px-6 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Clinical Subtitle */}
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div className="hidden sm:block border-l border-[#E4D8C4] pl-3">
              <span className="text-[11.5px] uppercase tracking-wider font-semibold text-[#0F766E] block">
                Prontuário Podológico
              </span>
              <span className="text-[12px] text-[#5B665F]">
                Gestão Clínica & Biossegurança
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on small mobile, visible md+) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#FBF3E7] p-1 rounded-xl border border-[#E4D8C4]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('inicio');
                setIsDetailOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                activeTab === 'inicio'
                  ? 'bg-white text-[#0F766E] shadow-2xs'
                  : 'text-[#5B665F] hover:text-[#24312E]'
              }`}
            >
              <Home size={15} />
              Início
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('agenda');
                setIsDetailOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                activeTab === 'agenda'
                  ? 'bg-white text-[#0F766E] shadow-2xs'
                  : 'text-[#5B665F] hover:text-[#24312E]'
              }`}
            >
              <CalendarIcon size={15} />
              Agenda
              <span className="bg-[#E3EEEC] text-[#0F766E] text-[10.5px] px-1.5 py-0.2 rounded-full font-bold">
                {appointments.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('fichas');
                setIsDetailOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                activeTab === 'fichas'
                  ? 'bg-white text-[#0F766E] shadow-2xs'
                  : 'text-[#5B665F] hover:text-[#24312E]'
              }`}
            >
              <FileText size={15} />
              Fichas
              <span className="bg-[#F3E6D2] text-[#5B665F] text-[10.5px] px-1.5 py-0.2 rounded-full font-bold">
                {patients.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('perfil');
                setIsDetailOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-white text-[#0F766E] shadow-2xs'
                  : 'text-[#5B665F] hover:text-[#24312E]'
              }`}
            >
              <User size={15} />
              Perfil
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search on Desktop */}
            <div className="hidden xl:flex items-center gap-2 bg-[#FBF3E7] border border-[#E4D8C4] rounded-xl px-3 py-1.5 text-xs text-[#24312E]">
              <Search size={14} className="text-[#5B665F]" />
              <input
                type="text"
                placeholder="Buscar ficha (ex: Camila)"
                value={homeSearchTerm}
                onChange={(e) => setHomeSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-36 text-[12px] placeholder-[#8b8272]"
              />
            </div>

            {/* Client Portal Link (https://cuidarx-20052026.web.app/cliente) */}
            <button
              type="button"
              onClick={() => handleOpenClientPortal(selectedPatientId || undefined)}
              title="Acessar Área do Cliente: https://cuidarx-20052026.web.app/cliente"
              className="flex items-center gap-1.5 bg-[#E3EEEC] hover:bg-[#0F766E] text-[#0F766E] hover:text-white border border-[#0F766E]/20 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-[12px] sm:text-[12.5px] font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <ExternalLink size={13} />
              <span>Área do Cliente</span>
              <span className="text-[10px] bg-white text-[#0F766E] px-1.5 py-0.2 rounded font-mono hidden md:inline">
                /cliente
              </span>
            </button>

            {/* Primary Action: + Nova Ficha */}
            <button
              type="button"
              onClick={() => setIsNewPatientOpen(true)}
              className="bg-[#0F766E] hover:bg-[#0B5D56] text-white px-3 sm:px-4 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus size={15} strokeWidth={2.4} />
              <span className="hidden sm:inline">Nova Ficha</span>
              <span className="sm:hidden">Nova</span>
            </button>

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

            {/* Firebase Project Status Indicator */}
            <div
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#E7EFE6] border border-[#5B7A63]/25 text-[11px] font-medium text-[#24312E]"
              title={`Firebase Projeto: ${firebaseConfig.projectId}`}
            >
              <Cloud size={13} className="text-[#0F766E]" />
              <span className={`w-2 h-2 rounded-full ${isFirebaseSynced ? 'bg-emerald-600' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="font-semibold text-[#0B5D56] text-[11px] font-mono">cuidarx-20052026</span>
            </div>

            {/* View Mode Toggle: PC vs Phone Mockup */}
            <button
              type="button"
              onClick={() => setIsPhoneMockup(true)}
              title="Simular visualização de celular (390px)"
              className="hidden lg:flex items-center gap-1.5 bg-[#FFFDF9] hover:bg-[#F3E6D2] border border-[#E4D8C4] rounded-xl px-2.5 py-1.5 text-[11.5px] font-medium text-[#5B665F] transition-all cursor-pointer"
            >
              <Smartphone size={13} className="text-[#0F766E]" />
              <span>Simular Celular</span>
            </button>

            {/* Practitioner Profile Summary */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#E4D8C4]">
              <div className="w-8 h-8 rounded-lg bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center font-bold text-xs">
                RS
              </div>
              <div className="text-left text-xs leading-tight">
                <div className="font-semibold text-[#24312E]">Drª. Renata</div>
                <div className="text-[10px] text-[#5B665F]">Podóloga CRPO</div>
              </div>
            </div>
          </div>
        </div>
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
              onSelectPatient={(id) => {
                handleSelectPatientById(id);
                setActiveTab('inicio');
              }}
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

        {/* ===================== TAB: PERFIL ===================== */}
        {activeTab === 'perfil' && (
          <div className="flex-1 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-4 sm:p-6 shadow-xs">
            <ProfileTab />
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION (Visible only on screens < md) */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E4D8C4] flex justify-around items-center px-2 py-2.5 z-20">
        <button
          type="button"
          onClick={() => {
            setActiveTab('inicio');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activeTab === 'inicio' ? 'text-[#0F766E] font-semibold' : 'text-[#86918a]'
          }`}
        >
          <Home size={19} />
          Início
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('agenda');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activeTab === 'agenda' ? 'text-[#0F766E] font-semibold' : 'text-[#86918a]'
          }`}
        >
          <CalendarIcon size={19} />
          Agenda
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('fichas');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activeTab === 'fichas' ? 'text-[#0F766E] font-semibold' : 'text-[#86918a]'
          }`}
        >
          <FileText size={19} />
          Fichas
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('perfil');
            setIsDetailOpen(false);
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            activeTab === 'perfil' ? 'text-[#0F766E] font-semibold' : 'text-[#86918a]'
          }`}
        >
          <User size={19} />
          Perfil
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
      <NewPatientModal
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
    </div>
  );
}
