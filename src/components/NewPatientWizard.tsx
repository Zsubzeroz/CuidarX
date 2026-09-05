import React, { useState } from 'react';
import { Patient } from '../types';
import { X, ChevronLeft, ChevronRight, Check, Download, Share2, MessageSquare, FileText, Home } from 'lucide-react';

interface NewPatientWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

const STEP_TITLES = [
  'Identificação',
  'Histórico de saúde',
  'Medicamentos & Alergias',
  'Queixa principal',
  'Exame físico',
  'Mapa podal & conduta',
  'Plano de tratamento',
  'Assinaturas',
];

const MOTIVOS = ['Unha encravada', 'Calo/calosidade', 'Micose', 'Pé diabético', 'Fissuras', 'Verruga', 'Dor no pé', 'Outro'];
const PROCEDIMENTOS = ['Corte técnico das unhas', 'Curetagem', 'Órtese ungueal', 'Hidratação', 'Aplicação de laser', 'Curativo', 'Espiculotomia', 'Desbridamento'];
const ALERGIAS_PILLS = ['Látex', 'Iodo', 'Anestésico local', 'Níquel', 'Sulfonamidas', 'Penicilina', 'Nenhum'];
const MEDICAMENTOS_PILLS = ['Anticoagulante', 'Antibiótico', 'Anti-hipertensivo', 'Antidiabético', 'Anti-inflamatório', 'Nenhum'];
const PAIN_CAPTIONS = ['Sem dor', 'Muito leve', 'Leve', 'Leve', 'Moderada', 'Moderada', 'Moderada', 'Forte', 'Forte', 'Muito forte', 'Insuportável'];
const PAIN_EMOJIS = ['😀', '🙂', '🙂', '😐', '😐', '😕', '😕', '😣', '😣', '😖', '😭'];

const PISADA_OPTIONS = [
  { value: 'neutra', label: 'Neutra' },
  { value: 'pronada', label: 'Pronada (para dentro)' },
  { value: 'supinada', label: 'Supinada (para fora)' },
];

const CALCADOS = ['Tênis esportivo', 'Sapato social', 'Chinelo', 'Bota', 'Descalço', 'Outro'];

