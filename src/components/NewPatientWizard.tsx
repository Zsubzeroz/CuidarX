import React, { useState } from 'react';
import { Patient, TagColor } from '../types';
import { X, ChevronLeft, ChevronRight, Check, Download, Share2, MessageSquare, FileText, Home } from 'lucide-react';

interface NewPatientWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

const STEP_TITLES = ['Identificação', 'Histórico de saúde', 'Queixa principal', 'Mapa podal & conduta', 'Assinaturas'];

const MOTIVOS = ['Unha encravada', 'Calo/calosidade', 'Micose', 'Pé diabético', 'Fissuras', 'Verruga', 'Outro'];
const PROCEDIMENTOS = ['Corte técnico das unhas', 'Curetagem', 'Órtese ungueal', 'Hidratação', 'Aplicação de laser', 'Curativo'];
const ALERGIAS_PILLS = ['Látex', 'Iodo', 'Anestésico local', 'Níquel'];

const PAIN_CAPTIONS = ['Sem dor', 'Muito leve', 'Leve', 'Leve', 'Moderada', 'Moderada', 'Moderada', 'Forte', 'Forte', 'Muito forte', 'Insuportável'];
const PAIN_EMOJIS = ['😀', '🙂', '🙂', '😐', '😐', '😕', '😕', '😣', '😣', '😖', '😭'];

