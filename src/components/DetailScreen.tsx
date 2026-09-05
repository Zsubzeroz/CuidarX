import React, { useState } from 'react';
import { Patient, TimelineItem, FootMarker } from '../types';
import {
  Phone,
  CheckCircle2,
  Calendar,
  FileText,
  Image as ImageIcon,
  Share2,
  Footprints,
  HeartPulse,
  Printer,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Flame,
} from 'lucide-react';
import { PodogramMap } from './PodogramMap';
import { HomeCarePrescriptionModal } from './HomeCarePrescriptionModal';

interface DetailScreenProps {
  patient: Patient | null;
  onBack: () => void;
  onOpenNewSession: () => void;
  onOpenPhotoGallery: () => void;
  onToggleTimelineItem?: (itemId: string) => void;
  onOpenClientShare?: () => void;
  onUpdatePatient?: (updated: Patient) => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  patient,
  onBack,
  onOpenNewSession,
  onOpenPhotoGallery,
  onToggleTimelineItem,
  onOpenClientShare,
  onUpdatePatient,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'info' | 'podogram'>('timeline');
  const [isHomeCareOpen, setIsHomeCareOpen] = useState(false);

  if (!patient) return null;

  const handleAddMarker = (newMarker: FootMarker) => {
    if (!onUpdatePatient) return;
    const currentMarkers = patient.footMarkers || [];
    const updated: Patient = {
      ...patient,
      footMarkers: [...currentMarkers, newMarker],
    };
    onUpdatePatient(updated);
  };

  const handleRemoveMarker = (markerId: string) => {
    if (!onUpdatePatient) return;
    const currentMarkers = patient.footMarkers || [];
    const updated: Patient = {
      ...patient,
      footMarkers: currentMarkers.filter((m) => m.id !== markerId),
    };
    onUpdatePatient(updated);
  };

