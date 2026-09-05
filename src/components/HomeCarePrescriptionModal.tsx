import React, { useState } from 'react';
import { Patient } from '../types';
import { X, Send, Printer, Check, HeartPulse, Sparkles, FileCheck, ShieldAlert } from 'lucide-react';

interface HomeCarePrescriptionModalProps {
  isOpen: boolean;
  patient: Patient;
  onClose: () => void;
}

export const HomeCarePrescriptionModal: React.FC<HomeCarePrescriptionModalProps> = ({
  isOpen,
  patient,
  onClose,
}) => {
  if (!isOpen) return null;

  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([
    'Higienização diária: Lavar suavemente com sabonete neutro e água morna 2x ao dia.',
    'Secagem rigorosa: Secar com toalha de papel descartável ou toalha macia, especialmente entre os dedos.',
    'Hidratação podológica: Aplicar creme com Ureia (10% a 20%) na planta do pé e calcanhar. Não aplicar entre os dedos.',
    'Calçados adequados: Evitar sapatos de bico fino ou salto por 5 dias. Dar preferência a calçados arejados.',
    'Curativo: Manter a proteção limpa e seca nas primeiras 24 horas. Trocar conforme orientado no consultório.',
  ]);

  const [customNote, setCustomNote] = useState('');
  const [returnDays, setReturnDays] = useState('15');
  const [copied, setCopied] = useState(false);

  const ALL_SUGGESTIONS = [
    'Higienização diária: Lavar suavemente com sabonete neutro e água morna 2x ao dia.',
    'Secagem rigorosa: Secar com toalha de papel descartável ou toalha macia, especialmente entre os dedos.',
    'Hidratação podológica: Aplicar creme com Ureia (10% a 20%) na planta do pé e calcanhar. Não aplicar entre os dedos.',
    'Calçados adequados: Evitar sapatos de bico fino ou salto por 5 dias. Dar preferência a calçados arejados.',
    'Curativo: Manter a proteção limpa e seca nas primeiras 24 horas. Trocar conforme orientado no consultório.',
    'Pé Diabético: Fazer inspeção diária com espelho para checar qualquer corte, bolha ou área avermelhada.',
    'Órtese metálica: Não mexer na lâmina/tração da órtese. Em caso de descolamento, comunicar a clínica.',
    'Laserterapia: A fotobiomodulação estimula a cicatrização celular; repousar a área após o procedimento.',
    'Meias recomendadas: Utilizar meias 100% algodão sem costura interna para evitar fricção.',
  ];

  const toggleRecommendation = (rec: string) => {
    if (selectedRecommendations.includes(rec)) {
      setSelectedRecommendations(selectedRecommendations.filter((r) => r !== rec));
    } else {
      setSelectedRecommendations([...selectedRecommendations, rec]);
    }
  };

  const generatePrescriptionText = () => {
    const lines = [
      `🦶 *CUIDARX — ORIENTAÇÕES DE CUIDADOS PODOLÓGICOS (HOME CARE)*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Paciente:* ${patient.name}`,
      `📋 *Queixa/Tratamento:* ${patient.condition} (${patient.locationDetails})`,
      `📅 *Data da Consulta:* ${new Date().toLocaleDateString('pt-BR')}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `\n*RECOMENDAÇÕES PÓS-PROCEDIMENTO:*`,
      ...selectedRecommendations.map((r, i) => `${i + 1}. ${r}`),
    ];

    if (customNote.trim()) {
      lines.push(`\n📝 *Observação Específica:* ${customNote.trim()}`);
    }

    if (returnDays) {
      lines.push(`\n🗓️ *Previsão de Retorno Clínico:* em ${returnDays} dias.`);
    }

    lines.push(
      `\n⚠️ *Sinais de alerta:* Em caso de latejamento intenso, calor excessivo ou secreção, contate imediatamente nossa equipe.`,
      `\n👩‍⚕️ _Consultório de Podologia CuidarX_`
    );

    return lines.join('\n');
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generatePrescriptionText());
    const phoneClean = (patient.phone || '').replace(/\D/g, '');
    const url = phoneClean.length >= 10
      ? `https://wa.me/55${phoneClean}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePrescriptionText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#24312E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFDF9] w-full max-w-full sm:max-w-[580px] rounded-t-[28px] sm:rounded-[24px] p-5 sm:p-6 shadow-2xl border border-[#E4D8C4] max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E4D8C4]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[11px] bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center">
              <HeartPulse size={19} />
            </div>
            <div>
              <h2 className="font-fraunces text-[18px] font-semibold text-[#24312E]">
                Orientações Domiciliares (Home Care)
              </h2>
              <p className="text-[12px] text-[#5B665F]">
                Receituário personalizado para {patient.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF6F0] hover:bg-[#E4D8C4] flex items-center justify-center text-[#5B665F] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          {patient.isDiabetic && (
            <div className="p-3 bg-[#F6E4DA] border border-[#B5542B]/30 rounded-[12px] flex items-start gap-2.5 text-[12.5px] text-[#B5542B]">
              <ShieldAlert size={17} className="shrink-0 mt-0.5" />
              <div>
                <strong>Atenção: Paciente Diabético(a).</strong> As orientações para inspeção diária e calçados sem costura são prioritárias para evitar lesões ocultas.
              </div>
            </div>
          )}

          {/* Quick checklist of recommendations */}
          <div>
            <label className="block text-[12px] font-semibold text-[#24312E] uppercase tracking-wider mb-2">
              Selecione as Orientações Clínicas
            </label>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
              {ALL_SUGGESTIONS.map((sug) => {
                const isSelected = selectedRecommendations.includes(sug);
                return (
                  <div
                    key={sug}
                    onClick={() => toggleRecommendation(sug)}
                    className={`p-2.5 rounded-[10px] border text-[12.5px] cursor-pointer transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[#E3EEEC]/60 border-[#0F766E] text-[#0B5D56] font-medium'
                        : 'bg-[#FAF6F0] border-[#E4D8C4]/60 text-[#5B665F] hover:bg-[#FAF6F0]/80'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#0F766E] border-[#0F766E] text-white'
                          : 'border-[#c7bda4] bg-white'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className="leading-snug">{sug}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional note & Return days */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11.5px] font-medium text-[#5B665F] mb-1">
                Instrução Adicional Específica
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Ex: Aplicar pomada antibiótica por 3 noites..."
                className="w-full text-[12.5px] bg-[#FAF6F0] border border-[#E4D8C4] rounded-[10px] p-2.5 text-[#24312E] focus:outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block text-[11.5px] font-medium text-[#5B665F] mb-1">
                Retorno (Dias)
              </label>
              <input
                type="number"
                value={returnDays}
                onChange={(e) => setReturnDays(e.target.value)}
                placeholder="15"
                className="w-full text-[12.5px] bg-[#FAF6F0] border border-[#E4D8C4] rounded-[10px] p-2.5 text-[#24312E] focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-3 bg-[#FAF6F0] border border-[#E4D8C4] rounded-[12px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#5B665F] uppercase">
                Prévia da Mensagem (WhatsApp / Ficha)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11.5px] text-[#0F766E] hover:underline font-semibold"
              >
                {copied ? 'Copiado!' : 'Copiar texto'}
              </button>
            </div>
            <pre className="text-[11.5px] text-[#24312E] whitespace-pre-wrap font-sans leading-relaxed max-h-[120px] overflow-y-auto no-scrollbar">
              {generatePrescriptionText()}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#E4D8C4]/60 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex-1 py-3 px-4 rounded-[12px] bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white text-[13.5px] font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
          >
            <Send size={15} />
            Enviar via WhatsApp para {patient.name.split(' ')[0]}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="py-3 px-4 rounded-[12px] bg-[#FFFDF9] border border-[#E4D8C4] hover:bg-[#F3E6D2] text-[#24312E] text-[13.5px] font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer size={15} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};
