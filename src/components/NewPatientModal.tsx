import React, { useState } from 'react';
import { Patient, TagColor } from '../types';
import { X, UserPlus, Check } from 'lucide-react';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('Onicocriptose');
  const [locationDetails, setLocationDetails] = useState('');
  const [tagColor, setTagColor] = useState<TagColor>('teal');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name: name.trim(),
      age: parseInt(age) || 35,
      condition: condition.trim() || 'Avaliação Geral',
      locationDetails: locationDetails.trim() || 'membros inferiores',
      timeAgo: 'Hoje',
      tagColor,
      phone: phone.trim() || '(11) 99999-0000',
      status: 'in-progress',
      notes: notes.trim() || 'Ficha aberta via protótipo CuidarX.',
      timeline: [
        {
          id: `t-${Date.now()}`,
          date: 'Hoje',
          title: 'Primeira consulta e acolhimento',
          note: notes.trim() || 'Realizada anamnese podológica preliminar e inspeção estática/dinâmica.',
          done: true,
          procedure: 'Avaliação podológica inicial',
        },
      ],
      photos: [
        {
          id: `p-${Date.now()}-1`,
          type: 'before',
          label: 'Antes',
          url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80',
          date: 'Hoje',
        },
        {
          id: `p-${Date.now()}-2`,
          type: 'after',
          label: 'Depois',
          url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
          date: 'Hoje',
        },
      ],
    };

    onSave(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#24312E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFDF9] w-full max-w-full sm:max-w-[520px] rounded-t-[28px] sm:rounded-[24px] p-5 sm:p-6 shadow-2xl border border-[#E4D8C4] max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4D8C4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="font-fraunces text-[17px] font-bold text-[#24312E]">
                Nova Ficha de Paciente
              </h2>
              <p className="text-[11px] text-[#5B665F]">Cadastrar prontuário podológico</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Camila Vasconcelos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
                Idade
              </label>
              <input
                type="number"
                placeholder="Ex: 38"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
                Telefone
              </label>
              <input
                type="tel"
                placeholder="(11) 9...."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
              Patologia / Queixa Principal
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
            >
              <option value="Onicocriptose">Onicocriptose (Unha Encravada)</option>
              <option value="Calo plantar">Calo plantar / Hiperqueratose</option>
              <option value="Onicomicose">Onicomicose (Micose de Unha)</option>
              <option value="Verruga plantar">Verruga plantar (Olho de Peixe)</option>
              <option value="Pé Diabético">Pé Diabético (Prevenção / Tratamento)</option>
              <option value="Fissuras calcâneas">Fissuras calcâneas</option>
              <option value="Alta do tratamento">Alta do tratamento</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
              Localização anatômica
            </label>
            <input
              type="text"
              placeholder="Ex: hálux direito, borda lateral externa"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#24312E] mb-1.5">
              Etiqueta de Prioridade / Cor
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTagColor('teal')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[12px] font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  tagColor === 'teal'
                    ? 'bg-[#E3EEEC] border-[#0F766E] text-[#0F766E] font-semibold'
                    : 'bg-[#FBF3E7] border-[#E4D8C4] text-[#5B665F]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
                Padrão (Teal)
              </button>
              <button
                type="button"
                onClick={() => setTagColor('clay')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[12px] font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  tagColor === 'clay'
                    ? 'bg-[#F6E4DA] border-[#B5542B] text-[#B5542B] font-semibold'
                    : 'bg-[#FBF3E7] border-[#E4D8C4] text-[#5B665F]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#B5542B]" />
                Atenção (Argila)
              </button>
              <button
                type="button"
                onClick={() => setTagColor('sage')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[12px] font-medium border flex items-center justify-center gap-1.5 transition-all ${
                  tagColor === 'sage'
                    ? 'bg-[#E7EFE6] border-[#5B7A63] text-[#5B7A63] font-semibold'
                    : 'bg-[#FBF3E7] border-[#E4D8C4] text-[#5B665F]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B7A63]" />
                Alta / Estável
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#24312E] mb-1">
              Observações Iniciais da Anamnese
            </label>
            <textarea
              rows={2}
              placeholder="Queixa, sensibilidade à dor, histórico de calçados..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#FBF3E7] border border-[#E4D8C4] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] focus:outline-none focus:border-[#0F766E]"
            />
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
              Criar Ficha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