export const NewPatientWizard: React.FC<NewPatientWizardProps> = ({ isOpen, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const fillSteps = 8;

  // Step 1: Identificação
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');

  // Step 2: Histórico de saúde
  const [isDiabetic, setIsDiabetic] = useState(false);
  const [isHypertensive, setIsHypertensive] = useState(false);
  const [hasCirculatoryIssues, setHasCirculatoryIssues] = useState(false);
  const [hasOtherConditions, setHasOtherConditions] = useState('');

  // Step 3: Medicamentos & Alergias
  const [medicamentos, setMedicamentos] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergiesOther, setAllergiesOther] = useState('');

  // Step 4: Queixa principal
  const [motivos, setMotivos] = useState<string[]>([]);
  const [painScale, setPainScale] = useState(0);
  const [queixaNotes, setQueixaNotes] = useState('');

  // Step 5: Exame físico
  const [footStrike, setFootStrike] = useState<'neutra' | 'pronada' | 'supinada'>('neutra');
  const [shoeHabit, setShoeHabit] = useState('');
  const [peRight, setPeRight] = useState('');
  const [peLeft, setPeLeft] = useState('');

  // Step 6: Mapa podal & conduta
  const [procedimentos, setProcedimentos] = useState<string[]>([]);
  const [condutaNotes, setCondutaNotes] = useState('');

  // Step 7: Plano de tratamento
  const [frequencia, setFrequencia] = useState('Semanal');
  const [duracao, setDuracao] = useState('4 semanas');
  const [planoNotes, setPlanoNotes] = useState('');

  // Step 8: Assinaturas
  const [consentInfo, setConsentInfo] = useState(false);
  const [consentPhoto, setConsentPhoto] = useState(false);

  if (!isOpen) return null;

  const progress = (currentStep / fillSteps) * 100;

  const toggleInArray = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const handleNext = () => {
    if (currentStep < fillSteps + 1) setCurrentStep(currentStep + 1);
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

    const allAllergies = [...allergies, ...(allergiesOther ? [allergiesOther] : [])].join(', ');

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      name: name.trim(),
      age,
      condition,
      locationDetails: peRight || peLeft || 'membros inferiores',
      timeAgo: 'Hoje',
      tagColor: isDiabetic ? 'clay' : 'teal',
      phone: phone.trim() || undefined,
      cpf: undefined,
      status: 'in-progress',
      isDiabetic,
      hasCirculatoryIssues,
      isHypertensive,
      allergies: allAllergies || undefined,
      painScale,
      footStrike,
      shoeHabit: shoeHabit || undefined,
      footMarkers: [],
      notes: [
        `Motivo: ${motivos.join(', ') || 'Não informado'}`,
        `Procedimentos: ${procedimentos.join(', ') || 'Nenhum'}`,
        `Frequência: ${frequencia}, Duração estimada: ${duracao}`,
        hasOtherConditions ? `Outras condições: ${hasOtherConditions}` : null,
        condutaNotes ? `Conduta: ${condutaNotes}` : null,
      ].filter(Boolean).join(' • '),
      timeline: [
        {
          id: `t-${Date.now()}`,
          date: 'Hoje',
          title: 'Primeira consulta e acolhimento',
          note: 'Realizada anamnese podológica completa, exame físico e plano de tratamento definido.',
          done: true,
          procedure: condition,
        },
      ],
      photos: [],
    };

    onSave(newPatient);
    onClose();
    resetState();
  };

  const resetState = () => {
    setCurrentStep(1);
    setName('');
    setBirthDate('');
    setPhone('');
    setGender('Feminino');
    setIsDiabetic(false);
    setIsHypertensive(false);
    setHasCirculatoryIssues(false);
    setHasOtherConditions('');
    setMedicamentos([]);
    setAllergies([]);
    setAllergiesOther('');
    setMotivos([]);
    setPainScale(0);
    setQueixaNotes('');
    setFootStrike('neutra');
    setShoeHabit('');
    setPeRight('');
    setPeLeft('');
    setProcedimentos([]);
    setCondutaNotes('');
    setFrequencia('Semanal');
    setDuracao('4 semanas');
    setPlanoNotes('');
    setConsentInfo(false);
    setConsentPhoto(false);
  };

  const handleRestart = () => {
    resetState();
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
              <button type="button" onClick={onClose} className="text-[#5B665F] hover:text-[#24312E] cursor-pointer">
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
                  <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Nome completo *</label>
                  <input type="text" placeholder="Nome do paciente" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full border-b border-[#E4D8C4] bg-transparent text-[14.5px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
                </div>
                <div className="flex gap-3.5 mb-4">
                  <div className="flex-1">
                    <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Data de nascimento</label>
                    <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E]" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Telefone / WhatsApp</label>
                    <input type="tel" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12.5px] text-[#5B665F] mb-2">Sexo / gênero</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['Feminino', 'Masculino', 'Outro'] as const).map((g) => (
                      <button key={g} type="button" onClick={() => setGender(g)}
                        className={`px-3.5 py-2 rounded-full text-[12.5px] border cursor-pointer transition-all ${
                          gender === g ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                        }`}>{g}</button>
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
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#E4D8C4]">
                    <span className="text-[13.5px] text-[#24312E]">{item.label}</span>
                    <button type="button" role="switch" aria-checked={item.val} onClick={() => item.set(!item.val)}
                      className={`relative inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        item.val ? 'bg-[#0F766E]' : 'bg-[#D1D5DB]'
                      }`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 mt-[1px] ${
                        item.val ? 'translate-x-[18px]' : 'translate-x-[1px]'
                      }`} />
                    </button>
                  </div>
                ))}

                <div className="mt-4">
                  <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Outras condições</label>
                  <input type="text" placeholder="Ex: Arritmia, asma, artrite..." value={hasOtherConditions}
                    onChange={(e) => setHasOtherConditions(e.target.value)}
                    className="w-full border-b border-[#E4D8C4] bg-transparent text-[13.5px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
                </div>
              </div>
            )}

            {/* STEP 3: Medicamentos & Alergias */}
            {currentStep === 3 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Medicamentos & Alergias</h2>

                <label className="block text-[12.5px] text-[#5B665F] mb-2">Medicamentos em uso</label>
                <div className="flex gap-2 flex-wrap mb-5">
                  {MEDICAMENTOS_PILLS.map((m) => (
                    <button key={m} type="button" onClick={() => toggleInArray(medicamentos, setMedicamentos, m)}
                      className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                        medicamentos.includes(m) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}>{m}</button>
                  ))}
                </div>

                <label className="block text-[12.5px] text-[#5B665F] mb-2">Alergias conhecidas</label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {ALERGIAS_PILLS.map((a) => (
                    <button key={a} type="button" onClick={() => toggleInArray(allergies, setAllergies, a)}
                      className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                        allergies.includes(a) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}>{a}</button>
                  ))}
                </div>
                <div>
                  <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Outra alergia</label>
                  <input type="text" placeholder="Descreva outra alergia" value={allergiesOther}
                    onChange={(e) => setAllergiesOther(e.target.value)}
                    className="w-full border-b border-[#E4D8C4] bg-transparent text-[13.5px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
                </div>
              </div>
            )}

            {/* STEP 4: Queixa principal */}
            {currentStep === 4 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Queixa principal</h2>
                <label className="block text-[12.5px] text-[#5B665F] mb-2">Motivo da consulta</label>
                <div className="flex gap-2 flex-wrap mb-5">
                  {MOTIVOS.map((m) => (
                    <button key={m} type="button" onClick={() => toggleInArray(motivos, setMotivos, m)}
                      className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                        motivos.includes(m) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}>{m}</button>
                  ))}
                </div>

                <label className="block text-[12.5px] text-[#5B665F] mb-2.5">Escala de dor (EVA)</label>
                <div className="text-center bg-[#FFFDF9] border border-[#E4D8C4] rounded-[14px] p-4 mb-4">
                  <div className="text-[24px]">{PAIN_EMOJIS[painScale]}</div>
                  <div className="text-[26px] font-semibold text-[#0F766E] my-0.5">{painScale}</div>
                  <div className="text-[12px] text-[#5B665F] mb-2.5">{PAIN_CAPTIONS[painScale]}</div>
                  <input type="range" min="0" max="10" value={painScale}
                    onChange={(e) => setPainScale(parseInt(e.target.value))}
                    className="w-full accent-[#0F766E] cursor-pointer" />
                  <div className="flex justify-between text-[10.5px] text-[#9b9280] mt-0.5"><span>0</span><span>10</span></div>
                </div>

                <div>
                  <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Observações da queixa</label>
                  <textarea rows={2} placeholder="Descreva os sintomas, quando começou, o que melhora/piora..." value={queixaNotes}
                    onChange={(e) => setQueixaNotes(e.target.value)}
                    className="w-full border-b border-[#E4D8C4] bg-transparent text-[13px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF] resize-none" />
                </div>
              </div>
            )}

            {/* STEP 5: Exame físico */}
            {currentStep === 5 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Exame físico</h2>

                <label className="block text-[12.5px] text-[#5B665F] mb-2">Tipo de pisada</label>
                <div className="flex gap-2 flex-wrap mb-5">
                  {PISADA_OPTIONS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setFootStrike(p.value as any)}
                      className={`px-3.5 py-2 rounded-full text-[12.5px] border cursor-pointer transition-all ${
                        footStrike === p.value ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}>{p.label}</button>
                  ))}
                </div>

                <label className="block text-[12.5px] text-[#5B665F] mb-2">Hábito de calçados</label>
                <div className="flex gap-2 flex-wrap mb-5">
                  {CALCADOS.map((c) => (
                    <button key={c} type="button" onClick={() => setShoeHabit(c)}
                      className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                        shoeHabit === c ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}>{c}</button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Pé direito — achados</label>
                    <textarea rows={3} placeholder="Ex: calosidade plantar, onicocriptose lateral..." value={peRight}
                      onChange={(e) => setPeRight(e.target.value)}
                      className="w-full border border-[#E4D8C4] bg-[#FFFDF9] rounded-[10px] px-3 py-2 text-[12.5px] text-[#24312E] outline-none focus:border-[#0F766E] resize-none" />
                  </div>
                  <div>
                    <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Pé esquerdo — achados</label>
                    <textarea rows={3} placeholder="Ex: fissura calcânea, micose subungueal..." value={peLeft}
                      onChange={(e) => setPeLeft(e.target.value)}
                      className="w-full border border-[#E4D8C4] bg-[#FFFDF9] rounded-[10px] px-3 py-2 text-[12.5px] text-[#24312E] outline-none focus:border-[#0F766E] resize-none" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Mapa podal & conduta */}
            {currentStep === 6 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Mapa podal & conduta</h2>
                <label className="block text-[12.5px] text-[#5B665F] mb-2">Procedimentos realizados</label>
                <div className="flex gap-2 flex-wrap mb-5">
                  {PROCEDIMENTOS.map((p) => (
                    <button key={p} type="button" onClick={() => toggleInArray(procedimentos, setProcedimentos, p)}
                      className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                        procedimentos.includes(p) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}>{p}</button>
                  ))}
                </div>

                <div className={`border rounded-[12px] p-3 mb-2.5 ${
                  isDiabetic ? 'bg-[#F6E4DA] border-[#B5542B]' : hasCirculatoryIssues ? 'bg-[#F3E6D2] border-[#C8A45A]' : 'bg-[#E7EFE6] border-[#5B7A63]'
                }`}>
                  <div className={`text-[12.5px] font-semibold ${
                    isDiabetic ? 'text-[#8a3a1f]' : hasCirculatoryIssues ? 'text-[#8B5E1F]' : 'text-[#3F5645]'
                  }`}>
                    {isDiabetic ? 'Categoria 3 — Risco alto' : hasCirculatoryIssues ? 'Categoria 2 — Risco moderado' : 'Categoria 0 — Risco muito baixo'}
                  </div>
                  <div className={`text-[11.5px] mt-0.5 ${
                    isDiabetic ? 'text-[#8a3a1f]' : hasCirculatoryIssues ? 'text-[#8B5E1F]' : 'text-[#5B7A63]'
                  }`}>
                    {isDiabetic ? 'Paciente com diabetes. Redobrar atenção a lesões e cortes.'
                      : hasCirculatoryIssues ? 'Atenção a processos de cicatrização e uso de anticoagulantes.'
                      : 'Sem perda de sensibilidade protetora. Sem sinais de doença arterial periférica.'}
                  </div>
                </div>

                {medicamentos.includes('Anticoagulante') && (
                  <div className="bg-[#F6E4DA] border border-[#B5542B] rounded-[10px] p-2.5 mb-2">
                    <div className="text-[12px] font-semibold text-[#8a3a1f]">Redobrar cuidado com instrumentos cortantes</div>
                    <div className="text-[11px] text-[#8a3a1f] mt-0.5">Paciente relatou uso de anticoagulante.</div>
                  </div>
                )}

                {allergies.length > 0 && !allergies.includes('Nenhum') && (
                  <div className="bg-[#F3E6D2] border border-[#C8A45A] rounded-[10px] p-2.5 mb-3">
                    <div className="text-[12px] font-semibold text-[#8B5E1F]">Atenção na escolha de produtos</div>
                    <div className="text-[11px] text-[#8B5E1F] mt-0.5">Paciente relatou alergia a: {allergies.filter(a => a !== 'Nenhum').join(', ')}.</div>
                  </div>
                )}

                <div>
                  <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Conduta clínica observações</label>
                  <textarea rows={2} placeholder="Descrição da conduta tomada durante a sessão..." value={condutaNotes}
                    onChange={(e) => setCondutaNotes(e.target.value)}
                    className="w-full border-b border-[#E4D8C4] bg-transparent text-[13px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF] resize-none" />
                </div>
              </div>
            )}

            {/* STEP 7: Plano de tratamento */}
            {currentStep === 7 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Plano de tratamento</h2>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Frequência sugerida</label>
                    <select value={frequencia} onChange={(e) => setFrequencia(e.target.value)}
                      className="w-full border border-[#E4D8C4] bg-[#FFFDF9] rounded-[10px] px-3 py-2.5 text-[13px] text-[#24312E] outline-none focus:border-[#0F766E]">
                      <option>Semanal</option>
                      <option>Quinzenal</option>
                      <option>Mensal</option>
                      <option>Conforme necessidade</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Duração estimada</label>
                    <select value={duracao} onChange={(e) => setDuracao(e.target.value)}
                      className="w-full border border-[#E4D8C4] bg-[#FFFDF9] rounded-[10px] px-3 py-2.5 text-[13px] text-[#24312E] outline-none focus:border-[#0F766E]">
                      <option>2 semanas</option>
                      <option>4 semanas</option>
                      <option>6 semanas</option>
                      <option>8 semanas</option>
                      <option>12 semanas</option>
                      <option>Manutenção contínua</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Orientações e plano detalhado</label>
                  <textarea rows={4} placeholder="Ex:Realizar corte técnico a cada 15 dias, aplicação de órtese ungueal, evitar calçados apertados..." value={planoNotes}
                    onChange={(e) => setPlanoNotes(e.target.value)}
                    className="w-full border border-[#E4D8C4] bg-[#FFFDF9] rounded-[10px] px-3 py-2.5 text-[13px] text-[#24312E] outline-none focus:border-[#0F766E] resize-none" />
                </div>

                <div className="mt-4 bg-[#E3EEEC] border border-[#0F766E]/20 rounded-[12px] p-3">
                  <div className="text-[12.5px] font-semibold text-[#0F766E] mb-1">Resumo do plano</div>
                  <div className="text-[12px] text-[#24312E] leading-relaxed">
                    <b>Frequência:</b> {frequencia} · <b>Duração:</b> {duracao}
                    {motivos.length > 0 && <><br /><b>Tratando:</b> {motivos.join(', ')}</>}
                    {procedimentos.length > 0 && <><br /><b>Procedimentos:</b> {procedimentos.join(', ')}</>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: Assinaturas */}
            {currentStep === 8 && (
              <div className="pb-6">
                <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-1">Assinaturas</h2>
                <p className="text-[12.5px] text-[#5B665F] mb-4">Confirme o consentimento antes de concluir o atendimento</p>

                <label className="flex items-start gap-2 text-[12.5px] text-[#24312E] mb-3.5 cursor-pointer">
                  <input type="checkbox" checked={consentInfo} onChange={(e) => setConsentInfo(e.target.checked)} className="mt-0.5 accent-[#0F766E]" />
                  <span>Declaro que as informações prestadas são verdadeiras e autorizo o registro deste atendimento no prontuário clínico, conforme o Termo de Consentimento.</span>
                </label>
                <label className="flex items-start gap-2 text-[12.5px] text-[#24312E] mb-5 cursor-pointer">
                  <input type="checkbox" checked={consentPhoto} onChange={(e) => setConsentPhoto(e.target.checked)} className="mt-0.5 accent-[#0F766E]" />
                  <span>Autorizo o registro fotográfico dos pés para acompanhamento da evolução clínica.</span>
                </label>

                <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Assinatura do paciente</label>
                <div className="border border-dashed border-[#E4D8C4] rounded-[10px] h-16 flex items-center justify-center text-[12px] text-[#9b9280]">
                  Assine com o dedo
                </div>
              </div>
            )}

            {/* STEP 9: Conclusão */}
            {currentStep === fillSteps + 1 && (
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
                  <button onClick={handleRestart}
                    className="w-full border border-[#E4D8C4] bg-[#FFFDF9] text-[#24312E] text-[13px] font-medium py-2.5 rounded-[10px] cursor-pointer">
                    Iniciar outra ficha
                  </button>
                  <button onClick={onClose}
                    className="w-full flex items-center justify-center gap-1.5 border-none bg-transparent text-[#5B665F] text-[12.5px] py-1.5 cursor-pointer">
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
            <button type="button" onClick={handleBack} disabled={currentStep === 1}
              className={`flex items-center gap-1 border border-[#E4D8C4] bg-[#FFFDF9] text-[#5B665F] text-[12.5px] font-medium py-2 px-4 rounded-[10px] cursor-pointer transition-all ${
                currentStep === 1 ? 'opacity-40' : ''
              }`}>
              <ChevronLeft size={14} /> Voltar
            </button>
            <span className="text-[11px] text-[#9b9280]">Rascunho salvo automaticamente</span>
            {currentStep === fillSteps ? (
              <button type="button" onClick={handleNext} disabled={!canAdvance()}
                className="flex items-center gap-1 border-none bg-[#0F766E] text-white text-[12.5px] font-medium py-2 px-4.5 rounded-[10px] cursor-pointer disabled:opacity-40">
                Concluir <Check size={14} />
              </button>
            ) : (
              <button type="button" onClick={handleNext} disabled={!canAdvance()}
                className="flex items-center gap-1 border-none bg-[#0F766E] text-white text-[12.5px] font-medium py-2 px-4.5 rounded-[10px] cursor-pointer disabled:opacity-40">
                Continuar <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
