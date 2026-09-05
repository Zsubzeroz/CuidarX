import React, { useState, useEffect } from 'react';
import { Appointment, Professional, Patient } from '../types';
import { INITIAL_PROFESSIONALS } from '../data/mockProfessionals';
import {
  Clock,
  CalendarCheck,
  CheckCircle2,
  User,
  ChevronRight,
  Plus,
  Globe,
  Calendar,
  Filter,
  UserCheck,
  AlertCircle,
  X,
  Lock,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface AgendaTabProps {
  appointments: Appointment[];
  patients?: Patient[];
  professionals?: Professional[];
  currentProfessional?: Professional | null;
  onSelectPatient: (patientId: string) => void;
  onUpdateStatus?: (id: string, nextStatus: Appointment['status']) => void;
  onAddAppointment?: (appointment: Appointment) => void;
  onOpenLoginModal?: () => void;
}

export const AgendaTab: React.FC<AgendaTabProps> = ({
  appointments: initialAppointments,
  patients = [],
  professionals = INITIAL_PROFESSIONALS,
  currentProfessional,
  onSelectPatient,
  onUpdateStatus,
  onAddAppointment,
  onOpenLoginModal,
}) => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'blocks'>('all');
  
  // Professional filter (Filter by all or specific professional)
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>(
    currentProfessional ? currentProfessional.id : 'all'
  );

  // "+ Criar" modal (Screenshots 13 & 14: Consulta vs Bloqueio)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'consulta' | 'bloqueio'>('consulta');

  // Form: Consulta
  const [cPatientName, setCPatientName] = useState('');
  const [cPatientPhone, setCPatientPhone] = useState('');
  const [cDate, setCDate] = useState('26 de Maio');
  const [cTime, setCTime] = useState('14:00');
  const [cPrice, setCPrice] = useState('R$ 150,00');
  const [cService, setCService] = useState('Podologia Geral & Higienização Completa');
  const [cProfId, setCProfId] = useState(currentProfessional ? currentProfessional.id : professionals[0]?.id || '');
  const [cNotes, setCNotes] = useState('');

  // Form: Bloqueio (Screenshot 14)
  const [bProfId, setBProfId] = useState(currentProfessional ? currentProfessional.id : professionals[0]?.id || '');
  const [bReason, setBReason] = useState('Almoço');
  const [bCustomReason, setBCustomReason] = useState('');
  const [bColor, setBColor] = useState('#DC2626');
  const [bDate, setBDate] = useState('26 de Maio');
  const [bAllDay, setBAllDay] = useState(false);
  const [bStartTime, setBStartTime] = useState('12:00');
  const [bEndTime, setBEndTime] = useState('13:30');
  const [bRepeat, setBRepeat] = useState(false);

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  const toggleStatus = (id: string) => {
    const target = appointments.find((a) => a.id === id);
    if (!target) return;
    const nextStatus =
      target.status === 'completed'
        ? 'confirmed'
        : target.status === 'confirmed'
        ? 'in_progress'
        : 'completed';

    if (onUpdateStatus) {
      onUpdateStatus(id, nextStatus);
    } else {
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: nextStatus } : app))
      );
    }
  };

  // Filter appointments
  const filtered = appointments.filter((app) => {
    // Professional filter
    if (selectedProfFilter !== 'all') {
      if (app.professionalId && app.professionalId !== selectedProfFilter) {
        return false;
      }
    }

    // Status / Block filter
    if (statusFilter === 'blocks') return app.isBlock;
    if (statusFilter === 'completed') return app.status === 'completed' && !app.isBlock;
    if (statusFilter === 'pending') return app.status !== 'completed' && !app.isBlock;
    return true;
  });

  // Handle Save Consulta
  const handleSaveConsulta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cPatientName.trim()) return;

    const assignedProf = professionals.find((p) => p.id === cProfId) || professionals[0];

    const newApp: Appointment = {
      id: `app-man-${Date.now()}`,
      time: cTime,
      patientId: `pat-${Date.now()}`,
      patientName: cPatientName.trim(),
      condition: cService,
      status: 'confirmed',
      type: cService,
      date: cDate,
      phone: cPatientPhone.trim() || undefined,
      price: cPrice,
      duration: '45 min',
      notes: cNotes.trim() || undefined,
      professionalId: assignedProf?.id,
      professionalName: assignedProf?.name,
      professionalAvatar: assignedProf?.avatar,
    };

    if (onAddAppointment) {
      onAddAppointment(newApp);
    } else {
      setAppointments((prev) => [newApp, ...prev]);
    }
    setIsCreateModalOpen(false);
    setCPatientName('');
    setCNotes('');
  };

  // Handle Save Bloqueio
  const handleSaveBloqueio = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedProf = professionals.find((p) => p.id === bProfId) || professionals[0];
    const finalReason = bReason === 'Outro' ? bCustomReason || 'Bloqueio de Horário' : bReason;
    const timeDisplay = bAllDay ? 'Dia Inteiro' : `${bStartTime} - ${bEndTime}`;

    const newBlock: Appointment = {
      id: `block-${Date.now()}`,
      time: timeDisplay,
      patientId: 'block',
      patientName: `[BLOQUEIO] ${finalReason}`,
      condition: finalReason,
      status: 'confirmed',
      type: `Bloqueio: ${finalReason}`,
      date: bDate,
      isBlock: true,
      blockReason: finalReason,
      blockColor: bColor,
      professionalId: assignedProf?.id,
      professionalName: assignedProf?.name,
      professionalAvatar: assignedProf?.avatar,
    };

    if (onAddAppointment) {
      onAddAppointment(newBlock);
    } else {
      setAppointments((prev) => [newBlock, ...prev]);
    }
    setIsCreateModalOpen(false);
  };

  const BLOCK_COLORS = [
    { label: 'Vermelho', hex: '#DC2626' },
    { label: 'Laranja', hex: '#EA580C' },
    { label: 'Amarelo', hex: '#CA8A04' },
    { label: 'Roxo', hex: '#7C3AED' },
    { label: 'Cinza', hex: '#4B5563' },
    { label: 'Ciano', hex: '#0891B2' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-24 no-scrollbar space-y-5">
      {/* Header Info matching user's SaaS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4D8C4]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-fraunces text-[22px] font-semibold text-[#14261C]">
              Minha Agenda
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E3EEEC] text-[#0F766E]">
              {filtered.length} agendamentos
            </span>
          </div>
          <p className="text-[13px] text-[#55695E] mt-0.5">
            Sexta-feira, 26 de Maio · Gestão integrada de consultas e bloqueios da equipe clínica
          </p>
        </div>

        {/* Action Button: + Criar Evento */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(true);
              setModalType('consulta');
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>+ Criar</span>
          </button>
        </div>
      </div>

      {/* MULTI-PROFESSIONAL FILTER BAR (User's core requirement) */}
      <div className="bg-[#FAF8F5] border border-[#E4D8C4] rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] font-bold text-[#14261C]">
          <Filter size={15} className="text-[#0F766E]" />
          <span>Filtrar por Profissional:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSelectedProfFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              selectedProfFilter === 'all'
                ? 'bg-[#14261C] text-white shadow-xs'
                : 'bg-white text-[#55695E] border border-[#E4D8C4] hover:bg-[#FAF8F5]'
            }`}
          >
            Todos da Clínica ({appointments.length})
          </button>

          {professionals.map((prof) => {
            const isSelected = selectedProfFilter === prof.id;
            const count = appointments.filter((a) => a.professionalId === prof.id).length;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => setSelectedProfFilter(prof.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
                  isSelected
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-white text-[#55695E] border border-[#E4D8C4] hover:bg-[#FAF8F5]'
                }`}
              >
                <img
                  src={prof.avatar}
                  alt={prof.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span>{prof.name.replace('Dra. ', '').replace('Dr. ', '')}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Filter pills */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#0F766E] text-white'
                : 'bg-[#FFFDF9] text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
              statusFilter === 'pending'
                ? 'bg-[#0F766E] text-white'
                : 'bg-[#FFFDF9] text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Pendentes
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
              statusFilter === 'completed'
                ? 'bg-[#0F766E] text-white'
                : 'bg-[#FFFDF9] text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Atendidos
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('blocks')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
              statusFilter === 'blocks'
                ? 'bg-[#DC2626] text-white'
                : 'bg-[#FFFDF9] text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Bloqueios
          </button>
        </div>

        {currentProfessional && (
          <div className="text-[11.5px] text-[#55695E] hidden md:flex items-center gap-1.5">
            <span>Você está logado como:</span>
            <strong className="text-[#0F766E] font-bold">{currentProfessional.name}</strong>
          </div>
        )}
      </div>

      {/* Appointment list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-[#FAF8F5] border border-[#E4D8C4] rounded-2xl">
            <Calendar size={32} className="mx-auto text-[#0F766E] mb-2 opacity-50" />
            <h3 className="font-fraunces text-[16px] text-[#14261C]">Nenhum evento para este filtro</h3>
            <p className="text-[12px] text-[#55695E] mt-1">
              Utilize o botão "+ Criar" para agendar uma consulta ou registrar um bloqueio de horário.
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            // Is it a blocked slot?
            if (item.isBlock) {
              return (
                <div
                  key={item.id}
                  style={{ borderLeftColor: item.blockColor || '#DC2626' }}
                  className="bg-[#FEF2F2] border border-[#FCA5A5] border-l-4 rounded-[18px] p-4 flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono font-bold text-[#DC2626] flex items-center gap-1">
                        <Lock size={12} />
                        {item.time}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#DC2626] text-white text-[10px] font-bold uppercase">
                        Bloqueio
                      </span>
                    </div>

                    <h4 className="font-bold text-[14.5px] text-[#991B1B]">
                      {item.blockReason || item.patientName}
                    </h4>

                    {item.professionalName && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#7F1D1D]">
                        {item.professionalAvatar && (
                          <img
                            src={item.professionalAvatar}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        )}
                        <span>{item.professionalName}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Normal appointment
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';

            return (
              <div
                key={item.id}
                className={`bg-[#FFFDF9] border rounded-[20px] p-4 flex flex-col justify-between transition-all hover:shadow-xs ${
                  isCompleted
                    ? 'border-[#0F766E]/40 bg-[#FAF8F5]'
                    : isInProgress
                    ? 'border-[#0F766E] ring-1 ring-[#0F766E]/30'
                    : 'border-[#E4D8C4]'
                }`}
              >
                <div>
                  {/* Top Bar with Time and Badges */}
                  <div className="flex items-center justify-between text-xs mb-2.5">
                    <span className="font-mono font-bold text-[#24312E] bg-[#FBF3E7] px-2.5 py-1 rounded-lg flex items-center gap-1 border border-[#E4D8C4]/60">
                      <Clock size={12} className="text-[#0F766E]" />
                      {item.time}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {item.bookedOnline && (
                        <span className="px-2 py-0.5 rounded-md bg-[#E3EEEC] text-[#0F766E] text-[10px] font-bold flex items-center gap-1 border border-[#0F766E]/30">
                          <Globe size={10} />
                          Online
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold ${
                          isCompleted
                            ? 'bg-[#E3EEEC] text-[#0F766E]'
                            : isInProgress
                            ? 'bg-[#FDF6B2] text-[#723B13]'
                            : 'bg-[#F3E6D2] text-[#24312E]'
                        }`}
                      >
                        {isCompleted ? 'Atendido' : isInProgress ? 'Em Sessão' : 'Aguardando'}
                      </span>
                    </div>
                  </div>

                  {/* Patient Name */}
                  <h4 className="font-bold text-[15px] text-[#24312E] leading-snug">
                    {item.patientName}
                  </h4>

                  {/* Procedure */}
                  <p className="text-[12.5px] text-[#5B665F] mt-0.5 line-clamp-1">
                    {item.condition}
                  </p>

                  {/* Assigned Professional Badge */}
                  {item.professionalName && (
                    <div className="flex items-center gap-1.5 mt-2 bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#E4D8C4]/60 w-fit">
                      {item.professionalAvatar ? (
                        <img
                          src={item.professionalAvatar}
                          alt=""
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <User size={12} className="text-[#0F766E]" />
                      )}
                      <span className="text-[11px] font-semibold text-[#14261C]">
                        {item.professionalName}
                      </span>
                    </div>
                  )}

                  {/* Price and Date info */}
                  <div className="flex items-center justify-between text-[11.5px] text-[#6B7280] mt-2.5 pt-2 border-t border-[#E4D8C4]/60">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-[#0F766E]" />
                      {item.date || 'Hoje'}
                    </span>
                    {item.price && (
                      <span className="font-bold text-[#0F766E]">
                        {item.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E4D8C4]/60">
                  <button
                    type="button"
                    onClick={() => toggleStatus(item.id)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                      isCompleted
                        ? 'text-[#0F766E] hover:bg-[#E3EEEC]'
                        : 'bg-[#0F766E] text-white hover:bg-[#0B5D56]'
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    {isCompleted ? 'Concluído' : 'Marcar Atendido'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectPatient(item.patientId)}
                    className="text-[11.5px] font-semibold text-[#5B665F] hover:text-[#0F766E] flex items-center gap-0.5"
                  >
                    Ver Prontuário
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL: + CRIAR (CONSULTA VS BLOQUEIO) ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14261C]/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#FFFDF9] border border-[#E4D8C4] rounded-[26px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#133023] text-white px-6 py-4 flex items-center justify-between border-b border-[#214D39]">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#A7F3D0]">
                  Novo Registro de Agenda
                </span>
                <h3 className="font-fraunces text-[18px] font-medium text-[#FFFDF9]">
                  {modalType === 'consulta' ? '🟢 Nova Consulta Clínica' : '🔴 Novo Bloqueio de Horário'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#214D39] text-[#E4D8C4] flex items-center justify-center hover:bg-[#2D664C]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Top switcher: Consulta Clínica vs Bloqueio (Screenshots 13 & 14) */}
            <div className="flex border-b border-[#E4D8C4] bg-[#FAF8F5] p-2 gap-2">
              <button
                type="button"
                onClick={() => setModalType('consulta')}
                className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  modalType === 'consulta'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-white text-[#55695E] border border-[#E4D8C4]'
                }`}
              >
                <span>🟢 Consulta Clínica</span>
              </button>
              <button
                type="button"
                onClick={() => setModalType('bloqueio')}
                className={`flex-1 py-2 rounded-xl text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  modalType === 'bloqueio'
                    ? 'bg-[#DC2626] text-white shadow-xs'
                    : 'bg-white text-[#55695E] border border-[#E4D8C4]'
                }`}
              >
                <span>🔴 Bloqueio de Horário</span>
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {modalType === 'consulta' ? (
                <form onSubmit={handleSaveConsulta} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                      Profissional Responsável *
                    </label>
                    <select
                      value={cProfId}
                      onChange={(e) => setCProfId(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5 text-[13px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                    >
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.title.split('&')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                      Paciente *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nome do paciente"
                      value={cPatientName}
                      onChange={(e) => setCPatientName(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5 text-[13px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                        Data
                      </label>
                      <input
                        type="text"
                        value={cDate}
                        onChange={(e) => setCDate(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                        Horário
                      </label>
                      <input
                        type="text"
                        value={cTime}
                        onChange={(e) => setCTime(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                        Valor (R$)
                      </label>
                      <input
                        type="text"
                        value={cPrice}
                        onChange={(e) => setCPrice(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="(19) 90000-0000"
                        value={cPatientPhone}
                        onChange={(e) => setCPatientPhone(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                      Serviço / Procedimento
                    </label>
                    <input
                      type="text"
                      value={cService}
                      onChange={(e) => setCService(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                      Observações
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Instruções ou queixas clínicas"
                      value={cNotes}
                      onChange={(e) => setCNotes(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E4D8C4] text-[13px] font-semibold text-[#55695E]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-bold shadow-sm"
                    >
                      Confirmar Consulta
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaveBloqueio} className="space-y-4">
                  {/* Bloqueio Form matching Screenshot 14 */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                      Profissional *
                    </label>
                    <select
                      value={bProfId}
                      onChange={(e) => setBProfId(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5 text-[13px] text-[#14261C] focus:outline-none focus:border-[#DC2626]"
                    >
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5">
                      Motivo do Bloqueio *
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {['Almoço', 'Médico', 'Férias', 'Feriado'].map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setBReason(reason)}
                          className={`py-2 rounded-xl text-[12px] font-bold transition-all ${
                            bReason === reason
                              ? 'bg-[#DC2626] text-white shadow-2xs'
                              : 'bg-[#FAF8F5] border border-[#E4D8C4] text-[#14261C] hover:bg-white'
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Outro motivo..."
                      value={bCustomReason}
                      onChange={(e) => {
                        setBCustomReason(e.target.value);
                        setBReason('Outro');
                      }}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                    />
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5">
                      Cor do Bloqueio
                    </label>
                    <div className="flex items-center gap-2">
                      {BLOCK_COLORS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setBColor(col.hex)}
                          style={{ backgroundColor: col.hex }}
                          className={`w-7 h-7 rounded-full transition-all ${
                            bColor === col.hex ? 'ring-3 ring-offset-2 ring-black/40 scale-110' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Date & All Day */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                        Data
                      </label>
                      <input
                        type="text"
                        value={bDate}
                        onChange={(e) => setBDate(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        id="allday"
                        checked={bAllDay}
                        onChange={(e) => setBAllDay(e.target.checked)}
                        className="w-4 h-4 rounded text-[#DC2626]"
                      />
                      <label htmlFor="allday" className="text-[12.5px] font-semibold text-[#14261C]">
                        Dia Inteiro
                      </label>
                    </div>
                  </div>

                  {!bAllDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                          Início
                        </label>
                        <input
                          type="text"
                          value={bStartTime}
                          onChange={(e) => setBStartTime(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                          Fim
                        </label>
                        <input
                          type="text"
                          value={bEndTime}
                          onChange={(e) => setBEndTime(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="repeat"
                      checked={bRepeat}
                      onChange={(e) => setBRepeat(e.target.checked)}
                      className="w-4 h-4 rounded text-[#DC2626]"
                    />
                    <label htmlFor="repeat" className="text-[12.5px] font-semibold text-[#14261C]">
                      Repetir este bloqueio semanalmente
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E4D8C4] text-[13px] font-semibold text-[#55695E]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] font-bold shadow-sm"
                    >
                      Confirmar Bloqueio
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
