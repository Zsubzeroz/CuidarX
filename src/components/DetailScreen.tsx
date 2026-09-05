import React, { useState } from 'react';
import { Patient, TimelineItem } from '../types';
import { Phone, CheckCircle2, Calendar, FileText, Image as ImageIcon, Share2 } from 'lucide-react';

interface DetailScreenProps {
  patient: Patient | null;
  onBack: () => void;
  onOpenNewSession: () => void;
  onOpenPhotoGallery: () => void;
  onToggleTimelineItem?: (itemId: string) => void;
  onOpenClientShare?: () => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  patient,
  onBack,
  onOpenNewSession,
  onOpenPhotoGallery,
  onToggleTimelineItem,
  onOpenClientShare,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'info'>('timeline');

  if (!patient) return null;

  return (
    <div id="screen-detail-content" className="h-full flex flex-col bg-[#FBF3E7] text-[#24312E] select-none">
      {/* Header */}
      <div className="pt-4 px-5 pb-3.5 flex items-center justify-between border-b border-[#E4D8C4]/60 bg-[#FBF3E7]/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            id="back-button"
            type="button"
            onClick={onBack}
            aria-label="Voltar para lista de pacientes"
            className="w-[34px] h-[34px] rounded-[10px] bg-[#FFFDF9] border border-[#E4D8C4] flex items-center justify-center text-[#24312E] shrink-0 hover:bg-[#F3E6D2] active:scale-95 transition-all lg:hidden"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-fraunces text-[19px] sm:text-[21px] font-semibold leading-tight text-[#24312E]">
                {patient.name}
              </h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                patient.status === 'completed'
                  ? 'bg-[#EAF3EC] text-[#5B7A63]'
                  : 'bg-[#E3EEEC] text-[#0F766E]'
              }`}>
                {patient.status === 'completed' ? 'Alta' : 'Em tratamento'}
              </span>
            </div>
            <div className="text-[12.5px] text-[#5B665F] mt-[1px]">
              {patient.age} anos · {patient.condition}, {patient.locationDetails}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenClientShare && (
            <button
              type="button"
              onClick={onOpenClientShare}
              title="Compartilhar Área do Cliente com o Paciente"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[10px] bg-[#E3EEEC] hover:bg-[#0F766E] text-[#0F766E] hover:text-white text-[12px] font-semibold transition-all cursor-pointer"
            >
              <Share2 size={13} />
              <span className="hidden sm:inline">Área do Cliente</span>
            </button>
          )}

          {patient.phone && (
            <a
              href={`tel:${patient.phone}`}
              title={`Ligar para ${patient.name}`}
              className="w-[34px] h-[34px] rounded-[10px] bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center hover:bg-[#0F766E] hover:text-white transition-colors"
            >
              <Phone size={14} />
            </a>
          )}
          <button
            type="button"
            onClick={onBack}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#FFFDF9] border border-[#E4D8C4] text-[12px] font-medium text-[#5B665F] hover:text-[#24312E] hover:bg-[#F3E6D2] transition-colors"
          >
            Fechar prontuário
          </button>
        </div>
      </div>

      {/* Sub tabs: Prontuário vs Dados do Paciente */}
      <div className="px-5 pt-3 pb-1 flex gap-2 border-b border-[#E4D8C4]/40 bg-[#FBF3E7]">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`text-[12.5px] font-semibold pb-1.5 px-2 border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'text-[#0B5D56] border-[#0B5D56]'
              : 'text-[#86918a] border-transparent hover:text-[#5B665F]'
          }`}
        >
          Histórico e Fotos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`text-[12.5px] font-semibold pb-1.5 px-2 border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'text-[#0B5D56] border-[#0B5D56]'
              : 'text-[#86918a] border-transparent hover:text-[#5B665F]'
          }`}
        >
          Ficha e Anamnese
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-28 no-scrollbar">
        {activeTab === 'timeline' ? (
          <>
            {/* Timeline section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[13px] font-semibold text-[#24312E] uppercase tracking-wider">
                  Histórico do pé
                </h2>
                <span className="text-[11.5px] text-[#5B665F] bg-[#F3E6D2] px-2 py-0.5 rounded-full font-medium">
                  {patient.timeline.length} {patient.timeline.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              <div className="relative pl-5">
                {/* Vertical connecting line */}
                <div className="absolute left-[5px] top-[6px] bottom-[6px] w-[1.5px] bg-[#E4D8C4]" />

                {patient.timeline.map((item: TimelineItem, index: number) => {
                  const isDone = item.done;
                  const isLast = index === patient.timeline.length - 1;

                  return (
                    <div
                      key={item.id}
                      className={`relative ${isLast ? 'pb-1' : 'pb-5'}`}
                    >
                      {/* Timeline dot */}
                      <div
                        onClick={() => onToggleTimelineItem && onToggleTimelineItem(item.id)}
                        className={`absolute -left-[20px] top-[2px] w-[11px] h-[11px] rounded-full border-2 border-[#FBF3E7] cursor-pointer transition-all ${
                          isDone
                            ? 'bg-[#5B7A63] ring-[1.5px] ring-[#5B7A63]'
                            : 'bg-[#0F766E] ring-[1.5px] ring-[#0F766E]'
                        }`}
                        title={isDone ? 'Concluído (Clique para alterar)' : 'Pendente (Clique para concluir)'}
                      />

                      <div className="flex items-center justify-between">
                        <div className="text-[11.5px] text-[#5B665F] mb-[3px] font-medium">
                          {item.date}
                        </div>
                        {item.procedure && (
                          <span className="text-[10px] text-[#0F766E] bg-[#E3EEEC] px-1.5 py-0.5 rounded font-medium">
                            {item.procedure}
                          </span>
                        )}
                      </div>

                      <div className="text-[14.5px] font-semibold text-[#24312E] mb-[3px]">
                        {item.title}
                      </div>

                      <div className="text-[13px] text-[#5B665F] leading-[1.5] bg-[#FFFDF9]/60 p-2 rounded-lg border border-[#E4D8C4]/40 mt-1">
                        {item.note}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Photos section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[13px] font-semibold text-[#24312E] uppercase tracking-wider">
                  Fotos
                </h2>
                <button
                  type="button"
                  onClick={onOpenPhotoGallery}
                  className="text-[11.5px] text-[#0F766E] font-medium hover:underline flex items-center gap-1"
                >
                  <ImageIcon size={12} />
                  Ver galeria
                </button>
              </div>

              <div className="flex gap-2">
                {/* Before Photo */}
                <div
                  onClick={onOpenPhotoGallery}
                  className="relative flex-1 aspect-square rounded-[12px] overflow-hidden flex items-end p-2 cursor-pointer shadow-sm group"
                  style={{
                    background: 'linear-gradient(150deg, #C97F52, #B5542B)',
                  }}
                >
                  <img
                    src={patient.photos[0]?.url || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=300&q=80'}
                    alt="Antes do procedimento"
                    className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#B5542B]/90 via-transparent to-transparent" />
                  <span className="relative z-10 text-[10.5px] font-bold text-white tracking-wide uppercase drop-shadow-sm">
                    Antes
                  </span>
                </div>

                {/* After Photo */}
                <div
                  onClick={onOpenPhotoGallery}
                  className="relative flex-1 aspect-square rounded-[12px] overflow-hidden flex items-end p-2 cursor-pointer shadow-sm group"
                  style={{
                    background: 'linear-gradient(150deg, #3E9188, #0F766E)',
                  }}
                >
                  <img
                    src={patient.photos[1]?.url || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=80'}
                    alt="Depois do procedimento"
                    className="absolute inset-0 w-full h-full object-cover opacity-65 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F766E]/90 via-transparent to-transparent" />
                  <span className="relative z-10 text-[10.5px] font-bold text-white tracking-wide uppercase drop-shadow-sm">
                    Depois
                  </span>
                </div>

                {/* Extra Photos Badge */}
                <div
                  onClick={onOpenPhotoGallery}
                  className="flex-1 aspect-square rounded-[12px] bg-[#F3E6D2] hover:bg-[#E4D8C4] transition-colors text-[#5B665F] flex flex-col items-center justify-center cursor-pointer border border-[#E4D8C4]"
                >
                  <span className="text-[14px] font-semibold text-[#24312E]">+2</span>
                  <span className="text-[9.5px] text-[#5B665F] mt-[-2px]">fotos</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <button
              id="btn-register-session"
              type="button"
              onClick={onOpenNewSession}
              className="w-full py-[15px] px-4 rounded-[14px] bg-[#0F766E] hover:bg-[#0B5D56] active:scale-[0.99] text-white text-[14.5px] font-semibold font-inter shadow-[0_10px_24px_-8px_rgba(15,118,110,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar size={17} />
              Registrar nova sessão
            </button>
          </>
        ) : (
          /* Detailed Anamnese / Patient Info Tab */
          <div className="space-y-4">
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[14px] p-4">
              <h3 className="text-[13px] font-semibold text-[#24312E] mb-2.5 flex items-center gap-1.5">
                <FileText size={15} className="text-[#0F766E]" />
                Dados Clínicos Gerais
              </h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between py-1 border-b border-[#E4D8C4]/40">
                  <span className="text-[#5B665F]">Queixa Principal</span>
                  <span className="font-semibold text-[#24312E]">{patient.condition}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4D8C4]/40">
                  <span className="text-[#5B665F]">Localização</span>
                  <span className="font-medium text-[#24312E] capitalize">{patient.locationDetails}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4D8C4]/40">
                  <span className="text-[#5B665F]">Status Clínico</span>
                  <span className={`font-semibold ${patient.status === 'completed' ? 'text-[#5B7A63]' : 'text-[#0F766E]'}`}>
                    {patient.status === 'completed' ? 'Alta Médica / Tratamento Concluído' : 'Em Acompanhamento'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#5B665F]">Telefone / Contato</span>
                  <span className="font-medium text-[#24312E]">{patient.phone || 'Não informado'}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[14px] p-4">
              <h3 className="text-[13px] font-semibold text-[#24312E] mb-2">
                Observações e Anamnese Podológica
              </h3>
              <p className="text-[13px] text-[#5B665F] leading-relaxed">
                {patient.notes || 'Sem observações adicionais cadastradas para esta ficha.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenNewSession}
              className="w-full py-3 rounded-[12px] bg-[#0F766E] text-white text-[13.5px] font-semibold shadow-sm hover:bg-[#0B5D56] transition-all flex items-center justify-center gap-2"
            >
              <Calendar size={15} />
              Registrar Evolução Podológica
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
