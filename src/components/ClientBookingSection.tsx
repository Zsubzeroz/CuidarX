import React, { useState } from 'react';
import { Appointment, Patient, Professional } from '../types';
import { INITIAL_PROFESSIONALS } from '../data/mockProfessionals';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  AlertCircle,
  FileText,
  CalendarPlus,
  MessageSquare,
  ArrowRight,
  Check,
  Activity,
  HeartHandshake,
  MapPin,
  Search,
  X,
  Heart,
  Star,
  UserCheck,
} from 'lucide-react';
import { Avatar } from './Avatar';

interface ProcedureOption {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: string;
  numericPrice: number;
  description: string;
  recommendedFor?: string;
  badge?: string;
}

const PROCEDURES: ProcedureOption[] = [
  {
    id: 'podologia-geral',
    name: 'Podologia Geral & Higienização Completa',
    category: 'Manutenção da Saúde',
    duration: '45 min',
    price: 'R$ 150,00',
    numericPrice: 150,
    description: 'Corte profilático correto das unhas, limpeza de sulcos periungueais, desbaste de ceratoses e hidratação profunda.',
    recommendedFor: 'Rotina mensal preventiva e corte técnico seguro',
  },
  {
    id: 'unha-encravada',
    name: 'Tratamento de Onicocriptose (Unha Encravada)',
    category: 'Procedimento Clínico',
    duration: '50 min',
    price: 'R$ 160,00',
    numericPrice: 160,
    description: 'Desobstrução técnica e alívio imediato da espícula ungueal, assepsia antisséptica e curativo oclusivo.',
    recommendedFor: 'Dor aguda no canto da unha, vermelhidão ou inchaço',
    badge: 'Mais procurado',
  },
  {
    id: 'pe-diabetico',
    name: 'Avaliação & Podogeriatria (Pé Diabético)',
    category: 'Atenção Especial',
    duration: '50 min',
    price: 'R$ 150,00',
    numericPrice: 150,
    description: 'Rastreio de sensibilidade com monofilamento de Semmes-Weinstein, corte seguro sem lâminas cortantes e hidratação preventiva.',
    recommendedFor: 'Pacientes com diabetes tipo 1 ou 2, idosos e circulação delicada',
    badge: 'Protocolo de Segurança',
  },
  {
    id: 'ortese',
    name: 'Tratamento de Órtese Ungueal',
    category: 'Correção Biomecânica',
    duration: '40 min',
    price: 'R$ 120,00',
    numericPrice: 120,
    description: 'Aplicação de órtese metálica ou de fibra com memória elástica para correção da curvatura das lâminas ungueais.',
    recommendedFor: 'Unhas muito curvas (em telha ou funil) que encravam com frequência',
  },
  {
    id: 'verruga-plantar',
    name: 'Tratamento de Verruga Plantar (Olho de Peixe)',
    category: 'Tecnologia Aplicada',
    duration: '45 min',
    price: 'R$ 180,00',
    numericPrice: 180,
    description: 'Cauterização com laser terapêutico de baixa intensidade e queratolítico seguro sem dor ou sangramento.',
    recommendedFor: 'Lesões plantares dolorosas ao pisar com pontinhos escuros',
  },
  {
    id: 'calos-fissuras',
    name: 'Tratamento de Calosidades & Fissuras no Calcâneo',
    category: 'Dermatopodologia',
    duration: '45 min',
    price: 'R$ 130,00',
    numericPrice: 130,
    description: 'Desbastamento indolor de calosidades de atrito e oclusão emoliente com ureia de alta densidade.',
    recommendedFor: 'Dores ao pisar e calcanhares ásperos ou rachados',
  },
];

interface ClientBookingSectionProps {
  currentPatient?: Patient;
  existingAppointments: Appointment[];
  professionals?: Professional[];
  onBookAppointment: (appointment: Appointment) => void;
  onViewRecord?: () => void;
  initialPhone?: string;
}