  const handlePrintRecord = () => {
    window.print();
  };

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
            <div className="flex items-center gap-2 flex-wrap">
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
              {patient.isDiabetic && (
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#F6E4DA] text-[#B5542B] border border-[#B5542B]/30 flex items-center gap-1">
                  <ShieldAlert size={11} />
                  Diabético(a)
                </span>
              )}
            </div>
            <div className="text-[12.5px] text-[#5B665F] mt-[1px]">
              {patient.age} anos · {patient.condition}, {patient.locationDetails}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Home Care Prescription */}
          <button
            type="button"
            onClick={() => setIsHomeCareOpen(true)}
            title="Gerar Orientações Home Care (WhatsApp)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[10px] bg-[#FFFDF9] border border-[#E4D8C4] hover:bg-[#F3E6D2] text-[#0F766E] text-[12px] font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <HeartPulse size={14} className="text-[#0F766E]" />
            <span className="hidden sm:inline">Receitar Home Care</span>
          </button>

          {/* Client Portal Share */}
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

          {/* Print Record */}
          <button
            type="button"
            onClick={handlePrintRecord}
            title="Imprimir Ficha Clínica"
            className="w-[34px] h-[34px] rounded-[10px] bg-[#FFFDF9] border border-[#E4D8C4] text-[#5B665F] hover:text-[#24312E] hover:bg-[#F3E6D2] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Printer size={14} />
          </button>

          {/* Phone call */}
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
            Fechar
          </button>
        </div>
      </div>

      {/* Sub tabs: Histórico vs Ficha vs Mapa Podológico */}
      <div className="px-5 pt-3 pb-1 flex gap-2 border-b border-[#E4D8C4]/40 bg-[#FBF3E7] overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`text-[12.5px] font-semibold pb-1.5 px-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'timeline'
              ? 'text-[#0B5D56] border-[#0B5D56]'
              : 'text-[#86918a] border-transparent hover:text-[#5B665F]'
          }`}
        >
          Histórico e Fotos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('podogram')}
          className={`text-[12.5px] font-semibold pb-1.5 px-2 border-b-2 transition-colors flex items-center gap-1 shrink-0 ${
            activeTab === 'podogram'
              ? 'text-[#0B5D56] border-[#0B5D56]'
              : 'text-[#86918a] border-transparent hover:text-[#5B665F]'
          }`}
        >
          <Footprints size={13} />
          Mapa Podológico ({patient.footMarkers?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`text-[12.5px] font-semibold pb-1.5 px-2 border-b-2 transition-colors shrink-0 ${
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
                  className="text-[11.5px] text-[#0F766E] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon size={12} />
                  Ver galeria
                </button>
              </div>

              <div className="flex gap-2">
                {/* Before Photo */}
                <div
                  onClick={onOpenPhotoGallery}
                  className="relative flex-1 aspect-square rounded-[12px] overflow-hidden flex items-end p-2 cursor-pointer shadow-xs group"
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
                  <span className="relative z-10 text-[10.5px] font-bold text-white tracking-wide uppercase drop-shadow-xs">
                    Antes
                  </span>
                </div>

                {/* After Photo */}
                <div
                  onClick={onOpenPhotoGallery}
                  className="relative flex-1 aspect-square rounded-[12px] overflow-hidden flex items-end p-2 cursor-pointer shadow-xs group"
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
                  <span className="relative z-10 text-[10.5px] font-bold text-white tracking-wide uppercase drop-shadow-xs">
                    Depois
                  </span>
                </div>

                {/* Extra Photos Badge */}
                <div
                  onClick={onOpenPhotoGallery}
                  className="flex-1 aspect-square rounded-[12px] bg-[#F3E6D2] hover:bg-[#E4D8C4] transition-colors text-[#5B665F] flex flex-col items-center justify-center cursor-pointer border border-[#E4D8C4]"
                >
                  <span className="text-[14px] font-semibold text-[#24312E]">
                    +{Math.max(0, patient.photos.length - 2)}
                  </span>
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
        ) : activeTab === 'podogram' ? (
          /* Interactive Podogram Tab */
          <div className="space-y-4">
            <PodogramMap
              patientName={patient.name}
              isDiabetic={patient.isDiabetic}
              markers={patient.footMarkers || []}
              onAddMarker={handleAddMarker}
              onRemoveMarker={handleRemoveMarker}
            />

            <button
              type="button"
              onClick={() => setIsHomeCareOpen(true)}
              className="w-full py-3 rounded-[12px] bg-[#0F766E] text-white text-[13.5px] font-semibold shadow-xs hover:bg-[#0B5D56] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <HeartPulse size={15} />
              Gerar Orientações Pós-Consulta para Paciente
            </button>
          </div>
        ) : (
          /* Detailed Anamnese / Clinical Factors Tab */
          <div className="space-y-4">
            {/* Risk Factors Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className={`p-3 rounded-[12px] border flex flex-col items-center text-center ${
                patient.isDiabetic ? 'bg-[#F6E4DA] border-[#B5542B]/40 text-[#B5542B]' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
              }`}>
                <ShieldAlert size={18} className={patient.isDiabetic ? 'text-[#B5542B] mb-1' : 'text-[#86918a] mb-1'} />
                <span className="text-[11px] font-semibold">Pé Diabético</span>
                <span className="text-[10px] font-bold mt-0.5">{patient.isDiabetic ? 'SIM (Atenção)' : 'Não'}</span>
              </div>

              <div className={`p-3 rounded-[12px] border flex flex-col items-center text-center ${
                patient.hasCirculatoryIssues ? 'bg-[#F9F3E5] border-[#C8A45A]/40 text-[#856519]' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
              }`}>
                <Activity size={18} className={patient.hasCirculatoryIssues ? 'text-[#C8A45A] mb-1' : 'text-[#86918a] mb-1'} />
                <span className="text-[11px] font-semibold">Circulatório</span>
                <span className="text-[10px] font-bold mt-0.5">{patient.hasCirculatoryIssues ? 'Alterado' : 'Normal'}</span>
              </div>

              <div className={`p-3 rounded-[12px] border flex flex-col items-center text-center ${
                patient.isHypertensive ? 'bg-[#F6E4DA] border-[#B5542B]/40 text-[#B5542B]' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
              }`}>
                <HeartPulse size={18} className={patient.isHypertensive ? 'text-[#B5542B] mb-1' : 'text-[#86918a] mb-1'} />
                <span className="text-[11px] font-semibold">Hipertensão</span>
                <span className="text-[10px] font-bold mt-0.5">{patient.isHypertensive ? 'Sim' : 'Não'}</span>
              </div>

              <div className="p-3 rounded-[12px] bg-[#FFFDF9] border border-[#E4D8C4] flex flex-col items-center text-center text-[#5B665F]">
                <Footprints size={18} className="text-[#0F766E] mb-1" />
                <span className="text-[11px] font-semibold">Pisada</span>
                <span className="text-[10px] font-bold text-[#0F766E] capitalize mt-0.5">{patient.footStrike || 'Neutra'}</span>
              </div>
            </div>

            {/* Pain Scale Indicator */}
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[14px] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12.5px] font-semibold text-[#24312E] flex items-center gap-1.5">
                  <Flame size={14} className={patient.painScale && patient.painScale > 5 ? 'text-[#B5542B]' : 'text-[#C8A45A]'} />
                  Escala Visual Analógica de Dor (EVA)
                </span>
                <span className="text-[13px] font-bold text-[#24312E]">
                  {patient.painScale || 0} / 10
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#E4D8C4]">
                <div
                  style={{ width: `${((patient.painScale || 0) / 10) * 100}%` }}
                  className={`h-full rounded-full transition-all ${
                    (patient.painScale || 0) >= 7
                      ? 'bg-[#B5542B]'
                      : (patient.painScale || 0) >= 4
                      ? 'bg-[#C8A45A]'
                      : 'bg-[#0F766E]'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[9.5px] text-[#86918a] mt-1">
                <span>Sem dor (0)</span>
                <span>Moderada (5)</span>
                <span>Dor intensa (10)</span>
              </div>
            </div>

            {/* General Patient Info */}
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[14px] p-4">
              <h3 className="text-[13px] font-semibold text-[#24312E] mb-2.5 flex items-center gap-1.5">
                <FileText size={15} className="text-[#0F766E]" />
                Dados Cadastrais & Anamnese
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
                  <span className="text-[#5B665F]">Alergias Relatadas</span>
                  <span className="font-medium text-[#B5542B]">{patient.allergies || 'Nenhuma informada'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E4D8C4]/40">
                  <span className="text-[#5B665F]">Hábito de Calçado</span>
                  <span className="font-medium text-[#24312E]">{patient.shoeHabit || 'Não informado'}</span>
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

            {/* Observations Note */}
            <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[14px] p-4">
              <h3 className="text-[13px] font-semibold text-[#24312E] mb-2">
                Observações Clínicas & Condutas
              </h3>
              <p className="text-[13px] text-[#5B665F] leading-relaxed">
                {patient.notes || 'Sem observações adicionais cadastradas para esta ficha.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsHomeCareOpen(true)}
                className="py-3 rounded-[12px] bg-[#FFFDF9] border border-[#0F766E] text-[#0F766E] text-[13px] font-semibold shadow-xs hover:bg-[#E3EEEC] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <HeartPulse size={15} />
                Receitar Cuidados Domiciliares
              </button>

              <button
                type="button"
                onClick={onOpenNewSession}
                className="py-3 rounded-[12px] bg-[#0F766E] text-white text-[13px] font-semibold shadow-xs hover:bg-[#0B5D56] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar size={15} />
                Registrar Nova Evolução
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Home Care Prescription Modal */}
      <HomeCarePrescriptionModal
        isOpen={isHomeCareOpen}
        patient={patient}
        onClose={() => setIsHomeCareOpen(false)}
      />
    </div>
  );
};