export const NewPatientWizard: React.FC<NewPatientWizardProps> = ({ isOpen, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const fillSteps = 5;

  // Step 1: Identificação
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');

  // Step 2: Histórico de saúde
  const [isDiabetic, setIsDiabetic] = useState(false);
  const [isHypertensive, setIsHypertensive] = useState(false);
  const [hasCirculatoryIssues, setHasCirculatoryIssues] = useState(false);
  const [usesAnticoagulant, setUsesAnticoagulant] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);

  // Step 3: Queixa principal
  const [motivos, setMotivos] = useState<string[]>([]);
  const [painScale, setPainScale] = useState(0);

  // Step 4: Mapa podal & conduta
  const [procedimentos, setProcedimentos] = useState<string[]>([]);

  // Step 5: Assinaturas
  const [consentInfo, setConsentInfo] = useState(false);
  const [consentPhoto, setConsentPhoto] = useState(false);

  if (!isOpen) return null;

  const progress = (currentStep / fillSteps) * 100;

  const toggleInArray = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canAdvance = () => {
    if (currentStep === 1) return name.trim().length > 0;
    return true;
  };

  const handleFinish = () => {
    const age = birthDate ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 35;
    const condition = motivos.length > 0 ? motivos[0] : 'Avaliação Geral';

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name: name.trim(),
      age,
      condition,
      locationDetails: 'membros inferiores',
      timeAgo: 'Hoje',
      tagColor: isDiabetic ? 'clay' : 'teal',
      phone: phone.trim() || undefined,
      cpf: undefined,
      status: 'in-progress',
      isDiabetic,
      hasCirculatoryIssues,
      isHypertensive,
      allergies: allergies.length > 0 ? allergies.join(', ') : undefined,
      painScale,
      footStrike: 'neutra',
      shoeHabit: undefined,
      footMarkers: [],
      notes: `Motivo: ${motivos.join(', ') || 'Não informado'}. Procedimentos: ${procedimentos.join(', ') || 'Nenhum'}.`,
      timeline: [
        {
          id: `t-${Date.now()}`,
          date: 'Hoje',
          title: 'Primeira consulta e acolhimento',
          note: 'Realizada anamnese podológica preliminar e inspeção estática/dinâmica.',
          done: true,
          procedure: condition,
        },
      ],
      photos: [],
    };

    onSave(newPatient);
    onClose();
    // Reset
    setCurrentStep(1);
    setName('');
    setBirthDate('');
    setPhone('');
    setGender('Feminino');
    setIsDiabetic(false);
    setIsHypertensive(false);
    setHasCirculatoryIssues(false);
    setUsesAnticoagulant(false);
    setAllergies([]);
    setMotivos([]);
    setPainScale(0);
    setProcedimentos([]);
    setConsentInfo(false);
    setConsentPhoto(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#24312E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FBF3E7] w-full max-w-[640px] rounded-t-[20px] sm:rounded-[16px] shadow-2xl border border-[#E4D8C4] max-h-[92vh] flex flex-col overflow-hidden">

        {/* Progress bar */}
        {currentStep <= fillSteps && (
          <div className="h-[3px] bg-[#E4D8C4] shrink-0">
            <div className="h-full bg-[#0F766E] transition-[width] duration-250" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Header */}
        {currentStep <= fillSteps && (
          <div className="px-5 sm:px-[22px] pt-4 pb-0 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11.5px] font-semibold text-[#0F766E] bg-[#E3EEEC] px-2.5 py-1 rounded-full">
                Etapa {currentStep} de {fillSteps} · {STEP_TITLES[currentStep - 1]}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-[#5B665F] hover:text-[#24312E] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-5 sm:px-[22px] overflow-y-auto flex-1 min-h-0">
          <div style={{ minHeight: 340 }}>

            {/* STEP 1: Identificação */}
            {currentStep === 1 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Identificação</h2>
                <div className="mb-4">
                  <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Nome completo</label>
                  <input
                    type="text"
                    placeholder="Nome do paciente"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-b border-[#E4D8C4] bg-transparent text-[14.5px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]"
                  />
                </div>
                <div className="flex gap-3.5 mb-4">
                  <div className="flex-1">
                    <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Data de nascimento</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Telefone / WhatsApp</label>
                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12.5px] text-[#5B665F] mb-2">Sexo / gênero</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['Feminino', 'Masculino', 'Outro'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`px-3.5 py-2 rounded-full text-[12.5px] border cursor-pointer transition-all ${
                          gender === g
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Histórico de saúde */}
            {currentStep === 2 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-1">Histórico de saúde</h2>
                <p className="text-[12.5px] text-[#5B665F] mb-4">Ative as condições registradas pelo paciente</p>

                {[
                  { label: 'Diabetes', val: isDiabetic, set: setIsDiabetic },
                  { label: 'Hipertensão', val: isHypertensive, set: setIsHypertensive },
                  { label: 'Alteração circulatória', val: hasCirculatoryIssues, set: setHasCirculatoryIssues },
                  { label: 'Uso de anticoagulante', val: usesAnticoagulant, set: setUsesAnticoagulant },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#E4D8C4]">
                    <span className="text-[13.5px] text-[#24312E]">{item.label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.val}
                      onClick={() => item.set(!item.val)}
                      className={`relative inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        item.val ? 'bg-[#0F766E]' : 'bg-[#D1D5DB]'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 mt-[1px] ${
                        item.val ? 'translate-x-[18px]' : 'translate-x-[1px]'
                      }`} />
                    </button>
                  </div>
                ))}

                <div className="mt-4">
                  <label className="block text-[12.5px] text-[#5B665F] mb-2">Alergias conhecidas</label>
                  <div className="flex gap-2 flex-wrap">
                    {ALERGIAS_PILLS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleInArray(allergies, setAllergies, a)}
                        className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                          allergies.includes(a)
                            ? 'bg-[#0F766E] border-[#0F766E] text-white'
                            : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Queixa principal */}
            {currentStep === 3 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Queixa principal</h2>
                <label className="block text-[12.5px] text-[#5B665F] mb-2">Motivo da consulta</label>
                <div className="flex gap-2 flex-wrap mb-5">
                  {MOTIVOS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleInArray(motivos, setMotivos, m)}
                      className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                        motivos.includes(m)
                          ? 'bg-[#0F766E] border-[#0F766E] text-white'
                          : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <label className="block text-[12.5px] text-[#5B665F] mb-2.5">Escala de dor (EVA)</label>
                <div className="text-center bg-[#FFFDF9] border border-[#E4D8C4] rounded-[14px] p-4">
                  <div className="text-[24px]">{PAIN_EMOJIS[painScale]}</div>
                  <div className="text-[26px] font-semibold text-[#0F766E] my-0.5">{painScale}</div>
                  <div className="text-[12px] text-[#5B665F] mb-2.5">{PAIN_CAPTIONS[painScale]}</div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painScale}
                    onChange={(e) => setPainScale(parseInt(e.target.value))}
                    className="w-full accent-[#0F766E] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10.5px] text-[#9b9280] mt-0.5">
                    <span>0</span><span>10</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Mapa podal & conduta */}
            {currentStep === 4 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Mapa podal & conduta</h2>
                <label className="block text-[12.5px] text-[#5B665F] mb-2">Procedimentos realizados</label>
                <div className="flex gap-2 flex-wrap mb-5">
                  {PROCEDIMENTOS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleInArray(procedimentos, setProcedimentos, p)}
                      className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                        procedimentos.includes(p)
                          ? 'bg-[#0F766E] border-[#0F766E] text-white'
                          : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Risk category */}
                <div className="bg-[#E7EFE6] border border-[#5B7A63] rounded-[12px] p-3 mb-2.5">
                  <div className="text-[12.5px] font-semibold text-[#3F5645]">
                    {isDiabetic ? 'Categoria 3 — Risco alto' : hasCirculatoryIssues ? 'Categoria 2 — Risco moderado' : 'Categoria 0 — Risco muito baixo'}
                  </div>
                  <div className="text-[11.5px] text-[#5B7A63] mt-0.5">
                    {isDiabetic
                      ? 'Paciente com diabetes. Redobrar atenção a lesões e cortes.'
                      : hasCirculatoryIssues
                      ? 'Atenção a processos de cicatrização e uso de anticoagulantes.'
                      : 'Sem perda de sensibilidade protetora. Sem sinais de doença arterial periférica.'}
                  </div>
                </div>

                {usesAnticoagulant && (
                  <div className="bg-[#F6E4DA] border border-[#B5542B] rounded-[10px] p-2.5 mb-2">
                    <div className="text-[12px] font-semibold text-[#8a3a1f]">Redobrar cuidado com instrumentos cortantes</div>
                    <div className="text-[11px] text-[#8a3a1f] mt-0.5">Paciente relatou uso de anticoagulante.</div>
                  </div>
                )}

                {allergies.length > 0 && (
                  <div className="bg-[#F3E6D2] border border-[#C8A45A] rounded-[10px] p-2.5">
                    <div className="text-[12px] font-semibold text-[#8B5E1F]">Atenção na escolha de produtos</div>
                    <div className="text-[11px] text-[#8B5E1F] mt-0.5">Paciente relatou alergia a: {allergies.join(', ')}.</div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Assinaturas */}
            {currentStep === 5 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-1">Assinaturas</h2>
                <p className="text-[12.5px] text-[#5B665F] mb-4">Confirme o consentimento antes de concluir o atendimento</p>

                <label className="flex items-start gap-2 text-[12.5px] text-[#24312E] mb-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentInfo}
                    onChange={(e) => setConsentInfo(e.target.checked)}
                    className="mt-0.5 accent-[#0F766E]"
                  />
                  <span>Declaro que as informações prestadas são verdadeiras e autorizo o registro deste atendimento no prontuário clínico, conforme o Termo de Consentimento.</span>
                </label>
                <label className="flex items-start gap-2 text-[12.5px] text-[#24312E] mb-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentPhoto}
                    onChange={(e) => setConsentPhoto(e.target.checked)}
                    className="mt-0.5 accent-[#0F766E]"
                  />
                  <span>Autorizo o registro fotográfico dos pés para acompanhamento da evolução clínica.</span>
                </label>

                <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Assinatura do paciente</label>
                <div className="border border-dashed border-[#E4D8C4] rounded-[10px] h-16 flex items-center justify-center text-[12px] text-[#9b9280]">
                  Assine com o dedo
                </div>
              </div>
            )}

            {/* STEP 6: Conclusão */}
            {currentStep === 6 && (
              <div className="py-6">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-full bg-[#E7EFE6] text-[#5B7A63] flex items-center justify-center mx-auto mb-3">
                    <Check size={24} />
                  </div>
                  <h2 className="font-fraunces text-[19px] font-semibold text-[#24312E]">Atendimento concluído</h2>
                  <p className="text-[12px] text-[#5B665F] mt-1">Protocolo <b className="text-[#24312E]">20260905-QZL7</b></p>
                </div>

                <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[12px] p-3.5 mb-3.5">
                  <div className="text-[12.5px] font-semibold text-[#24312E] mb-0.5">Esta ficha não foi guardada no aparelho</div>
                  <div className="text-[11.5px] text-[#5B665F] mb-2.5">Ative o prontuário para manter várias fichas salvas com segurança. Baixe o PDF antes de sair.</div>
                  <button className="w-full border-none bg-[#0F766E] text-white text-[12.5px] font-medium py-2.5 rounded-[10px] cursor-pointer">
                    Ativar prontuário
                  </button>
                </div>

                <div className="space-y-2">
                  <button className="w-full flex items-center justify-center gap-1.5 border-none bg-[#0F766E] text-white text-[13px] font-medium py-2.5 rounded-[10px] cursor-pointer">
                    <Download size={15} /> Baixar ficha completa (PDF)
                  </button>
                  <button className="w-full flex items-center justify-center gap-1.5 border border-[#E4D8C4] bg-[#FFFDF9] text-[#24312E] text-[13px] font-medium py-2.5 rounded-[10px] cursor-pointer">
                    <Share2 size={15} /> Enviar para o paciente
                  </button>
                  <button className="w-full flex items-center justify-center gap-1.5 border border-[#E4D8C4] bg-[#FFFDF9] text-[#24312E] text-[13px] font-medium py-2.5 rounded-[10px] cursor-pointer">
                    <MessageSquare size={15} /> Abrir conversa no WhatsApp
                  </button>
                  <p className="text-center text-[11px] text-[#5B665F] my-1">O arquivo sai do seu aparelho apenas quando você escolhe enviar.</p>
                  <button className="w-full flex items-center justify-center gap-1.5 border border-[#E4D8C4] bg-[#FFFDF9] text-[#24312E] text-[13px] font-medium py-2.5 rounded-[10px] cursor-pointer">
                    <FileText size={15} /> Baixar resumo de 1 página
                  </button>
                  <button
                    onClick={() => { setCurrentStep(1); }}
                    className="w-full border border-[#E4D8C4] bg-[#FFFDF9] text-[#24312E] text-[13px] font-medium py-2.5 rounded-[10px] cursor-pointer"
                  >
                    Iniciar outra ficha
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-1.5 border-none bg-transparent text-[#5B665F] text-[12.5px] py-1.5 cursor-pointer"
                  >
                    <Home size={14} /> Voltar ao início
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer nav */}
        {currentStep <= fillSteps && (
          <div className="flex items-center justify-between px-5 sm:px-[22px] py-4 border-t border-[#E4D8C4] bg-[#FFFDF9] shrink-0">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-1 border border-[#E4D8C4] bg-[#FFFDF9] text-[#5B665F] text-[12.5px] font-medium py-2 px-4 rounded-[10px] cursor-pointer transition-all ${
                currentStep === 1 ? 'opacity-40' : ''
              }`}
            >
              <ChevronLeft size={14} /> Voltar
            </button>
            <span className="text-[11px] text-[#9b9280]">Rascunho salvo automaticamente</span>
            {currentStep === fillSteps ? (
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canAdvance()}
                className="flex items-center gap-1 border-none bg-[#0F766E] text-white text-[12.5px] font-medium py-2 px-4.5 rounded-[10px] cursor-pointer disabled:opacity-40"
              >
                Concluir <Check size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance()}
                className="flex items-center gap-1 border-none bg-[#0F766E] text-white text-[12.5px] font-medium py-2 px-4.5 rounded-[10px] cursor-pointer disabled:opacity-40"
              >
                Continuar <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
