import React, { useState } from 'react';
import { Appointment } from '../types';
import { Clock, CalendarCheck, CheckCircle2, User, ChevronRight, Plus } from 'lucide-react';

interface AgendaTabProps {
  appointments: Appointment[];
  onSelectPatient: (patientId: string) => void;
  onNewAppointment?: () => void;
}

export const AgendaTab: React.FC<AgendaTabProps> = ({
  appointments: initialAppointments,
  onSelectPatient,
}) => {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const toggleStatus = (id: string) => {
    setAppointments((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const nextStatus =
            app.status === 'completed'
              ? 'confirmed'
              : app.status === 'confirmed'
              ? 'in_progress'
              : 'completed';
          return { ...app, status: nextStatus };
        }
        return app;
      })
    );
  };

  const filtered = appointments.filter((app) => {
    if (filter === 'completed') return app.status === 'completed';
    if (filter === 'pending') return app.status !== 'completed';
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-3 pb-28 no-scrollbar">
      {/* Header Info */}
      <div className="mb-4">
        <h1 className="font-fraunces text-[22px] font-semibold text-[#24312E] mb-1">
          Agenda do Dia
        </h1>
        <p className="text-[13px] text-[#5B665F]">
          Sexta-feira, 26 de Maio · <b className="text-[#0F766E] font-semibold">{appointments.length} consultas</b>
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
            filter === 'all'
              ? 'bg-[#0F766E] text-white'
              : 'bg-[#FFFDF9] text-[#5B665F] border border-[#E4D8C4]'
          }`}
        >
          Todos ({appointments.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
            filter === 'pending'
              ? 'bg-[#0F766E] text-white'
              : 'bg-[#FFFDF9] text-[#5B665F] border border-[#E4D8C4]'
          }`}
        >
          Pendentes
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all ${
            filter === 'completed'
              ? 'bg-[#0F766E] text-white'
              : 'bg-[#FFFDF9] text-[#5B665F] border border-[#E4D8C4]'
          }`}
        >
          Atendidos
        </button>
      </div>

      {/* Appointment list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const isCompleted = item.status === 'completed';
          const isInProgress = item.status === 'in_progress';

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-[14px] bg-[#FFFDF9] border transition-all ${
                isInProgress
                  ? 'border-[#0F766E] shadow-sm bg-[#E3EEEC]/20'
                  : 'border-[#E4D8C4]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#0F766E] bg-[#E3EEEC] px-2.5 py-1 rounded-lg">
                    <Clock size={13} />
                    {item.time}
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-[#E7EFE6] text-[#5B7A63]'
                        : isInProgress
                        ? 'bg-[#F6E4DA] text-[#B5542B] animate-pulse'
                        : 'bg-[#F3E6D2] text-[#5B665F]'
                    }`}
                  >
                    {isCompleted
                      ? 'Concluído'
                      : isInProgress
                      ? 'Em Atendimento'
                      : 'Confirmado'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleStatus(item.id)}
                  title="Alterar status do atendimento"
                  className="text-[#86918a] hover:text-[#0F766E] transition-colors p-1"
                >
                  <CheckCircle2
                    size={18}
                    className={isCompleted ? 'text-[#5B7A63]' : 'text-[#c7bda4]'}
                  />
                </button>
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[14.5px] font-semibold text-[#24312E]">
                    {item.patientName}
                  </div>
                  <div className="text-[12.5px] text-[#5B665F] mt-0.5">
                    {item.condition}
                  </div>
                  <div className="text-[11px] text-[#86918a] mt-1">
                    Procedimento: {item.type}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPatient(item.patientId)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FBF3E7] hover:bg-[#E3EEEC] text-[#0F766E] text-[11.5px] font-semibold flex items-center gap-1 border border-[#E4D8C4]"
                >
                  Abrir Ficha
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
