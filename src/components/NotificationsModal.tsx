import React from 'react';
import { X, Bell, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patientId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectPatient,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n-1',
      title: 'Próximo atendimento em 25 min',
      desc: 'Marina Alves está agendada para às 14:00 (Troca de curativo no hálux).',
      patientId: 'marina-alves',
      time: 'Agora',
      type: 'clock',
    },
    {
      id: 'n-2',
      title: 'Retorno preventivo recomendado',
      desc: 'João Pedro Nogueira completou 15 dias desde o último desbastamento.',
      patientId: 'joao-pedro',
      time: 'Há 2h',
      type: 'alert',
    },
    {
      id: 'n-3',
      title: 'Esterilização concluída',
      desc: 'Ciclo da autoclave de instrumentos cirúrgicos concluído com fita indicadora aprovada.',
      time: 'Hoje 11:30',
      type: 'check',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#24312E]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFDF9] w-full max-w-[420px] rounded-[22px] p-5 shadow-2xl border border-[#E4D8C4] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#E4D8C4]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center">
              <Bell size={15} />
            </div>
            <h3 className="font-fraunces text-[15px] font-bold text-[#24312E]">
              Notificações Clínicas
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-[#F3E6D2] hover:bg-[#E4D8C4] flex items-center justify-center text-[#5B665F]"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.patientId) {
                  onSelectPatient(n.patientId);
                  onClose();
                }
              }}
              className={`p-2.5 rounded-xl border border-[#E4D8C4] bg-[#FBF3E7]/60 hover:bg-[#E3EEEC]/40 transition-colors ${
                n.patientId ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#0F766E] mb-1">
                <span className="flex items-center gap-1">
                  {n.type === 'clock' && <Clock size={12} />}
                  {n.type === 'alert' && <AlertTriangle size={12} className="text-[#B5542B]" />}
                  {n.type === 'check' && <CheckCircle2 size={12} className="text-[#5B7A63]" />}
                  {n.title}
                </span>
                <span className="text-[#86918a] font-normal">{n.time}</span>
              </div>
              <p className="text-[12px] text-[#5B665F] leading-snug">{n.desc}</p>
              {n.patientId && (
                <div className="text-[10.5px] text-[#0F766E] font-semibold mt-1.5 flex items-center gap-1">
                  Ver prontuário do paciente →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
