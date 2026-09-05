import React, { useState } from 'react';
import { TimelineItem } from '../types';
import { X, CalendarPlus, Check, Camera } from 'lucide-react';

interface NewSessionModalProps {
  isOpen: boolean;
  patientName: string;
  onClose: () => void;
  onSave: (session: TimelineItem, photoUrl?: string) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  patientName,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [procedure, setProcedure] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('Hoje');
  const [includePhoto, setIncludePhoto] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !procedure.trim()) return;

    const newSession: TimelineItem = {
      id: `session-${Date.now()}`,
      date: date.trim() || 'Hoje',
      title: title.trim() || procedure.trim() || 'Sessão de Acompanhamento',
      note: note.trim() || 'Procedimento realizado com sucesso, assepsia e curativo aplicados.',
      done: true,
      procedure: procedure.trim() || undefined,
    };

    const photoUrl = includePhoto
      ? 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80'
      : undefined;

    onSave(newSession, photoUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#24312E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFDF9] w-full max-w-full sm:max-w-[500px] rounded-t-[28px] sm:rounded-[24px] p-5 sm:p-6 shadow-2xl border border-[#E4D8C4] max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4D8C4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center">
              <CalendarPlus size={18} />
            </div>
            <div>
              <h2 className="font-fraunces text-[17px] font-bold text-[#24312E]">
                Registrar Nova Sessão
              </h2>
              <p className="text-[11px] text-[#5B665F]">Evolução de {patientName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F3E6D2] hover:bg-[#E4D8C4] flex items-center justify-center text-[#5B665F]"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
                Data do Atendimento
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="Ex: Hoje ou 30 de maio"
                className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
                Título da Sessão *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Sessão 4 — Curativo"
                className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
              Procedimento Realizado
            </label>
            <input
              type="text"
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder="Ex: Troca de curativo e fototerapia"
              className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
              Evolução Clínica / Anotação Podológica
            </label>
            <textarea
              rows={3}
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Descreva o estado da lesão, queixas de dor e recomendações fornecidas ao paciente..."
              className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Photo attachment toggle */}
          <div
            onClick={() => setIncludePhoto(!includePhoto)}
            className={`p-3 rounded-[12px] border cursor-pointer flex items-center justify-between transition-colors ${
              includePhoto
                ? 'bg-[#E3EEEC] border-[#0F766E]'
                : 'bg-[#FBF3E7] border-[#E4D8C4]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Camera size={16} className={includePhoto ? 'text-[#0F766E]' : 'text-[#5B665F]'} />
              <span className="text-[12px] font-medium text-[#24312E]">
                Anexar foto comparativa de evolução
              </span>
            </div>
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                includePhoto
                  ? 'bg-[#0F766E] border-[#0F766E] text-white'
                  : 'border-[#E4D8C4] bg-white'
              }`}
            >
              {includePhoto && <Check size={12} />}
            </div>
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[12px] border border-[#E4D8C4] bg-white text-[#5B665F] text-[13px] font-medium hover:bg-[#F3E6D2]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-[12px] bg-[#0F766E] text-white text-[13px] font-semibold hover:bg-[#0B5D56] shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              Salvar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
