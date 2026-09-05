import React, { useState } from 'react';
import { Patient, TimelineItem, Appointment, Professional } from '../types';
import { BrandLogo } from './BrandLogo';
import { ClientBookingSection } from './ClientBookingSection';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  QrCode,
  Sparkles,
  Share2,
  HeartHandshake,
  Check,
  Footprints,
  Info,
  CalendarCheck,
  ChevronRight,
  CalendarPlus,
  User,
} from 'lucide-react';

interface ClientPortalProps {
  patients: Patient[];
  appointments?: Appointment[];
  professionals?: Professional[];
  onBackToClinic: () => void;
  onBookAppointment?: (appointment: Appointment) => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  patients,
  appointments = [],
  professionals = [],
  onBackToClinic,
  onBookAppointment,
}) => {
  const [activePortalTab, setActivePortalTab] = useState<'evolution' | 'booking'>('evolution');
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(52);
  const [confirmedAppointment, setConfirmedAppointment] = useState(false);

  // Phone verification state
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [entryMode, setEntryMode] = useState<'booking' | 'account'>('account');

  const clientUrl = 'https://cuidarx-20052026.web.app/cliente';

  // Find patient by verified phone
  const currentPatient = verifiedPhone
    ? patients.find((p) => p.phone === verifiedPhone) || null
    : null;

  const handleVerifyPhone = (mode: 'booking' | 'account') => {
    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      setPhoneError('Informe um número de telefone válido');
      return;
    }
    setPhoneError('');
    setEntryMode(mode);
    setVerifiedPhone(phoneInput.trim());
  };

  const currentAppointment = currentPatient
    ? appointments.find(
        (app) =>
          app.patientId === currentPatient.id ||
          app.patientName.toLowerCase() === currentPatient.name.toLowerCase()
      )
    : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const beforePhoto =
    currentPatient?.photos?.find((p) => p.type === 'before') ||
    currentPatient?.photos?.[0];
  const afterPhoto =
    currentPatient?.photos?.find((p) => p.type === 'after') ||
    currentPatient?.photos?.[1] ||
    currentPatient?.photos?.[0];

  // If phone not verified, show phone entry screen
  if (!verifiedPhone) {
    return (
      <div className="min-h-screen bg-[#FBF3E7] text-[#24312E] flex flex-col font-inter selection:bg-[#0F766E] selection:text-white">
        {/* Header */}
        <header className="bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E4D8C4] px-4 sm:px-8 py-3.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo />
              <div className="border-l border-[#E4D8C4] pl-3 hidden sm:block">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0F766E] block">
                  Portal do Paciente
                </span>
                <span className="text-[12px] text-[#5B665F]">
                  Acompanhamento & Agendamento Online
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Phone Entry Screen */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-6 sm:p-8 shadow-xs text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center mx-auto mb-4">
                <User size={28} />
              </div>
              <h1 className="font-fraunces text-[22px] font-bold text-[#24312E] mb-1">
                Área do Cliente
              </h1>
              <p className="text-[13px] text-[#5B665F] mb-6">
                Primeiro agendamento ou já é paciente? Informe seu número de telefone para continuar.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5 text-left">
                    CELULAR / WHATSAPP *
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98888-7777"
                    value={phoneInput}
                    onChange={(e) => { setPhoneInput(e.target.value); setPhoneError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyPhone('account'); }}
                    className={`w-full bg-[#FAF8F5] border rounded-xl px-4 py-3 text-[14px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 ${
                      phoneError
                        ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
                        : 'border-[#E4D8C4] focus:border-[#0F766E] focus:ring-[#0F766E]'
                    }`}
                  />
                  {phoneError && (
                    <p className="text-[11px] text-[#DC2626] mt-1 font-medium text-left">{phoneError}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setPhoneError(''); handleVerifyPhone('booking'); }}
                    className="flex-1 bg-[#133023] hover:bg-[#1A402F] text-white py-3.5 rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Primeiro Agendamento
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhoneError(''); handleVerifyPhone('account'); }}
                    className="flex-1 bg-[#0F766E] hover:bg-[#0B5D56] text-white py-3.5 rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Acessar Minha Conta
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#738178] mt-4 leading-relaxed">
                Seu número será utilizado para identificar seu cadastro na clínica CuidarX.
              </p>
            </div>
          </div>
        </main>

        <footer className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-4 text-center text-[12px] text-[#55695E] border-t border-[#E4D8C4]/60 mt-8 w-full">
          <p>
            © 2026 CuidarX Podologia Clínica. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    );
  }

  // Patient not found — account mode shows error, booking mode shows booking
  if (!currentPatient) {
    if (entryMode === 'account') {
      return (
        <div className="min-h-screen bg-[#FBF3E7] text-[#24312E] flex flex-col font-inter selection:bg-[#0F766E] selection:text-white">
          <header className="bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E4D8C4] px-4 sm:px-8 py-3.5">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BrandLogo />
                <div className="border-l border-[#E4D8C4] pl-3 hidden sm:block">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#0F766E] block">
                    Portal do Paciente
                  </span>
                  <span className="text-[12px] text-[#5B665F]">
                    Acompanhamento & Agendamento Online
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
              <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-6 sm:p-8 shadow-xs text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={28} />
                </div>
                <h1 className="font-fraunces text-[20px] font-bold text-[#24312E] mb-1">
                  Cadastro não encontrado
                </h1>
                <p className="text-[13px] text-[#5B665F] mb-4">
                  O número <b>{verifiedPhone}</b> não está cadastrado na clínica.
                </p>
                <p className="text-[12px] text-[#5B665F] mb-5">
                  Entre em contato com a clínica para realizar seu cadastro, ou realize seu primeiro agendamento.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => { setVerifiedPhone(''); setPhoneInput(''); }}
                    className="w-full bg-[#133023] hover:bg-[#1A402F] text-white py-3 rounded-xl text-[13px] font-bold transition-all cursor-pointer"
                  >
                    Tentar outro número
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('booking')}
                    className="w-full bg-[#0F766E] hover:bg-[#0B5D56] text-white py-3 rounded-xl text-[13px] font-bold transition-all cursor-pointer"
                  >
                    Fazer Primeiro Agendamento
                  </button>
                </div>
              </div>
            </div>
          </main>

          <footer className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-4 text-center text-[12px] text-[#55695E] border-t border-[#E4D8C4]/60 mt-8 w-full">
            <p>
              © 2026 CuidarX Podologia Clínica. Todos os direitos reservados.
            </p>
          </footer>
        </div>
      );
    }

    // booking mode — show booking directly
    return (
      <div className="min-h-screen bg-[#FBF3E7] text-[#24312E] flex flex-col font-inter selection:bg-[#0F766E] selection:text-white pb-16">
        {/* Top Banner */}
        <div className="bg-[#0B5D56] text-white text-xs py-2 px-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#52D396] animate-pulse" />
              <span className="font-semibold tracking-wide">
                Área do Cliente Podológico:
              </span>
              <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[11.5px] select-all">
                {clientUrl}
              </span>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E4D8C4] px-4 sm:px-8 py-3.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo />
              <div className="border-l border-[#E4D8C4] pl-3 hidden sm:block">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#0F766E] block">
                  Portal do Paciente
                </span>
                <span className="text-[12px] text-[#5B665F]">
                  Acompanhamento & Agendamento Online
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setVerifiedPhone(''); setPhoneInput(''); }}
              className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
            >
              Trocar número
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 w-full flex-1">
          {/* Welcome for new patient */}
          <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-5 sm:p-7 shadow-xs mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E3EEEC]/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E3EEEC] text-[#0F766E] border-2 border-[#0F766E]/30 flex items-center justify-center shrink-0 shadow-2xs">
                  <User size={24} />
                </div>
                <div>
                  <h1 className="font-fraunces text-[22px] sm:text-[26px] font-bold text-[#24312E] leading-tight">
                    Bem-vindo(a)!
                  </h1>
                  <p className="text-[13.5px] text-[#5B665F] mt-1">
                    Seu número <b>{verifiedPhone}</b> foi reconhecido. Você pode agendar sua consulta abaixo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Only Booking tab for new patients */}
          <ClientBookingSection
            existingAppointments={appointments}
            professionals={professionals}
            onBookAppointment={(newApp) => {
              if (onBookAppointment) {
                onBookAppointment(newApp);
              }
            }}
          />
        </main>

        <footer className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-4 text-center text-[12px] text-[#55695E] border-t border-[#E4D8C4]/60 mt-8 w-full">
          <p>
            © 2026 CuidarX Podologia Clínica. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF3E7] text-[#24312E] flex flex-col font-inter selection:bg-[#0F766E] selection:text-white pb-16">
      {/* Top Banner indicating the official Web App Patient Portal Address */}
      <div className="bg-[#0B5D56] text-white text-xs py-2 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#52D396] animate-pulse" />
            <span className="font-semibold tracking-wide">
              Área do Cliente Podológico:
            </span>
            <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[11.5px] select-all">
              {clientUrl}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="bg-white/15 hover:bg-white/25 active:scale-95 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Link copiado!' : 'Copiar link'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="bg-white/15 hover:bg-white/25 active:scale-95 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
            >
              <QrCode size={12} />
              <span>QR Code</span>
            </button>

          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E4D8C4] px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div className="border-l border-[#E4D8C4] pl-3 hidden sm:block">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#0F766E] block">
                Portal do Paciente
              </span>
              <span className="text-[12px] text-[#5B665F]">
                Acompanhamento & Agendamento Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 w-full flex-1">
        {/* Patient Welcome Hero Card */}
        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-5 sm:p-7 shadow-xs mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#E3EEEC]/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E3EEEC] text-[#0F766E] border-2 border-[#0F766E]/30 flex items-center justify-center font-fraunces font-bold text-xl sm:text-2xl shrink-0 shadow-2xs">
                {currentPatient.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-fraunces text-[22px] sm:text-[26px] font-bold text-[#24312E] leading-tight">
                    Olá, {currentPatient.name.split(' ')[0]}!
                  </h1>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      currentPatient.status === 'completed'
                        ? 'bg-[#EAF3EC] text-[#5B7A63]'
                        : 'bg-[#E3EEEC] text-[#0F766E]'
                    }`}
                  >
                    {currentPatient.status === 'completed'
                      ? 'Alta Podológica'
                      : 'Tratamento em Andamento'}
                  </span>
                </div>

                <p className="text-[13.5px] text-[#5B665F] mt-1">
                  Diagnóstico:{' '}
                  <span className="font-semibold text-[#24312E]">
                    {currentPatient.condition}
                  </span>{' '}
                  ({currentPatient.locationDetails})
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#738178] mt-2">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={14} className="text-[#0F766E]" />
                    Podóloga: <b>Drª. Renata Silveira (CRPO 4529-SP)</b>
                  </span>
                  <span>•</span>
                  <span>Clínica Cuidar+ Saúde</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons (Including Direct Booking) */}
            <div className="flex flex-wrap items-center gap-2 sm:self-start md:self-center">
              <button
                type="button"
                onClick={() => setActivePortalTab('booking')}
                className="bg-[#0F766E] hover:bg-[#0B5D56] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <CalendarCheck size={15} />
                <span>Agendar Consulta</span>
              </button>

              <a
                href={`https://wa.me/5511998765432?text=Olá,%20Drª%20Renata!%20Sou%20${encodeURIComponent(
                  currentPatient.name
                )}%20e%20estou%20acessando%20minha%20Área%20do%20Cliente%20CuidarX.`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <MessageSquare size={14} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>

              {currentPatient.phone && (
                <a
                  href={`tel:${currentPatient.phone}`}
                  className="bg-[#FBF3E7] hover:bg-[#F3E6D2] border border-[#E4D8C4] text-[#24312E] px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Phone size={14} className="text-[#0F766E]" />
                  <span>Ligar</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs between Evolution & Online Booking */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#E4D8C4] pb-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActivePortalTab('evolution')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activePortalTab === 'evolution'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-[#FFFDF9] text-[#5B665F] hover:bg-[#F3E6D2] border border-[#E4D8C4]'
            }`}
          >
            <Sparkles size={15} />
            <span>Minha Evolução & Prontuário</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab('booking')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative shrink-0 ${
              activePortalTab === 'booking'
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-[#FFFDF9] text-[#5B665F] hover:bg-[#F3E6D2] border border-[#E4D8C4]'
            }`}
          >
            <CalendarCheck size={15} />
            <span>Agendar Consulta Online</span>
            <span className="w-2 h-2 rounded-full bg-[#52D396] animate-pulse" />
          </button>
        </div>

        {/* CONDITIONAL CONTENT: BOOKING OR EVOLUTION */}
        {activePortalTab === 'booking' ? (
          <ClientBookingSection
            currentPatient={currentPatient}
            existingAppointments={appointments}
            professionals={professionals}
            onBookAppointment={(newApp) => {
              if (onBookAppointment) {
                onBookAppointment(newApp);
              }
            }}
            onViewRecord={() => setActivePortalTab('evolution')}
          />
        ) : (
          /* Bento Grid: 2 Columns on Desktop */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: NEXT APPOINTMENT & EVOLUTION PHOTO COMPARATOR */}
            <div className="lg:col-span-7 space-y-6">
              {/* Next Appointment Card (Dynamic & Interactive) */}
              <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[22px] p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4D8C4]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center">
                      <CalendarCheck size={18} />
                    </div>
                    <div>
                      <h2 className="text-[14px] font-bold text-[#24312E]">
                        {currentAppointment ? 'Sua Consulta Agendada' : 'Próxima Sessão'}
                      </h2>
                      <p className="text-[11.5px] text-[#5B665F]">
                        {currentAppointment?.type || currentPatient.condition}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentAppointment?.bookedOnline && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E3EEEC] text-[#0F766E]">
                        Agendado Online
                      </span>
                    )}
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#FBF3E7] text-[#0F766E] border border-[#E4D8C4]">
                      {currentAppointment
                        ? currentAppointment.status === 'completed'
                          ? 'Concluída'
                          : 'Confirmada'
                        : 'Disponível para agendamento'}
                    </span>
                  </div>
                </div>

                {currentAppointment ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                      <div className="bg-[#FBF3E7] p-3 rounded-xl">
                        <span className="text-[11px] text-[#5B665F] flex items-center gap-1">
                          <Calendar size={13} className="text-[#0F766E]" />
                          Data
                        </span>
                        <span className="text-[13px] font-bold text-[#24312E] mt-0.5 block">
                          {currentAppointment.date || '10 de Setembro'}
                        </span>
                      </div>
                      <div className="bg-[#FBF3E7] p-3 rounded-xl">
                        <span className="text-[11px] text-[#5B665F] flex items-center gap-1">
                          <Clock size={13} className="text-[#0F766E]" />
                          Horário
                        </span>
                        <span className="text-[13px] font-bold text-[#0F766E] mt-0.5 block">
                          {currentAppointment.time} ({currentAppointment.duration || '45 min'})
                        </span>
                      </div>
                      <div className="bg-[#FBF3E7] p-3 rounded-xl">
                        <span className="text-[11px] text-[#5B665F] flex items-center gap-1">
                          <MapPin size={13} className="text-[#0F766E]" />
                          Local
                        </span>
                        <span className="text-[13px] font-bold text-[#24312E] mt-0.5 block truncate">
                          Sala 304 - Cuidar+
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActivePortalTab('booking')}
                        className="text-xs font-semibold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CalendarPlus size={13} />
                        <span>Remarcar ou agendar outro horário</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmedAppointment(!confirmedAppointment)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          confirmedAppointment
                            ? 'bg-[#EAF3EC] text-[#5B7A63] border border-[#5B7A63]/30'
                            : 'bg-[#0F766E] hover:bg-[#0B5D56] text-white shadow-xs active:scale-95'
                        }`}
                      >
                        <CheckCircle2 size={15} />
                        <span>
                          {confirmedAppointment
                            ? 'Presença Confirmada!'
                            : 'Confirmar Presença'}
                        </span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-4 my-2 text-center bg-[#FBF3E7]/60 rounded-xl p-4 border border-[#E4D8C4]/60">
                    <p className="text-[13px] font-semibold text-[#24312E] mb-1">
                      Você não possui sessão agendada no momento
                    </p>
                    <p className="text-[12px] text-[#5B665F] mb-3.5 max-w-sm mx-auto">
                      Mantenha seu tratamento em dia para garantir a cicatrização correta e o alívio das dores.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActivePortalTab('booking')}
                      className="bg-[#0F766E] hover:bg-[#0B5D56] text-white px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <CalendarCheck size={15} />
                      <span>Agendar Consulta Agora</span>
                    </button>
                  </div>
                )}
              </div>

            {/* Interactive Before & After Photo Comparator */}
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[22px] p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F3E6D2] text-[#B5542B] flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-[#24312E]">
                      Sua Evolução: Antes x Depois
                    </h2>
                    <p className="text-[11.5px] text-[#5B665F]">
                      Arraste o controle deslizante para comparar a melhora
                    </p>
                  </div>
                </div>

                <span className="text-[11.5px] font-semibold text-[#0F766E] bg-[#E3EEEC] px-2 py-0.5 rounded-md">
                  Regeneração Visível
                </span>
              </div>

              {/* Slider Box */}
              <div className="relative w-full h-[260px] sm:h-[320px] rounded-2xl overflow-hidden select-none border border-[#E4D8C4] bg-[#24312E]">
                {/* AFTER PHOTO (Base layer) */}
                <img
                  src={afterPhoto.url}
                  alt="Depois - Evolução do tratamento"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute bottom-3 right-3 bg-[#24312E]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md z-10">
                  Depois ({afterPhoto.date})
                </span>

                {/* BEFORE PHOTO (Clipped top layer) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={beforePhoto.url}
                    alt="Antes - Diagnóstico inicial"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <span className="absolute bottom-3 left-3 bg-[#24312E]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md z-10">
                    Antes ({beforePhoto.date})
                  </span>
                </div>

                {/* Divider Line */}
                <div
                  className="absolute top-0 bottom-0 w-[3px] bg-white shadow-md z-20 pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center text-[#24312E] font-bold text-xs border border-gray-200">
                    ↔
                  </div>
                </div>

                {/* Range Input for dragging */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  aria-label="Controle de comparação antes e depois"
                  className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
                />
              </div>

              <p className="text-[12px] text-[#5B665F] mt-3 leading-relaxed">
                <b>Evolução constatada:</b> Redução acentuada do edema periungueal
                e cicatrização do granuloma após descompressão da espícula. O leito
                apresenta tecido de granulação saudável.
              </p>
            </div>

            {/* Procedures Timeline History */}
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[22px] p-5 shadow-2xs">
              <h2 className="text-[14px] font-bold text-[#24312E] mb-3 flex items-center gap-2">
                <Footprints size={17} className="text-[#0F766E]" />
                Histórico de Procedimentos Realizados
              </h2>

              <div className="space-y-3">
                {currentPatient.timeline.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl bg-[#FBF3E7] border border-[#E4D8C4]/60 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={13} strokeWidth={3} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#24312E]">
                          {item.title}
                        </div>
                        <div className="text-[12px] text-[#5B665F] mt-0.5 leading-relaxed">
                          {item.note}
                        </div>
                        {item.procedure && (
                          <span className="inline-block mt-1 text-[10.5px] font-semibold text-[#0F766E] bg-white px-2 py-0.5 rounded border border-[#E4D8C4]">
                            {item.procedure}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-[#738178] shrink-0 bg-white/70 px-2 py-0.5 rounded">
                      {item.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: HOME CARE GUIDELINES, EMERGENCY TIPS & CLINIC INFO */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Online Booking Banner */}
            <div className="bg-[#E3EEEC] border border-[#0F766E]/20 rounded-[22px] p-5 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CalendarCheck size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-bold text-[#0F766E]">
                    Agendamento Online 24 Horas
                  </h3>
                  <p className="text-[12px] text-[#24312E] mt-1 leading-relaxed">
                    Precisa de alívio rápido ou deseja garantir seu retorno preventivo? Escolha o horário sem complicação.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActivePortalTab('booking')}
                    className="mt-3 bg-[#0F766E] hover:bg-[#0B5D56] text-white px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <span>Agendar Nova Consulta</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Home Care Instructions (Orientações Domiciliares) */}
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[22px] p-5 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E4D8C4]/60 mb-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF3EC] text-[#5B7A63] flex items-center justify-center">
                  <HeartHandshake size={18} />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-[#24312E]">
                    Orientações de Cuidados Domiciliares
                  </h2>
                  <p className="text-[11.5px] text-[#5B665F]">
                    Prescrição de home care da Drª. Renata
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#FBF3E7] border border-[#E4D8C4]/50">
                  <div className="text-[12.5px] font-bold text-[#24312E] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    Higienização e Secagem
                  </div>
                  <p className="text-[12px] text-[#5B665F] mt-1 leading-relaxed pl-6.5">
                    Lavar o pé delicadamente com sabonete neutro ou antisséptico.
                    Secar muito bem com toalha limpa ou secador no ar frio.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FBF3E7] border border-[#E4D8C4]/50">
                  <div className="text-[12.5px] font-bold text-[#24312E] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    Cuidados com o Curativo
                  </div>
                  <p className="text-[12px] text-[#5B665F] mt-1 leading-relaxed pl-6.5">
                    Não molhar o curativo oclusivo nas primeiras 24 horas. Trocar a
                    gaze diariamente aplicando a pomada cicatrizante receitada.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FBF3E7] border border-[#E4D8C4]/50">
                  <div className="text-[12.5px] font-bold text-[#24312E] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    Calçados Recomendados
                  </div>
                  <p className="text-[12px] text-[#5B665F] mt-1 leading-relaxed pl-6.5">
                    Utilizar calçados abertos ou de bico largo e macio. Evitar sapatos
                    apertados ou de salto até a completa cicatrização.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FBF3E7] border border-[#E4D8C4]/50">
                  <div className="text-[12.5px] font-bold text-[#24312E] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[11px] font-bold flex items-center justify-center">
                      4
                    </span>
                    Não Tente Cortar em Casa
                  </div>
                  <p className="text-[12px] text-[#5B665F] mt-1 leading-relaxed pl-6.5">
                    Nunca tente cortar os cantos da unha ou retirar peles com alicates
                    caseiros. Isso pode reativar a inflamação.
                  </p>
                </div>
              </div>
            </div>

            {/* Sinais de Alerta */}
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[22px] p-5 shadow-2xs">
              <h3 className="text-[13.5px] font-bold text-[#B5542B] flex items-center gap-1.5 mb-2">
                <AlertCircle size={16} />
                Quando entrar em contato com a Podóloga:
              </h3>
              <ul className="text-[12px] text-[#5B665F] space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Dor pulsátil persistente que não cede com repouso;</li>
                <li>Presença de calor intenso ou vermelhidão que se expande;</li>
                <li>Sensação de sangramento ativo no curativo;</li>
                <li>Dúvidas sobre a troca de medicação tópica.</li>
              </ul>

              <div className="mt-4 pt-3 border-t border-[#E4D8C4]/60">
                <a
                  href="https://wa.me/5511998765432"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#FFFDF9] hover:bg-[#F3E6D2] border border-[#E4D8C4] py-2.5 rounded-xl text-xs font-semibold text-[#0F766E] flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare size={14} />
                  <span>Plantão de Dúvidas via WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Clinic Location & Hours */}
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[22px] p-5 shadow-2xs">
              <h3 className="text-[13.5px] font-bold text-[#24312E] flex items-center gap-1.5 mb-3">
                <MapPin size={16} className="text-[#0F766E]" />
                Localização do Consultório
              </h3>

              <div className="text-[12.5px] text-[#5B665F] space-y-2">
                <div>
                  <b className="text-[#24312E] block">Clínica Cuidar+ Saúde</b>
                  <span>Av. Paulista, 1000 — Conjunto 304, Bela Vista, São Paulo</span>
                </div>
                <div>
                  <b className="text-[#24312E] block">Horário de Funcionamento:</b>
                  <span>Segunda a Sexta: 08:30 às 18:30 · Sábado: 08:30 às 13:00</span>
                </div>
                <div>
                  <b className="text-[#24312E] block">Biossegurança:</b>
                  <span className="text-[#5B7A63] font-medium">
                    Autoclave Hospitalar aprovada · Material 100% esterilizado e descartável
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </main>

      {/* Footer matching user's SaaS reference */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-4 text-center text-[12px] text-[#55695E] border-t border-[#E4D8C4]/60 mt-8 w-full">
        <p>
          © 2026 CuidarX Podologia Clínica. Todos os direitos reservados. • Desenvolvido por <b>Luan Estifer Rodrigues Pereira</b> (Software Engineer).
        </p>
      </footer>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-[#24312E]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center mx-auto mb-3">
              <QrCode size={26} />
            </div>
            <h3 className="font-fraunces text-[18px] font-bold text-[#24312E]">
              QR Code do Paciente
            </h3>
            <p className="text-[12.5px] text-[#5B665F] mt-1 mb-4">
              Aponte a câmera do celular para abrir a Área do Cliente no endereço:{' '}
              <b className="text-[#0F766E]">{clientUrl}</b>
            </p>

            {/* QR Code Image */}
            <div className="bg-white p-4 rounded-2xl border border-[#E4D8C4] inline-block shadow-inner mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  clientUrl
                )}`}
                alt="QR Code da Área do Cliente CuidarX"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 bg-[#0F766E] hover:bg-[#0B5D56] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copiado!' : 'Copiar link'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 bg-[#FBF3E7] hover:bg-[#F3E6D2] border border-[#E4D8C4] text-[#24312E] py-2.5 rounded-xl text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