export const ClientBookingSection: React.FC<ClientBookingSectionProps> = ({
  currentPatient,
  existingAppointments,
  professionals = INITIAL_PROFESSIONALS,
  onBookAppointment,
  onViewRecord,
  initialPhone,
}) => {
  // Stepper state: 1: Dados | 2: Procedimento | 3: Data e Horário
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Professional selection (User's core requirement: "o cliente escolheria qual profissional ele quer antes de agendar")
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('any');

  // Step 1: Patient Details
  const [patientName, setPatientName] = useState(currentPatient?.name || '');
  const [phone, setPhone] = useState(initialPhone || currentPatient?.phone || '');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');
  const [hasDiabetes, setHasDiabetes] = useState<boolean>(currentPatient?.isDiabetic || false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!patientName.trim()) e.patientName = 'Preencha o nome completo';
    if (!phone.trim()) e.phone = 'Preencha o celular / WhatsApp';
    if (!birthDate.trim()) e.birthDate = 'Preencha a data de nascimento';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const step1Valid = patientName.trim() && phone.trim() && birthDate.trim();

  // Step 2: Procedure selection
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([
    currentPatient?.condition?.toLowerCase().includes('diabét')
      ? 'pe-diabetico'
      : 'unha-encravada',
  ]);

  // Step 3: Date, Time & Notes
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(today);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    // Tomorrow by default
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Skip sunday
    return d.toISOString().split('T')[0];
  });
  const [selectedShift, setSelectedShift] = useState<'morning' | 'afternoon'>('morning');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('09:30');
  const [patientNotes, setPatientNotes] = useState<string>('');

  // Booking result voucher
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);

  // Consultar Agendamento Modal
  const [isLookupModalOpen, setIsLookupModalOpen] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookedUpAppointments, setLookedUpAppointments] = useState<Appointment[] | null>(null);

  const selectedProfessional =
    selectedProfessionalId === 'any'
      ? null
      : professionals.find((p) => p.id === selectedProfessionalId) || null;

  const toggleProcedure = (id: string) => {
    setSelectedProcedureIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((p) => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectedProceduresList = PROCEDURES.filter((p) =>
    selectedProcedureIds.includes(p.id)
  );

  const totalPrice = selectedProceduresList.reduce((acc, p) => acc + p.numericPrice, 0);

  // Available Time Slots for Shift
  const MORNING_SLOTS = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  const AFTERNOON_SLOTS = ['13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

  // Calendar generation for current month
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayNum: number) => {
    const d = new Date(year, month, dayNum);
    // Sunday is blocked
    if (d.getDay() === 0) return;
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDateStr(formatted);
  };

  const handleConfirmBooking = () => {
    if (!patientName.trim() || !phone.trim() || !birthDate.trim()) {
      setCurrentStep(1);
      validateStep1();
      return;
    }

    if (!selectedDateStr || !selectedTimeSlot) {
      return;
    }

    const procedureNames = selectedProceduresList.map((p) => p.name).join(' + ');

    // Selected professional
    const assignedProf = selectedProfessional || professionals[0];

    // Format display date
    const [y, m, d] = selectedDateStr.split('-');
    const displayDate = `${d} de ${monthNames[parseInt(m, 10) - 1]}`;

    const newAppointment: Appointment = {
      id: `online-${Date.now()}`,
      time: selectedTimeSlot,
      patientId: currentPatient?.id || `pat-${Date.now()}`,
      patientName: patientName.trim(),
      condition: `${procedureNames} (Online)`,
      status: 'confirmed',
      type: procedureNames,
      date: displayDate,
      phone: phone.trim() || undefined,
      notes: [
        patientNotes.trim(),
        hasDiabetes ? '⚠️ Paciente possui Diabetes' : null,
        `Gênero: ${gender}`,
        birthDate ? `Nascimento: ${birthDate}` : null,
      ].filter(Boolean).join(' • '),
      bookedOnline: true,
      price: `R$ ${totalPrice},00`,
      duration: `${selectedProceduresList.length * 45} min`,
      professionalId: assignedProf.id,
      professionalName: assignedProf.name,
      professionalAvatar: assignedProf.avatar,
    };

    onBookAppointment(newAppointment);
    setBookingSuccess(newAppointment);
  };

  // WhatsApp Message Generator
  const getWhatsAppClinicUrl = (app: Appointment) => {
    const profText = app.professionalName ? `👩‍⚕️ Profissional: ${app.professionalName}\n` : '';
    const msg = `Olá! Realizei meu agendamento online na CuidarX:\n\n👤 Paciente: ${app.patientName}\n📅 Data: ${app.date}\n⏰ Horário: ${app.time}\n🦶 Procedimento: ${app.type}\n💰 Total: ${app.price}\n${profText}💬 Observações: ${app.notes || 'Sem observações adicionais'}\n\nPodem me enviar a confirmação?`;
    return `https://wa.me/5519997222694?text=${encodeURIComponent(msg)}`;
  };

  // Search appointments by WhatsApp phone
  const handleLookupSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = lookupPhone.replace(/\D/g, '');
    if (!cleanQuery) return;

    const results = existingAppointments.filter((app) => {
      const appPhone = (app.phone || '').replace(/\D/g, '');
      return appPhone.includes(cleanQuery) || cleanQuery.includes(appPhone);
    });
    setLookedUpAppointments(results);
  };

  // ================= RENDER CONFIRMATION SUCCESS =================
  if (bookingSuccess) {
    return (
      <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[28px] p-6 sm:p-9 shadow-md text-center max-w-2xl mx-auto my-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-[#133023] text-[#4ADE80] border-2 border-[#214D39] flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 size={36} />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0F766E] bg-[#E3EEEC] px-3.5 py-1 rounded-full inline-block mb-2">
          Agendamento Confirmado
        </span>

        <h2 className="font-fraunces text-[24px] sm:text-[28px] font-medium text-[#14261C] mb-2">
          Consulta Reservada com Sucesso!
        </h2>

        <p className="text-[13.5px] text-[#55695E] max-w-md mx-auto mb-6">
          Obrigado, <strong className="text-[#14261C]">{bookingSuccess.patientName}</strong>! Sua vaga foi garantida no sistema da clínica.
        </p>

        {/* Voucher card matching user's reference */}
        <div className="bg-[#FBF7F0] border border-[#E4D8C4] rounded-2xl p-5 text-left mb-6 space-y-3.5 shadow-inner">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#E4D8C4]/80">
            <div>
              <span className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider block">
                Procedimento Escolhido
              </span>
              <span className="font-bold text-[15px] text-[#14261C]">
                {bookingSuccess.type}
              </span>
            </div>
            <span className="text-[13px] font-bold px-3 py-1 rounded-xl bg-white border border-[#E4D8C4] text-[#0F766E] shadow-2xs">
              {bookingSuccess.price}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
            <div>
              <span className="text-[#6B7280] block text-[11px] uppercase font-semibold">Data & Horário</span>
              <span className="font-bold text-[#14261C] flex items-center gap-1.5 mt-0.5">
                <Calendar size={14} className="text-[#0F766E]" />
                {bookingSuccess.date} às {bookingSuccess.time}
              </span>
            </div>

            <div>
              <span className="text-[#6B7280] block text-[11px] uppercase font-semibold">Profissional Responsável</span>
              <div className="flex items-center gap-2 mt-0.5">
                {bookingSuccess.professionalAvatar && (
                  <img
                    src={bookingSuccess.professionalAvatar}
                    alt={bookingSuccess.professionalName || ''}
                    className="w-5 h-5 rounded-full object-cover border border-[#0F766E]"
                  />
                )}
                <span className="font-bold text-[#14261C]">
                  {bookingSuccess.professionalName || 'Podóloga Titular'}
                </span>
              </div>
            </div>
          </div>

          {bookingSuccess.notes && (
            <div className="pt-2 border-t border-[#E4D8C4]/60 text-[12px] text-[#55695E]">
              <span className="font-semibold text-[#14261C]">Detalhes Clínicos:</span> {bookingSuccess.notes}
            </div>
          )}
        </div>

        {/* WhatsApp Button CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={getWhatsAppClinicUrl(bookingSuccess)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[13.5px] font-bold shadow-sm transition-all"
          >
            <MessageSquare size={17} />
            Enviar Confirmação no WhatsApp
          </a>

          <button
            type="button"
            onClick={() => {
              setBookingSuccess(null);
              setCurrentStep(1);
            }}
            className="px-5 py-3 rounded-xl bg-white border border-[#E4D8C4] text-[#14261C] hover:bg-[#FAF8F5] text-[13px] font-semibold transition-all"
          >
            Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 my-4">
      {/* PROFESSIONAL SELECTION HERO (USER DIRECTIVE: "o cliente escolheria qual profissional ele quer antes de agendar") */}
      <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#14261C] uppercase tracking-wider">
                Profissional de Preferência
              </h3>
              <p className="text-[12px] text-[#55695E]">
                Escolha com qual podólogo(a) da clínica você gostaria de se consultar:
              </p>
            </div>
          </div>

          {selectedProfessional && (
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E3EEEC] text-[#0F766E]">
              Selecionado(a)
            </span>
          )}
        </div>

        {/* Professional Cards Carousel / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Option: Qualquer Profissional (Fastest) */}
          <button
            type="button"
            onClick={() => setSelectedProfessionalId('any')}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              selectedProfessionalId === 'any'
                ? 'bg-[#133023] text-white border-[#133023] ring-2 ring-[#0F766E]/40 shadow-xs'
                : 'bg-[#FAF8F5] border-[#E4D8C4] text-[#14261C] hover:border-[#0F766E] hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] ${
                  selectedProfessionalId === 'any'
                    ? 'bg-[#214D39] text-[#4ADE80]'
                    : 'bg-[#E3EEEC] text-[#0F766E]'
                }`}
              >
                ⚡
              </div>
              <div className="min-w-0">
                <div
                  className={`font-bold text-[12.5px] truncate ${
                    selectedProfessionalId === 'any' ? 'text-white' : 'text-[#14261C]'
                  }`}
                >
                  Sem Preferência
                </div>
                <div
                  className={`text-[10px] leading-tight ${
                    selectedProfessionalId === 'any' ? 'text-[#A7F3D0]' : 'text-[#55695E]'
                  }`}
                >
                  Primeiro disponível
                </div>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                selectedProfessionalId === 'any'
                  ? 'bg-[#214D39] text-[#E4D8C4]'
                  : 'bg-[#E4D8C4]/60 text-[#55695E]'
              }`}
            >
              Mais horários livres
            </span>
          </button>

          {/* Real Clinic Professionals */}
          {professionals.map((prof) => {
            const isSelected = selectedProfessionalId === prof.id;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => setSelectedProfessionalId(prof.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between relative ${
                  isSelected
                    ? 'bg-[#133023] text-white border-[#133023] ring-2 ring-[#0F766E]/40 shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E4D8C4] text-[#14261C] hover:border-[#0F766E] hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0">
                    <Avatar
                      src={prof.avatar}
                      name={prof.name}
                      size="md"
                      rounded="full"
                      borderColor="border-2 border-white/60"
                    />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#4ADE80] text-black rounded-full flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-bold text-[12.5px] truncate ${
                        isSelected ? 'text-white' : 'text-[#14261C]'
                      }`}
                    >
                      {prof.name.replace('Dra. ', '').replace('Dr. ', '')}
                    </div>
                    <div
                      className={`text-[10.5px] truncate font-medium ${
                        isSelected ? 'text-[#A7F3D0]' : 'text-[#0F766E]'
                      }`}
                    >
                      {prof.title.split('&')[0]}
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-black/10 flex items-center justify-between text-[10px]">
                  <span
                    className={isSelected ? 'text-[#D1FAE5]' : 'text-[#6B7280]'}
                  >
                    ⭐ {prof.rating || '4.9'}
                  </span>
                  <span
                    className={`font-semibold ${
                      isSelected ? 'text-[#4ADE80]' : 'text-[#0F766E]'
                    }`}
                  >
                    {isSelected ? 'Escolhido' : 'Selecionar'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN BOOKING CARD (MATCHING USER'S SCREENSHOT 10 & 11) */}
      <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[28px] shadow-sm overflow-hidden">
        {/* Deep Emerald Header with Stepper */}
        <div className="bg-[#133023] text-[#FFFDF9] px-6 py-5 border-b border-[#214D39]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#4ADE80]">
                  Agendamento Online
                </span>
                {selectedProfessional && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#214D39] text-[#A7F3D0]">
                    com {selectedProfessional.name}
                  </span>
                )}
              </div>
              <h2 className="text-[20px] font-fraunces font-medium text-[#FFFDF9] leading-tight mt-0.5">
                Passo {currentStep} de 3 —{' '}
                {currentStep === 1
                  ? 'Dados do Paciente'
                  : currentStep === 2
                  ? 'Escolha do Procedimento'
                  : 'Data e Horário'}
              </h2>
            </div>

            {/* Stepper pills */}
            <div className="flex items-center gap-1.5 self-start sm:self-center bg-[#214D39] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all ${
                  currentStep === 1
                    ? 'bg-[#4ADE80] text-[#133023]'
                    : 'text-[#E4D8C4] hover:text-white'
                }`}
              >
                1. Dados
              </button>
              <button
                type="button"
                onClick={() => {
                  if (step1Valid) { setErrors({}); setCurrentStep(2); }
                  else validateStep1();
                }}
                className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all ${
                  currentStep === 2
                    ? 'bg-[#4ADE80] text-[#133023]'
                    : 'text-[#E4D8C4] hover:text-white'
                }`}
              >
                2. Procedimento
              </button>
              <button
                type="button"
                onClick={() => {
                  if (step1Valid) { setErrors({}); setCurrentStep(3); }
                  else validateStep1();
                }}
                className={`px-3 py-1 rounded-lg text-[11.5px] font-bold transition-all ${
                  currentStep === 3
                    ? 'bg-[#4ADE80] text-[#133023]'
                    : 'text-[#E4D8C4] hover:text-white'
                }`}
              >
                3. Data
              </button>
            </div>
          </div>
        </div>

        {/* STEP 1: DADOS DO PACIENTE (MATCHING SCREENSHOT 1) */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5">
                NOME COMPLETO *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Roberto Carlos"
                value={patientName}
                onChange={(e) => { setPatientName(e.target.value); clearError('patientName'); }}
                className={`w-full bg-[#FAF8F5] border rounded-xl px-4 py-3 text-[14px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 ${
                  errors.patientName
                    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
                    : 'border-[#E4D8C4] focus:border-[#0F766E] focus:ring-[#0F766E]'
                }`}
              />
              {errors.patientName && (
                <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{errors.patientName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5">
                  CELULAR / WHATSAPP *
                </label>
                <input
                  type="text"
                  required
                  placeholder="(11) 98888-7777"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearError('phone'); }}
                  className={`w-full bg-[#FAF8F5] border rounded-xl px-4 py-3 text-[14px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 ${
                    errors.phone
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
                      : 'border-[#E4D8C4] focus:border-[#0F766E] focus:ring-[#0F766E]'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5">
                  DATA DE NASCIMENTO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="DD/MM/AAAA"
                  value={birthDate}
                  onChange={(e) => { setBirthDate(e.target.value); clearError('birthDate'); }}
                  className={`w-full bg-[#FAF8F5] border rounded-xl px-4 py-3 text-[14px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 ${
                    errors.birthDate
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
                      : 'border-[#E4D8C4] focus:border-[#0F766E] focus:ring-[#0F766E]'
                  }`}
                />
                {errors.birthDate ? (
                  <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{errors.birthDate}</p>
                ) : (
                  <span className="text-[11px] text-[#6B7280] mt-1 block">
                    Formato: dia/mês/ano
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5">
                GÊNERO
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-4 py-3 text-[14px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro / Prefiro não declarar</option>
              </select>
            </div>

            {/* DIABETES SAFETY TOGGLE CARD (EXACTLY AS IN SCREENSHOT 1) */}
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 mt-0.5">
                  <Heart size={20} className="fill-[#DC2626]" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px] text-[#14261C] leading-snug">
                    Paciente possui Diabetes?
                  </h4>
                  <p className="text-[12px] text-[#55695E] mt-0.5 leading-relaxed">
                    Essa informação ajuda a preparar o atendimento com segurança.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={hasDiabetes}
                onClick={() => setHasDiabetes(!hasDiabetes)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasDiabetes ? 'bg-[#DC2626]' : 'bg-[#D1D5DB]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    hasDiabetes ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Action button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={!step1Valid}
                onClick={() => {
                  if (validateStep1()) {
                    setErrors({});
                    setCurrentStep(2);
                  }
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#133023] hover:bg-[#1A402F] text-white text-[14px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
              >
                Continuar
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ESCOLHA DO PROCEDIMENTO (MATCHING SCREENSHOT 10) */}
        {currentStep === 2 && (
          <div className="p-6 sm:p-8 space-y-4">
            <p className="text-[13px] text-[#55695E]">
              Selecione um ou mais procedimentos que deseja realizar:
            </p>

            <div className="space-y-3">
              {PROCEDURES.map((proc) => {
                const isSelected = selectedProcedureIds.includes(proc.id);
                return (
                  <div
                    key={proc.id}
                    onClick={() => toggleProcedure(proc.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#E3EEEC]/50 border-[#0F766E] ring-1 ring-[#0F766E] shadow-2xs'
                        : 'bg-[#FAF8F5] border-[#E4D8C4] hover:border-[#0F766E]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-colors ${
                          isSelected
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : 'border-[#9CA3AF] bg-white'
                        }`}
                      >
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[14.5px] text-[#14261C]">
                            {proc.name}
                          </h4>
                          {proc.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-[#E3EEEC] text-[#0F766E] text-[10px] font-bold">
                              {proc.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-[#55695E] mt-0.5 max-w-xl">
                          {proc.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#6B7280] mt-2">
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-[#0F766E]" />
                            {proc.duration}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-[#6B7280] block">a partir de</span>
                      <span className="text-[14.5px] font-bold text-[#0F766E]">
                        {proc.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom summary bar */}
            <div className="pt-4 border-t border-[#E4D8C4] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <span className="text-[12px] text-[#55695E] block">
                  {selectedProcedureIds.length} procedimento(s) selecionado(s)
                </span>
                <span className="text-[18px] font-bold text-[#14261C]">
                  Total: <span className="text-[#0F766E]">R$ {totalPrice},00</span>
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3 rounded-xl border border-[#E4D8C4] text-[#55695E] hover:bg-[#FAF8F5] text-[13px] font-semibold"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 sm:flex-none px-7 py-3 rounded-xl bg-[#133023] hover:bg-[#1A402F] text-white text-[13.5px] font-bold shadow-sm flex items-center justify-center gap-2"
                >
                  Avançar para Data
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DATA E HORÁRIO (MATCHING SCREENSHOT 11) */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Yellow notice box */}
            <div className="bg-[#FEF9C3] border border-[#FDE047] text-[#854D0E] rounded-2xl p-4 flex items-start gap-3 text-[12.5px] leading-relaxed">
              <span className="text-[16px] shrink-0">⚠️</span>
              <div>
                <strong className="font-bold">Agendamento com 24h de antecedência.</strong> Para agendamentos no mesmo dia ou encaixes de urgência, entre em contato diretamente pelo WhatsApp da clínica.
              </div>
            </div>

            {/* Month Calendar Component */}
            <div className="bg-[#FAF8F5] border border-[#E4D8C4] rounded-2xl p-4 sm:p-5">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-fraunces text-[16px] font-semibold text-[#14261C]">
                  {monthNames[month]} {year}
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-lg bg-white border border-[#E4D8C4] flex items-center justify-center text-[#14261C] hover:bg-[#FAF8F5]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-8 h-8 rounded-lg bg-white border border-[#E4D8C4] flex items-center justify-center text-[#14261C] hover:bg-[#FAF8F5]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
                <span>Dom</span>
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {/* Empty cells before month start */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-9" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isSelected = selectedDateStr === dateStr;
                  const checkDate = new Date(year, month, dayNum);
                  const isSunday = checkDate.getDay() === 0;
                  const isPast = checkDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                  const disabled = isSunday || isPast;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDaySelect(dayNum)}
                      className={`h-9 sm:h-10 rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#133023] text-white shadow-xs font-extrabold'
                          : disabled
                          ? 'text-[#D1D5DB] cursor-not-allowed bg-transparent'
                          : 'bg-white text-[#14261C] border border-[#E4D8C4]/60 hover:border-[#0F766E] hover:bg-[#E3EEEC]/40'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shifts: Manhã / Tarde */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSelectedShift('morning')}
                  className={`px-4 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 transition-all ${
                    selectedShift === 'morning'
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#55695E] border border-[#E4D8C4]'
                  }`}
                >
                  ☀️ Manhã
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShift('afternoon')}
                  className={`px-4 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-1.5 transition-all ${
                    selectedShift === 'afternoon'
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#55695E] border border-[#E4D8C4]'
                  }`}
                >
                  🌤️ Tarde
                </button>
              </div>

              {/* Time slots grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(selectedShift === 'morning' ? MORNING_SLOTS : AFTERNOON_SLOTS).map((slot) => {
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                        isSelected
                          ? 'bg-[#133023] text-white ring-2 ring-[#0F766E] shadow-xs'
                          : 'bg-white text-[#14261C] border border-[#E4D8C4] hover:border-[#0F766E]'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5">
                OBSERVAÇÕES (OPCIONAL)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Sentindo queimação na planta do pé ao caminhar, dor no canto da unha direita..."
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-4 py-2.5 text-[13px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            {/* Navigation buttons */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-3 rounded-xl border border-[#E4D8C4] text-[#55695E] hover:bg-[#FAF8F5] text-[13px] font-semibold"
              >
                ← Voltar
              </button>
              <button
                type="button"
                disabled={!step1Valid || !selectedDateStr || !selectedTimeSlot}
                onClick={handleConfirmBooking}
                className="px-8 py-3.5 rounded-xl bg-[#133023] hover:bg-[#1A402F] text-white text-[14px] font-bold shadow-md flex items-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                Confirmar Agendamento
                <CheckCircle2 size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BANNER: "Já agendou e esqueceu a data? Consultar seu agendamento →" (MATCHING SCREENSHOT 1 & 12) */}
      <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-2xs">
        <div>
          <span className="text-[13px] text-[#55695E]">Já agendou e esqueceu a data da sua consulta?</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsLookupModalOpen(true);
            setLookedUpAppointments(null);
          }}
          className="text-[13px] font-bold text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
        >
          Consultar seu agendamento →
        </button>
      </div>

      {/* MODAL: CONSULTAR AGENDAMENTO (MATCHING SCREENSHOT 12) */}
      {isLookupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4D8C4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center">
                  <Search size={16} />
                </div>
                <h3 className="font-fraunces text-[18px] font-semibold text-[#14261C]">
                  Consultar Agendamento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLookupModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#55695E] flex items-center justify-center hover:bg-[#E4D8C4]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLookupSearch} className="mt-4 space-y-3">
              <label className="block text-[11.5px] font-bold text-[#14261C] uppercase tracking-wider">
                Celular / WhatsApp Cadastrado
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="(19) 99722-2694"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  className="flex-1 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3.5 py-2.5 text-[13.5px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-bold"
                >
                  Buscar
                </button>
              </div>
            </form>

            {/* Results */}
            {lookedUpAppointments !== null && (
              <div className="mt-5 space-y-3 max-h-64 overflow-y-auto">
                {lookedUpAppointments.length === 0 ? (
                  <div className="text-center py-6 bg-[#FAF8F5] rounded-xl border border-[#E4D8C4] text-[13px] text-[#55695E]">
                    Nenhum agendamento encontrado para este número. Verifique os dígitos ou realize um novo agendamento.
                  </div>
                ) : (
                  lookedUpAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl text-[12.5px] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#14261C] text-[13.5px]">
                          {app.type}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#E3EEEC] text-[#0F766E] text-[10px] font-bold">
                          {app.status === 'completed' ? 'Realizado' : 'Confirmado'}
                        </span>
                      </div>
                      <div className="text-[#55695E]">
                        📅 <strong>{app.date}</strong> às <strong>{app.time}</strong>
                      </div>
                      {app.professionalName && (
                        <div className="text-[#55695E]">
                          👩‍⚕️ Profissional: <strong>{app.professionalName}</strong>
                        </div>
                      )}
                      <div className="pt-2 border-t border-[#E4D8C4]/60 flex justify-end">
                        <a
                          href={getWhatsAppClinicUrl(app)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#25D366] hover:underline flex items-center gap-1"
                        >
                          <MessageSquare size={13} />
                          Enviar comprovante no WhatsApp
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#E4D8C4] text-center">
              <button
                type="button"
                onClick={() => setIsLookupModalOpen(false)}
                className="text-[12px] font-semibold text-[#0F766E] hover:underline"
              >
                ← Voltar ao agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING WHATSAPP BUTTON (MATCHING USER'S SCREENSHOT 1) */}
      <a
        href="https://wa.me/5519997222694?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20o%20atendimento%20podol%C3%B3gico%20na%20CuidarX."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Atendimento via WhatsApp"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        <MessageSquare size={28} />
      </a>
    </div>
  );
};
