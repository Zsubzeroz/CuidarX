import React, { useState, useEffect } from 'react';
import { Appointment, Professional, Patient } from '../types';
import { INITIAL_PROFESSIONALS } from '../data/mockProfessionals';
import { Avatar } from './Avatar';
import {
  Clock,
  CheckCircle2,
  Plus,
  Lock,
  X,
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
}) => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'blocks'>('all');
  const [selectedProfFilter, setSelectedProfFilter] = useState<string>(
    currentProfessional ? currentProfessional.id : 'all'
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'consulta' | 'bloqueio'>('consulta');

  const [cPatientName, setCPatientName] = useState('');
  const [cPatientPhone, setCPatientPhone] = useState('');
  const [cDate, setCDate] = useState('26 de Maio');
  const [cTime, setCTime] = useState('14:00');
  const [cPrice, setCPrice] = useState('R$ 150,00');
  const [cService, setCService] = useState('Podologia Geral & Higienização Completa');
  const [cProfId, setCProfId] = useState(currentProfessional ? currentProfessional.id : professionals[0]?.id || '');
  const [cNotes, setCNotes] = useState('');

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

  const filtered = appointments.filter((app) => {
    if (selectedProfFilter !== 'all') {
      if (app.professionalId && app.professionalId !== selectedProfFilter) return false;
    }
    if (statusFilter === 'blocks') return app.isBlock;
    if (statusFilter === 'completed') return app.status === 'completed' && !app.isBlock;
    if (statusFilter === 'pending') return app.status !== 'completed' && !app.isBlock;
    return true;
  });

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

  const getBadgeClass = (status: string, isBlock?: boolean) => {
    if (isBlock) return 'bg-red-100 text-red-700';
    if (status === 'completed') return 'bg-[#E3EEEC] text-[#0F766E]';
    if (status === 'in_progress') return 'bg-[#FDF6B2] text-[#723B13]';
    return 'bg-[#F3E6D2] text-[#8B5E1F]';
  };

  const getBadgeLabel = (status: string, isBlock?: boolean) => {
    if (isBlock) return 'Bloqueio';
    if (status === 'completed') return 'Atendido';
    if (status === 'in_progress') return 'Em sessão';
    return 'Aguardando';
  };

  const selectedProf = currentProfessional || professionals[0];

  return (
    <div className="flex-1 overflow-y-auto pt-3 pb-24 no-scrollbar max-w-[680px] mx-auto w-full px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="text-xs text-[#5B665F] mb-0.5">Sua agenda do dia</div>
          <h1 className="font-fraunces text-[22px] font-semibold text-[#24312E]">Minha agenda</h1>
        </div>
        <button
          type="button"
          onClick={() => { setIsCreateModalOpen(true); setModalType('consulta'); }}
          className="flex items-center gap-1.5 bg-[#0F766E] hover:bg-[#0B5D56] text-white border-none rounded-[10px] px-3.5 py-2.5 text-xs font-medium cursor-pointer transition-colors"
        >
          <Plus size={15} />
          Criar agendamento
        </button>
      </div>

      {/* Professional Bar */}
      {selectedProf && (
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#E4D8C4]">
          <Avatar
            src={selectedProf.avatar}
            name={selectedProf.name}
            size="sm"
            rounded="full"
          />
          <div>
            <div className="text-xs font-medium text-[#24312E]">{selectedProf.name}</div>
            <div className="text-[11px] text-[#5B665F]">{filtered.length} agendamentos</div>
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-1.5 mb-5">
        {([
          { key: 'all' as const, label: 'Todos' },
          { key: 'pending' as const, label: 'Pendentes' },
          { key: 'completed' as const, label: 'Atendidos' },
          { key: 'blocks' as const, label: 'Bloqueios' },
        ]).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`border-none rounded-lg px-3.5 py-2 text-xs font-medium cursor-pointer transition-all ${
              statusFilter === key
                ? 'bg-[#0F766E] text-white'
                : 'bg-transparent text-[#5B665F] hover:text-[#24312E]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#5B665F]">Nenhum evento para este filtro.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {filtered.map((item, idx) => (
            <div key={item.id} className="flex gap-3.5">
              {/* Rail: time + dot + line */}
              <div className="flex flex-col items-center w-[52px] shrink-0">
                <span className="text-xs font-semibold text-[#24312E] mb-1.5">{item.time}</span>
                <div
                  className={`w-[9px] h-[9px] rounded-full shrink-0 ${
                    item.isBlock ? 'bg-red-500' : item.status === 'completed' ? 'bg-[#5B7A63]' : 'bg-[#0F766E]'
                  }`}
                />
                {idx < filtered.length - 1 && (
                  <div className="w-px flex-1 bg-[#E4D8C4] min-h-[64px]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1" style={{ paddingBottom: idx < filtered.length - 1 ? 22 : 0 }}>
                {/* Block */}
                {item.isBlock ? (
                  <div
                    className="rounded-xl px-4 py-3 border-l-4"
                    style={{
                      borderLeftColor: item.blockColor || '#DC2626',
                      backgroundColor: `${item.blockColor || '#DC2626'}10`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Lock size={12} className="text-red-600" />
                          <span className="text-[11px] font-semibold text-red-700">{item.time}</span>
                        </div>
                        <div className="font-medium text-sm text-red-800">
                          {item.blockReason || item.patientName}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-medium whitespace-nowrap">
                        Bloqueio
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Appointment */
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div className="font-fraunces font-medium text-base text-[#24312E]">
                        {item.patientName}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${getBadgeClass(item.status)}`}>
                        {getBadgeLabel(item.status)}
                      </span>
                    </div>
                    <div className="text-xs text-[#5B665F] mb-2">
                      {item.condition}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => toggleStatus(item.id)}
                        className="flex items-center gap-1 border border-[#0F766E] text-[#0F766E] bg-transparent rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer hover:bg-[#E3EEEC] transition-colors"
                      >
                        <CheckCircle2 size={13} />
                        {item.status === 'completed' ? 'Desfazer' : 'Marcar atendido'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectPatient(item.patientId)}
                        className="text-xs text-[#5B665F] hover:text-[#0F766E] bg-transparent border-none cursor-pointer flex items-center gap-0.5 transition-colors"
                      >
                        Ver prontuário
                        <span className="text-[13px]">›</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL: + CRIAR ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14261C]/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#FFFDF9] border border-[#E4D8C4] rounded-[26px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#133023] text-white px-6 py-4 flex items-center justify-between border-b border-[#214D39]">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#A7F3D0]">
                  Novo Registro de Agenda
                </span>
                <h3 className="font-fraunces text-lg font-medium text-[#FFFDF9]">
                  {modalType === 'consulta' ? 'Nova Consulta Clínica' : 'Novo Bloqueio de Horário'}
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

            <div className="flex border-b border-[#E4D8C4] bg-[#FAF8F5] p-2 gap-2">
              <button
                type="button"
                onClick={() => setModalType('consulta')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  modalType === 'consulta'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-white text-[#55695E] border border-[#E4D8C4]'
                }`}
              >
                Consulta Clínica
              </button>
              <button
                type="button"
                onClick={() => setModalType('bloqueio')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  modalType === 'bloqueio'
                    ? 'bg-[#DC2626] text-white shadow-xs'
                    : 'bg-white text-[#55695E] border border-[#E4D8C4]'
                }`}
              >
                Bloqueio de Horário
              </button>
            </div>

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
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5 text-xs text-[#14261C] focus:outline-none focus:border-[#0F766E]"
                    >
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Paciente *</label>
                    <input type="text" required placeholder="Nome do paciente" value={cPatientName} onChange={(e) => setCPatientName(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5 text-xs text-[#14261C] focus:outline-none focus:border-[#0F766E]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Data</label>
                      <input type="text" value={cDate} onChange={(e) => setCDate(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Horário</label>
                      <input type="text" value={cTime} onChange={(e) => setCTime(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Valor (R$)</label>
                      <input type="text" value={cPrice} onChange={(e) => setCPrice(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Telefone</label>
                      <input type="text" placeholder="(19) 90000-0000" value={cPatientPhone} onChange={(e) => setCPatientPhone(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Serviço / Procedimento</label>
                    <input type="text" value={cService} onChange={(e) => setCService(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Observações</label>
                    <textarea rows={2} placeholder="Instruções ou queixas clínicas" value={cNotes} onChange={(e) => setCNotes(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E4D8C4] text-xs font-semibold text-[#55695E] cursor-pointer">Cancelar</button>
                    <button type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-bold shadow-sm cursor-pointer">Confirmar Consulta</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSaveBloqueio} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Profissional *</label>
                    <select value={bProfId} onChange={(e) => setBProfId(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5 text-xs text-[#14261C] focus:outline-none focus:border-[#DC2626]">
                      {professionals.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5">Motivo do Bloqueio *</label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {['Almoço', 'Médico', 'Férias', 'Feriado'].map((reason) => (
                        <button key={reason} type="button" onClick={() => setBReason(reason)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            bReason === reason ? 'bg-[#DC2626] text-white shadow-2xs' : 'bg-[#FAF8F5] border border-[#E4D8C4] text-[#14261C] hover:bg-white'
                          }`}>{reason}</button>
                      ))}
                    </div>
                    <input type="text" placeholder="Outro motivo..." value={bCustomReason}
                      onChange={(e) => { setBCustomReason(e.target.value); setBReason('Outro'); }}
                      className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1.5">Cor do Bloqueio</label>
                    <div className="flex items-center gap-2">
                      {BLOCK_COLORS.map((col) => (
                        <button key={col.hex} type="button" onClick={() => setBColor(col.hex)}
                          style={{ backgroundColor: col.hex }}
                          className={`w-7 h-7 rounded-full cursor-pointer transition-all ${bColor === col.hex ? 'ring-3 ring-offset-2 ring-black/40 scale-110' : ''}`} />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Data</label>
                      <input type="text" value={bDate} onChange={(e) => setBDate(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input type="checkbox" id="allday" checked={bAllDay} onChange={(e) => setBAllDay(e.target.checked)} className="w-4 h-4 rounded text-[#DC2626]" />
                      <label htmlFor="allday" className="text-xs font-semibold text-[#14261C]">Dia Inteiro</label>
                    </div>
                  </div>
                  {!bAllDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Início</label>
                        <input type="text" value={bStartTime} onChange={(e) => setBStartTime(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">Fim</label>
                        <input type="text" value={bEndTime} onChange={(e) => setBEndTime(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-xs text-[#14261C]" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" id="repeat" checked={bRepeat} onChange={(e) => setBRepeat(e.target.checked)} className="w-4 h-4 rounded text-[#DC2626]" />
                    <label htmlFor="repeat" className="text-xs font-semibold text-[#14261C]">Repetir este bloqueio semanalmente</label>
                  </div>
                  <div className="pt-2 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E4D8C4] text-xs font-semibold text-[#55695E] cursor-pointer">Cancelar</button>
                    <button type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-sm cursor-pointer">Confirmar Bloqueio</button>
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
