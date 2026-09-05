import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Patient } from '../types';
import { X, ChevronDown, ChevronLeft, ChevronRight, Check, Download, Share2, MessageSquare, FileText, Home, Camera, Plus, AlertTriangle, ShieldAlert } from 'lucide-react';

interface NewPatientWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

const TOTAL_STEPS = 8;
const STEP_TITLES = [
  'Identificação',
  'Histórico de Saúde',
  'Hábitos e Calçados',
  'Queixa Principal',
  'Exame Físico',
  'Mapa Podal',
  'Conduta e Orientações',
  'Assinaturas',
];

const MANDATORY_STEPS = [1, 5, 7, 8];

const MOTIVOS = ['Unha encravada', 'Calo/calosidade', 'Rachadura no calcanhar', 'Micose', 'Unha grossa/amarelada', 'Verruga', 'Dor ao caminhar', 'Manutenção/estética', 'Pé diabético', 'Outro'];
const DURACAO_QUEIXA = ['Recente (dias)', 'Semanas', 'Meses', 'Anos', 'Crônica'];
const PIORA_DOR = ['Repouso', 'Caminhar', 'Calçado apertado', 'Umidade', 'Calor', 'Frio', 'Pressão', 'Não sei'];
const PROCEDIMENTOS = ['Limpeza e assepsia', 'Corte técnico das unhas', 'Curetagem', 'Tratamento de hiperqueratose', 'Fixação de vela', 'Regularização', 'Foliculação de circunscritas', 'Curetas', 'Aplicação de antifúngico', 'Aplicação de hidratante', 'Massagem', 'Fototerapia dinâmica', 'Encaminhamento', 'Outro'];
const ORIENTACOES_PIL = ['Evitar apertar', 'Manter seco', 'Hidratar diariamente', 'Não arrancar unha', 'Usar calçado adequado', 'Voltar em X dias', 'Evitar esmalte', 'Usar órtese'];
const ENCAMINHAMENTOS = ['Não', 'Angiologista', 'Endocrinologista', 'Dermatologista', 'Ortopedista', 'Clínica geral', 'Fisioterapeuta'];
const RETORNO_SUGERIDO = ['7 dias', '15 dias', '21 dias', '30 dias', '45 dias', '60 dias'];
const CALCADOS = ['Tênis', 'Social/couro', 'Sapatilha', 'Salto alto', 'Sandália/rasteira', 'Bota', 'Chinelo', 'Segurança/EPI', 'Descalço'];
const ALTURA_SALTO = ['Plano', 'Até 2cm', 'Até 5cm', 'Acima de 5cm', 'Variável'];
const TIPO_MEIA = ['Algodão', 'Sintética', 'Sem meia', 'Térmica', 'Calça/social'];
const ATIVIDADE_FISICA = ['Não pratica', 'Leve (caminhada)', 'Moderada (musculação)', 'Intensa (corrida, esportes)'];
const FREQUENCIA_HIGIENE = ['Diária', 'A cada 2 dias', 'Semanal', 'Raramente'];
const ACHADOS_FISICO = ['Normal', 'Alterado'];
const TIPO_ACHADO = ['Onicocriptose', 'Hiperqueratose', 'Fissura', 'Ortoníquia', 'Verruga plantar', 'Bolha', 'Calo', 'Micose de pele', 'Ferida'];
const ACHADO_COLORS: Record<string, string> = {
  'Onicocriptose': '#B5542B',
  'Hiperqueratose': '#C8A45A',
  'Fissura': '#8B5E1F',
  'Ortoníquia': '#B5542B',
  'Verruga plantar': '#5B7A63',
  'Bolha': '#C8A45A',
  'Calo': '#C8A45A',
  'Micose de pele': '#5B7A63',
  'Ferida': '#B5542B',
};

const PAIN_CAPTIONS = ['Sem dor', 'Muito leve', 'Leve', 'Leve', 'Moderada', 'Moderada', 'Moderada', 'Forte', 'Forte', 'Muito forte', 'Insuportável'];
const PAIN_EMOJIS = ['😀', '🙂', '🙂', '😐', '😐', '😕', '😕', '😣', '😣', '😖', '😭'];

const ACHADOS_PESO = ['Pulsos presentes', 'Sibilidade reduzida', 'Coloração normal', 'Temperatura normal', 'Edema', 'Cianose', 'Palidez', 'Calor local'];

export const NewPatientWizard: React.FC<NewPatientWizardProps> = ({ isOpen, onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showStepMenu, setShowStepMenu] = useState(false);
  const [savedTime, setSavedTime] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Step 1: Identificação
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [cpf, setCpf] = useState('');
  const [profissao, setProfissao] = useState('');
  const [dataAtendimento, setDataAtendimento] = useState(new Date().toISOString().split('T')[0]);
  const [phone, setPhone] = useState('');

  // Step 2: Histórico de Saúde
  const [diabetes, setDiabetes] = useState(false);
  const [hipertensao, setHipertensao] = useState(false);
  const [doencaCardiaca, setDoencaCardiaca] = useState(false);
  const [doencaRenal, setDoencaRenal] = useState(false);
  const [circulatorio, setCirculatorio] = useState(false);
  const [neuropatia, setNeuropatia] = useState(false);
  const [tireoide, setTireoide] = useState(false);
  const [artrite, setArtrite] = useState(false);
  const [psoriase, setPsoriase] = useState(false);
  const [cancer, setCancer] = useState(false);
  const [imunossuprimido, setImunossuprimido] = useState(false);
  const [epilepsia, setEpilepsia] = useState(false);
  const [marcapasso, setMarcapasso] = useState(false);
  const [gestante, setGestante] = useState(false);
  const [medicamentos, setMedicamentos] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiasOther, setAlergiasOther] = useState('');
  const [tabagismo, setTabagismo] = useState(false);
  const [etilismo, setEtilismo] = useState(false);
  const [atividadeFisica, setAtividadeFisica] = useState(false);
  const [cirurgias, setCirurgias] = useState(false);
  const [tratamentoAnterior, setTratamentoAnterior] = useState(false);
  const [historicoObs, setHistoricoObs] = useState('');

  // Step 3: Hábitos e Calçados
  const [calcadoDiaDia, setCalcadoDiaDia] = useState<string[]>([]);
  const [alturaSalto, setAlturaSalto] = useState('');
  const [calcadoAperta, setCalcadoAperta] = useState<boolean | null>(null);
  const [tipoMeia, setTipoMeia] = useState('');
  const [horasEmPe, setHorasEmPe] = useState('');
  const [atividadeFisicaTipo, setAtividadeFisicaTipo] = useState('');
  const [freqAtividade, setFreqAtividade] = useState('');
  const [higieneFreq, setHigieneFreq] = useState('');
  const [hidratacaoFreq, setHidrataFreq] = useState('');
  const [descalcasEmCasa, setDescalcasEmCasa] = useState<boolean | null>(null);
  const [cortaUnhas, setCortaUnhas] = useState<boolean | null>(null);
  const [usaEsmalte, setUsaEsmalte] = useState<boolean | null>(null);

  // Step 4: Queixa Principal
  const [motivos, setMotivos] = useState<string[]>([]);
  const [queixaDesc, setQueixaDesc] = useState('');
  const [duracaoQueixa, setDuracaoQueixa] = useState('');
  const [painScale, setPainScale] = useState(0);
  const [pioraDor, setPioraDor] = useState<string[]>([]);
  const [tentativasAnteriores, setTentativasAnteriores] = useState('');

  // Step 5: Exame Físico
  const [pulso, setPulso] = useState('Normal');
  const [sensibilidade, setSensibilidade] = useState('Normal');
  const [coloracao, setColoracao] = useState('Normal');
  const [temperatura, setTemperatura] = useState('Normal');
  const [edema, setEdema] = useState('Normal');
  const [exameObs, setExameObs] = useState('');

  // Step 6: Mapa Podal
  const [achadosMapa, setAchadosMapa] = useState<string[]>([]);
  const [mapaObs, setMapaObs] = useState('');
  const [fotoDorsalDir, setFotoDorsalDir] = useState(false);
  const [fotoDorsalEsq, setFotoDorsalEsq] = useState(false);
  const [fotoPlantarDir, setFotoPlantarDir] = useState(false);
  const [fotoPlantarEsq, setFotoPlantarEsq] = useState(false);

  // Step 7: Conduta e Orientações
  const [procedimentos, setProcedimentos] = useState<string[]>([]);
  const [produtosUtilizados, setProdutosUtilizados] = useState<string[]>([]);
  const [produtoInput, setProdutoInput] = useState('');
  const [orientacoes, setOrientacoes] = useState<string[]>([]);
  const [orientacaoExtra, setOrientacaoExtra] = useState('');
  const [encaminhamento, setEncaminhamento] = useState('Não');
  const [retornoSugerido, setRetornoSugerido] = useState('');
  const [condutaObs, setCondutaObs] = useState('');

  // Step 8: Assinaturas
  const [consentProntuario, setConsentProntuario] = useState(false);
  const [consentImagens, setConsentImagens] = useState(false);
  const [assinaturaPaciente, setAssinaturaPaciente] = useState('');
  const [nomeAssinante, setNomeAssinante] = useState('');
  const [tipoAssinante, setTipoAssinante] = useState('Paciente');
  const [assinaturaProfissional, setAssinaturaProfissional] = useState('');
  const [localAtendimento, setLocalAtendimento] = useState('');

  const now = new Date();
  const autosaveTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  useEffect(() => {
    setSavedTime(autosaveTime);
  }, [currentStep, autosaveTime]);

  useEffect(() => {
    setHasChanges(true);
  }, [name, birthDate, gender, phone, cpf, profissao, dataAtendimento, diabetes, hipertensao, doencaCardiaca, doencaRenal, circulatorio, neuropatia, tireoide, artrite, psoriase, cancer, imunossuprimido, epilepsia, marcapasso, gestante, medicamentos, alergias, alergiasOther, tabagismo, etilismo, atividadeFisica, cirurgias, tratamentoAnterior, historicoObs, calcadoDiaDia, alturaSalto, calcadoAperta, tipoMeia, horasEmPe, atividadeFisicaTipo, freqAtividade, higieneFreq, hidratacaoFreq, descalcasEmCasa, cortaUnhas, usaEsmalte, motivos, queixaDesc, duracaoQueixa, painScale, pioraDor, tentativasAnteriores, pulso, sensibilidade, coloracao, temperatura, edema, exameObs, achadosMapa, mapaObs, procedimentos, produtosUtilizados, orientacoes, orientacaoExtra, encaminhamento, retornoSugerido, condutaObs, consentProntuario, consentImagens, assinaturaPaciente, nomeAssinante, tipoAssinante, assinaturaProfissional, localAtendimento]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowStepMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const toggleInArray = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const isStepMandatory = (step: number) => MANDATORY_STEPS.includes(step);

  const isStepIncomplete = (step: number) => {
    switch (step) {
      case 1: return !name.trim();
      case 5: return pulso === 'Normal' && sensibilidade === 'Normal' && coloracao === 'Normal' && temperatura === 'Normal' && edema === 'Normal' && !exameObs.trim();
      case 7: return procedimentos.length === 0;
      case 8: return !consentProntuario || !consentImagens || !assinaturaPaciente.trim();
      default: return false;
    }
  };

  const canAdvance = () => {
    if (currentStep === 1) return name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowConfirmClose(false);
    onClose();
  };

  const buildPatient = (): Patient => {
    const age = birthDate ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 35;
    const condition = motivos.length > 0 ? motivos[0] : 'Avaliação Geral';
    const allAllergies = [...alergias, ...(alergiasOther ? [alergiesOther] : [])].join(', ');

    const hasDiabetes = diabetes || isDiabetic;
    const hasCirc = circulatorio || hasCirculatoryIssues;

    return {
      id: `pat-${Date.now()}`,
      name: name.trim(),
      age,
      condition,
      locationDetails: achadosMapa.length > 0 ? achadosMapa.join(', ') : 'membros inferiores',
      timeAgo: 'Hoje',
      tagColor: hasDiabetes ? 'clay' : hasCirc ? 'sage' : 'teal',
      phone: phone.trim() || undefined,
      cpf: cpf.trim() || undefined,
      status: 'in-progress',
      isDiabetic: hasDiabetes,
      hasCirculatoryIssues: hasCirc,
      isHypertensive: hipertensao,
      allergies: allAllergies || undefined,
      painScale,
      footStrike: 'neutra',
      shoeHabit: calcadoDiaDia[0] || undefined,
      footMarkers: [],
      notes: [
        `Motivo: ${motivos.join(', ') || 'Não informado'}`,
        `Procedimentos: ${procedimentos.join(', ') || 'Nenhum'}`,
        `Retorno: ${retornoSugerido || 'Não definido'}`,
        historicoObs ? `Histórico: ${historicoObs}` : null,
        condutaObs ? `Conduta: ${condutaObs}` : null,
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
  };

  const handleFinish = () => {
    const patient = buildPatient();
    onSave(patient);
    onClose();
    resetState();
  };

  const resetState = () => {
    setCurrentStep(1);
    setName(''); setBirthDate(''); setGender(''); setCpf(''); setProfissao('');
    setDataAtendimento(new Date().toISOString().split('T')[0]); setPhone('');
    setDiabetes(false); setHipertensao(false); setDoencaCardiaca(false);
    setDoencaRenal(false); setCirculatorio(false); setNeuropatia(false);
    setTireoide(false); setArtrite(false); setPsoriase(false); setCancer(false);
    setImunossuprimido(false); setEpilepsia(false); setMarcapasso(false);
    setGestante(false); setMedicamentos(''); setAlergias([]); setAlergiasOther('');
    setTabagismo(false); setEtilismo(false); setAtividadeFisica(false);
    setCirurgias(false); setTratamentoAnterior(false); setHistoricoObs('');
    setCalcadoDiaDia([]); setAlturaSalto(''); setCalcadoAperta(null);
    setTipoMeia(''); setHorasEmPe(''); setAtividadeFisicaTipo('');
    setFreqAtividade(''); setHigieneFreq(''); setHidrataFreq('');
    setDescalcasEmCasa(null); setCortaUnhas(null); setUsaEsmalte(null);
    setMotivos([]); setQueixaDesc(''); setDuracaoQueixa(''); setPainScale(0);
    setPioraDor([]); setTentativasAnteriores('');
    setPulso('Normal'); setSensibilidade('Normal'); setColoracao('Normal');
    setTemperatura('Normal'); setEdema('Normal'); setExameObs('');
    setAchadosMapa([]); setMapaObs('');
    setFotoDorsalDir(false); setFotoDorsalEsq(false);
    setFotoPlantarDir(false); setFotoPlantarEsq(false);
    setProcedimentos([]); setProdutosUtilizados([]); setProdutoInput('');
    setOrientacoes([]); setOrientacaoExtra(''); setEncaminhamento('Não');
    setRetornoSugerido(''); setCondutaObs('');
    setConsentProntuario(false); setConsentImagens(false);
    setAssinaturaPaciente(''); setNomeAssinante(''); setTipoAssinante('Paciente');
    setAssinaturaProfissional(''); setLocalAtendimento('');
    setHasChanges(false);
  };

  const handleRestart = () => {
    resetState();
    setCurrentStep(1);
  };

  const StepContent: React.FC = () => {
    switch (currentStep) {
      case 1: return (
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
          <div className="mb-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-2">Sexo / gênero</label>
            <div className="flex gap-2 flex-wrap">
              {['Feminino', 'Masculino', 'Outro', 'Prefiro não informar'].map((g) => (
                <button key={g} type="button" onClick={() => setGender(g)}
                  className={`px-3.5 py-2 rounded-full text-[12.5px] border cursor-pointer transition-all ${
                    gender === g ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                  }`}>{g}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3.5 mb-4">
            <div className="flex-1">
              <label className="block text-[12.5px] text-[#5B665F] mb-1.5">CPF (opcional)</label>
              <input type="text" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)}
                className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
            </div>
            <div className="flex-1">
              <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Profissão</label>
              <input type="text" placeholder="Ex: Enfermeira" value={profissao} onChange={(e) => setProfissao(e.target.value)}
                className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
            </div>
          </div>
          <div>
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Data do atendimento</label>
            <input type="date" value={dataAtendimento} onChange={(e) => setDataAtendimento(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E]" />
          </div>
        </div>
      );

      case 2: return (
        <div className="pb-6">
          <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-1">Histórico de Saúde</h2>
          <p className="text-[12.5px] text-[#5B665F] mb-4">Ative as condições registradas pelo paciente</p>

          <div className="space-y-0">
            {[
              { label: 'Diabetes', val: diabetes, set: setDiabetes },
              { label: 'Hipertensão', val: hipertensao, set: setHipertensao },
              { label: 'Doença cardíaca', val: doencaCardiaca, set: setDoencaCardiaca },
              { label: 'Doença renal', val: doencaRenal, set: setDoencaRenal },
              { label: 'Alteração circulatória', val: circulatorio, set: setCirculatorio },
              { label: 'Neuropatia diagnosticada', val: neuropatia, set: setNeuropatia },
              { label: 'Doença de tireoide', val: tireoide, set: setTireoide },
              { label: 'Artrite/artrose/gota', val: artrite, set: setArtrite },
              { label: 'Psoríase/dermatite/eczema', val: psoriase, set: setPsoriase },
              { label: 'Câncer', val: cancer, set: setCancer },
              { label: 'Imunossuprimido', val: imunossuprimido, set: setImunossuprimido },
              { label: 'Epilepsia', val: epilepsia, set: setEpilepsia },
              { label: 'Marcapasso ou implante metálico', val: marcapasso, set: setMarcapasso },
              { label: 'Gestante', val: gestante, set: setGestante },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-[#E4D8C4]">
                <span className="text-[13px] text-[#24312E]">{item.label}</span>
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
          </div>

          <div className="mt-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Medicamentos em uso contínuo</label>
            <input type="text" placeholder="Ex: Losartana, Metformina, Varfarina..." value={medicamentos}
              onChange={(e) => setMedicamentos(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[13.5px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
          </div>

          <div className="mt-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-2">Alergias conhecidas</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {['Látex', 'Iodo/PVPI', 'Clorexidina', 'Anestésico local', 'Esmalte/esmaltado', 'Níquel', 'Medicamento', 'Outro'].map((a) => (
                <button key={a} type="button" onClick={() => toggleInArray(alergias, setAlergias, a)}
                  className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                    alergias.includes(a) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                  }`}>{a}</button>
              ))}
            </div>
            {alergias.includes('Outro') && (
              <input type="text" placeholder="Descreva outra alergia" value={alergiasOther}
                onChange={(e) => setAlergiasOther(e.target.value)}
                className="w-full border-b border-[#E4D8C4] bg-transparent text-[13.5px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
            )}
          </div>

          <div className="mt-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-2">Hábitos</label>
            <div className="space-y-0">
              {[
                { label: 'Tabagismo', val: tabagismo, set: setTabagismo },
                { label: 'Etilismo', val: etilismo, set: setEtilismo },
                { label: 'Pratica atividade física', val: atividadeFisica, set: setAtividadeFisica },
                { label: 'Cirurgias prévias nos pés/pernas', val: cirurgias, set: setCirurgias },
                { label: 'Já fez tratamento podológico antes', val: tratamentoAnterior, set: setTratamentoAnterior },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-[#E4D8C4]">
                  <span className="text-[13px] text-[#24312E]">{item.label}</span>
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
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Observações gerais</label>
            <textarea rows={2} placeholder="Informações adicionais relevantes..." value={historicoObs}
              onChange={(e) => setHistoricoObs(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[13px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF] resize-none" />
          </div>
        </div>
      );

      case 3: return (
        <div className="pb-6">
          <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Hábitos e Calçados</h2>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Tipo de calçado do dia a dia</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {CALCADOS.map((c) => (
              <button key={c} type="button" onClick={() => toggleInArray(calcadoDiaDia, setCalcadoDiaDia, c)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  calcadoDiaDia.includes(c) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{c}</button>
            ))}
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Altura do salto habitual</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {ALTURA_SALTO.map((a) => (
              <button key={a} type="button" onClick={() => setAlturaSalto(a)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  alturaSalto === a ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{a}</button>
            ))}
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">O calçado aperta?</label>
          <div className="flex gap-2 mb-5">
            {[true, false].map((v) => (
              <button key={String(v)} type="button" onClick={() => setCalcadoAperta(v)}
                className={`px-5 py-2 rounded-full text-[12.5px] border cursor-pointer transition-all ${
                  calcadoAperta === v ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{v ? 'Sim' : 'Não'}</button>
            ))}
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Tipo de meia</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {TIPO_MEIA.map((t) => (
              <button key={t} type="button" onClick={() => setTipoMeia(t)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  tipoMeia === t ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{t}</button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Horas por dia em pé</label>
            <input type="text" placeholder="Ex: 8 horas" value={horasEmPe} onChange={(e) => setHorasEmPe(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Atividade física</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {ATIVIDADE_FISICA.map((a) => (
              <button key={a} type="button" onClick={() => setAtividadeFisicaTipo(a)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  atividadeFisicaTipo === a ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{a}</button>
            ))}
          </div>

          {atividadeFisicaTipo && atividadeFisicaTipo !== 'Não pratica' && (
            <div className="mb-4">
              <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Frequência</label>
              <input type="text" placeholder="Ex: 3x por semana" value={freqAtividade} onChange={(e) => setFreqAtividade(e.target.value)}
                className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
            </div>
          )}

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Frequência de higiene dos pés</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {FREQUENCIA_HIGIENE.map((f) => (
              <button key={f} type="button" onClick={() => setHigieneFreq(f)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  higieneFreq === f ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{f}</button>
            ))}
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Frequência de hidratação dos pés</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {FREQUENCIA_HIGIENE.map((f) => (
              <button key={f} type="button" onClick={() => setHidrataFreq(f)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  hidratacaoFreq === f ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{f}</button>
            ))}
          </div>

          <div className="space-y-3">
            {[
              { label: 'Anda descalço em casa?', val: descalcasEmCasa, set: setDescalcasEmCasa },
              { label: 'Corta as próprias unhas?', val: cortaUnhas, set: setCortaUnhas },
              { label: 'Usa esmalte continuamente?', val: usaEsmalte, set: setUsaEsmalte },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-[12.5px] text-[#5B665F] mb-2">{item.label}</label>
                <div className="flex gap-2">
                  {[true, false].map((v) => (
                    <button key={String(v)} type="button" onClick={() => item.set(v)}
                      className={`px-5 py-2 rounded-full text-[12.5px] border cursor-pointer transition-all ${
                        item.val === v ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}>{v ? 'Sim' : 'Não'}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      case 4: return (
        <div className="pb-6">
          <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Queixa Principal</h2>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Motivo da consulta</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {MOTIVOS.map((m) => (
              <button key={m} type="button" onClick={() => toggleInArray(motivos, setMotivos, m)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  motivos.includes(m) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{m}</button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Descrição nas palavras do paciente</label>
            <textarea rows={3} placeholder="Ex: 'Dói quando aperto o canto da unha, nasceu carne viva...'" value={queixaDesc}
              onChange={(e) => setQueixaDesc(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[13px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF] resize-none" />
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Há quanto tempo?</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {DURACAO_QUEIXA.map((d) => (
              <button key={d} type="button" onClick={() => setDuracaoQueixa(d)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  duracaoQueixa === d ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{d}</button>
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

          <label className="block text-[12.5px] text-[#5B665F] mb-2">O que piora a dor?</label>
          <div className="flex gap-2 flex-wrap mb-4">
            {PIORA_DOR.map((p) => (
              <button key={p} type="button" onClick={() => toggleInArray(pioraDor, setPioraDor, p)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  pioraDor.includes(p) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{p}</button>
            ))}
          </div>

          <div>
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Tentativas anteriores de tratamento</label>
            <textarea rows={2} placeholder="Ex: 'Já passou com outro podólogo, usou cremes, não melhorou...'" value={tentativasAnteriores}
              onChange={(e) => setTentativasAnteriores(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[13px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF] resize-none" />
          </div>
        </div>
      );

      case 5: return (
        <div className="pb-6">
          <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Exame Físico</h2>

          <div className="space-y-3">
            {[
              { label: 'Pulsos pediosos/tibiais', val: pulso, set: setPulso },
              { label: 'Sensibilidade protetora', val: sensibilidade, set: setSensibilidade },
              { label: 'Coloração da pele', val: coloracao, set: setColoracao },
              { label: 'Temperatura dos pés', val: temperatura, set: setTemperatura },
              { label: 'Presença de edema', val: edema, set: setEdema },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-[12.5px] text-[#5B665F] mb-2">{item.label}</label>
                <div className="flex gap-2">
                  {ACHADOS_FISICO.map((a) => (
                    <button key={a} type="button" onClick={() => item.set(a)}
                      className={`px-4 py-2 rounded-full text-[12.5px] border cursor-pointer transition-all ${
                        item.val === a
                          ? (a === 'Normal' ? 'bg-[#E7EFE6] border-[#5B7A63] text-[#3F5645]' : 'bg-[#F6E4DA] border-[#B5542B] text-[#8a3a1f]')
                          : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                      }`}>{a}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Observações do exame físico</label>
            <textarea rows={3} placeholder="Achados adicionais: deformidades, lesões, estado da pele..." value={exameObs}
              onChange={(e) => setExameObs(e.target.value)}
              className="w-full border border-[#E4D8C4] bg-[#FFFDF9] rounded-[10px] px-3 py-2 text-[13px] text-[#24312E] outline-none focus:border-[#0F766E] resize-none" />
          </div>
        </div>
      );

      case 6: return (
        <div className="pb-6">
          <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Mapa Podal</h2>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Achados identificados</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {TIPO_ACHADO.map((t) => (
              <button key={t} type="button" onClick={() => toggleInArray(achadosMapa, setAchadosMapa, t)}
                className="px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all"
                style={achadosMapa.includes(t)
                  ? { backgroundColor: ACHADO_COLORS[t], borderColor: ACHADO_COLORS[t], color: '#fff' }
                  : { backgroundColor: '#FFFDF9', borderColor: '#E4D8C4', color: '#5B665F' }
                }>{t}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Dorsal pé direito', val: fotoDorsalDir, set: setFotoDorsalDir },
              { label: 'Dorsal pé esquerdo', val: fotoDorsalEsq, set: setFotoDorsalEsq },
              { label: 'Plantar pé direito', val: fotoPlantarDir, set: setFotoPlantarDir },
              { label: 'Plantar pé esquerdo', val: fotoPlantarEsq, set: setFotoPlantarEsq },
            ].map((area) => (
              <div key={area.label}
                className="border border-dashed border-[#E4D8C4] rounded-[10px] p-3 flex flex-col items-center justify-center text-center min-h-[80px] cursor-pointer hover:bg-[#F3E6D2]/30 transition-colors">
                <Camera size={18} className="text-[#9b9280] mb-1" />
                <span className="text-[11px] text-[#5B665F]">{area.label}</span>
                <span className="text-[10px] text-[#9b9280]">{area.val ? 'Foto adicionada' : 'Toque para adicionar'}</span>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Localização e marcações</label>
            <textarea rows={2} placeholder="Ex: Hiperqueratose na face plantar do 5º metatarsiano esquerdo..." value={mapaObs}
              onChange={(e) => setMapaObs(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[13px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF] resize-none" />
          </div>

          {(diabetes || circulatorio || marcapasso || imunossuprimido) && (
            <div className="border rounded-[12px] p-3 mb-2.5 bg-[#F6E4DA] border-[#B5542B]">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} className="text-[#8a3a1f]" />
                <span className="text-[12.5px] font-semibold text-[#8a3a1f]">Categoria 3 — Risco alto</span>
              </div>
              <div className="text-[11.5px] text-[#8a3a1f]">
                {diabetes && 'Diabetes. '} {circulatorio && 'Alteração circulatória. '} {marcapasso && 'Marcapasso. '} {imunossuprimido && 'Imunossupressão. '} Redobrar atenção a lesões e cortes.
              </div>
            </div>
          )}

          {!diabetes && !circulatorio && !marcapasso && !imunossuprimido && (
            <div className="border rounded-[12px] p-3 mb-2.5 bg-[#E7EFE6] border-[#5B7A63]">
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldAlert size={14} className="text-[#3F5645]" />
                <span className="text-[12.5px] font-semibold text-[#3F5645]">Categoria 0 — Risco muito baixo</span>
              </div>
              <div className="text-[11.5px] text-[#5B7A63]">Sem perda de sensibilidade protetora. Sem sinais de doença arterial periférica.</div>
            </div>
          )}

          {medicamentos.toLowerCase().includes('anticoagulante') || medicamentos.toLowerCase().includes('varfarina') || medicamentos.toLowerCase().includes('marevan') ? (
            <div className="bg-[#F6E4DA] border border-[#B5542B] rounded-[10px] p-2.5 mb-2">
              <div className="text-[12px] font-semibold text-[#8a3a1f]">Redobrar cuidado com instrumentos cortantes</div>
              <div className="text-[11px] text-[#8a3a1f] mt-0.5">Paciente relatou uso de anticoagulante.</div>
            </div>
          ) : null}

          {alergias.length > 0 && !alergias.includes('Nenhum') && (
            <div className="bg-[#F3E6D2] border border-[#C8A45A] rounded-[10px] p-2.5 mb-3">
              <div className="text-[12px] font-semibold text-[#8B5E1F]">Atenção na escolha de produtos</div>
              <div className="text-[11px] text-[#8B5E1F] mt-0.5">Paciente relatou alergia a: {alergias.filter(a => a !== 'Nenhum').join(', ')}.</div>
            </div>
          )}
        </div>
      );

      case 7: return (
        <div className="pb-6">
          <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-4">Conduta e Orientações</h2>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Procedimentos realizados</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {PROCEDIMENTOS.map((p) => (
              <button key={p} type="button" onClick={() => toggleInArray(procedimentos, setProcedimentos, p)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  procedimentos.includes(p) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{p}</button>
            ))}
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Produtos e materiais utilizados</label>
          <div className="flex gap-2 mb-2">
            <input type="text" placeholder="Ex: Pomada antifúngica, gaze estéril..." value={produtoInput}
              onChange={(e) => setProdutoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && produtoInput.trim()) {
                  setProdutosUtilizados([...produtosUtilizados, produtoInput.trim()]);
                  setProdutoInput('');
                }
              }}
              className="flex-1 border-b border-[#E4D8C4] bg-transparent text-[13px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
            <button type="button" onClick={() => { if (produtoInput.trim()) { setProdutosUtilizados([...produtosUtilizados, produtoInput.trim()]); setProdutoInput(''); } }}
              className="px-3 py-1.5 rounded-full bg-[#E3EEEC] text-[#0F766E] text-[12px] font-medium cursor-pointer">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap mb-5">
            {produtosUtilizados.map((p, i) => (
              <span key={i} className="px-3 py-[5px] rounded-full bg-[#E3EEEC] text-[#0F766E] text-[11.5px] flex items-center gap-1">
                {p}
                <button type="button" onClick={() => setProdutosUtilizados(produtosUtilizados.filter((_, idx) => idx !== i))}
                  className="text-[#0F766E]/60 hover:text-[#0F766E] cursor-pointer"><X size={10} /></button>
              </span>
            ))}
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Orientação ao paciente</label>
          <div className="flex gap-2 flex-wrap mb-3">
            {ORIENTACOES_PIL.map((o) => (
              <button key={o} type="button" onClick={() => toggleInArray(orientacoes, setOrientacoes, o)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  orientacoes.includes(o) ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{o}</button>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Orientação adicional</label>
            <textarea rows={2} placeholder="Instruções personalizadas..." value={orientacaoExtra}
              onChange={(e) => setOrientacaoExtra(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[13px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF] resize-none" />
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Encaminhamento</label>
          <div className="flex gap-2 flex-wrap mb-5">
            {ENCAMINHAMENTOS.map((e) => (
              <button key={e} type="button" onClick={() => setEncaminhamento(e)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  encaminhamento === e ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{e}</button>
            ))}
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Retorno sugerido</label>
          <div className="flex gap-2 flex-wrap mb-4">
            {RETORNO_SUGERIDO.map((r) => (
              <button key={r} type="button" onClick={() => setRetornoSugerido(r)}
                className={`px-3 py-[7px] rounded-full text-[12px] border cursor-pointer transition-all ${
                  retornoSugerido === r ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{r}</button>
            ))}
          </div>

          <div>
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Observações do profissional</label>
            <textarea rows={2} placeholder="Notas técnicas sobre a conduta..." value={condutaObs}
              onChange={(e) => setCondutaObs(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[13px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF] resize-none" />
          </div>

          {(diabetes || circulatorio || marcapasso || imunossuprimido) && (
            <div className="border rounded-[12px] p-3 mb-2.5 mt-4 bg-[#F6E4DA] border-[#B5542B]">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} className="text-[#8a3a1f]" />
                <span className="text-[12.5px] font-semibold text-[#8a3a1f]">Categoria 3 — Risco alto</span>
              </div>
              <div className="text-[11.5px] text-[#8a3a1f]">
                {diabetes && 'Diabetes. '} {circulatorio && 'Alteração circulatória. '} {marcapasso && 'Marcapasso. '} {imunossuprimido && 'Imunossupressão. '} Redobrar atenção a lesões e cortes.
              </div>
            </div>
          )}
        </div>
      );

      case 8: return (
        <div className="pb-6">
          <h2 className="font-fraunces text-[20px] font-semibold text-[#24312E] mb-1">Assinaturas</h2>
          <p className="text-[12.5px] text-[#5B665F] mb-4">Confirme o consentimento antes de concluir o atendimento</p>

          <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[12px] p-3.5 mb-4">
            <div className="text-[12.5px] font-semibold text-[#24312E] mb-2">Resumo do atendimento</div>
            <div className="space-y-1.5 text-[12px] text-[#5B665F]">
              <div className="flex justify-between"><span>Paciente:</span> <span className="text-[#24312E] font-medium">{name || '—'}</span></div>
              <div className="flex justify-between"><span>Queixa principal:</span> <span className="text-[#24312E] font-medium">{motivos.join(', ') || '—'}</span></div>
              <div className="flex justify-between"><span>Procedimentos:</span> <span className="text-[#24312E] font-medium">{procedimentos.join(', ') || '—'}</span></div>
              <div className="flex justify-between"><span>Retorno:</span> <span className="text-[#24312E] font-medium">{retornoSugerido || '—'}</span></div>
              <div className="flex justify-between"><span>Achados:</span> <span className="text-[#24312E] font-medium">{achadosMapa.join(', ') || '—'}</span></div>
            </div>
          </div>

          <label className="flex items-start gap-2 text-[12.5px] text-[#24312E] mb-3.5 cursor-pointer">
            <input type="checkbox" checked={consentProntuario} onChange={(e) => setConsentProntuario(e.target.checked)} className="mt-0.5 accent-[#0F766E]" />
            <span>Concordo com o registro das informações no prontuário clínico, conforme o Termo de Consentimento.</span>
          </label>
          <label className="flex items-start gap-2 text-[12.5px] text-[#24312E] mb-5 cursor-pointer">
            <input type="checkbox" checked={consentImagens} onChange={(e) => setConsentImagens(e.target.checked)} className="mt-0.5 accent-[#0F766E]" />
            <span>Autorizo o uso de imagens para fins educativos e de divulgação.</span>
          </label>

          <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Assinatura do paciente</label>
          <div className="border border-dashed border-[#E4D8C4] rounded-[10px] h-16 flex items-center justify-center text-[12px] text-[#9b9280] mb-3">
            Assine com o dedo
          </div>

          <div className="mb-3">
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Nome de quem assina</label>
            <input type="text" placeholder="Nome completo" value={nomeAssinante} onChange={(e) => setNomeAssinante(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-2">Tipo de assinante</label>
          <div className="flex gap-2 mb-4">
            {['Paciente', 'Responsável legal'].map((t) => (
              <button key={t} type="button" onClick={() => setTipoAssinante(t)}
                className={`px-3.5 py-2 rounded-full text-[12.5px] border cursor-pointer transition-all ${
                  tipoAssinante === t ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-[#FFFDF9] border-[#E4D8C4] text-[#5B665F]'
                }`}>{t}</button>
            ))}
          </div>

          <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Assinatura do profissional</label>
          <div className="border border-dashed border-[#E4D8C4] rounded-[10px] h-16 flex items-center justify-center text-[12px] text-[#9b9280] mb-3">
            Assine com o dedo
          </div>

          <div>
            <label className="block text-[12.5px] text-[#5B665F] mb-1.5">Local do atendimento</label>
            <input type="text" placeholder="Ex: Clínica CuidarX, Sala 2" value={localAtendimento}
              onChange={(e) => setLocalAtendimento(e.target.value)}
              className="w-full border-b border-[#E4D8C4] bg-transparent text-[14px] py-2 outline-none text-[#24312E] placeholder-[#9CA3AF]" />
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#24312E]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FBF3E7] w-full max-w-[640px] rounded-t-[20px] sm:rounded-[16px] shadow-2xl border border-[#E4D8C4] max-h-[92vh] flex flex-col overflow-hidden">

        {/* Progress bar */}
        <div className="h-[3px] bg-[#E4D8C4] shrink-0">
          <div className="h-full bg-[#0F766E] transition-[width] duration-250" style={{ width: `${progress}%` }} />
        </div>

        {/* Header with step dropdown */}
        <div className="px-5 sm:px-[22px] pt-4 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setShowStepMenu(!showStepMenu)}
                className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0F766E] bg-[#E3EEEC] px-2.5 py-1 rounded-full cursor-pointer hover:bg-[#d0e6e2] transition-colors">
                Etapa {currentStep} de {TOTAL_STEPS} · {STEP_TITLES[currentStep - 1]}
                <ChevronDown size={12} className={`transition-transform ${showStepMenu ? 'rotate-180' : ''}`} />
              </button>

              {showStepMenu && (
                <div className="absolute top-full left-0 mt-2 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[12px] shadow-xl py-2 min-w-[260px] z-50">
                  {STEP_TITLES.map((title, idx) => {
                    const stepNum = idx + 1;
                    const isMandatory = isStepMandatory(stepNum);
                    const isIncomplete = isStepIncomplete(stepNum);
                    const showDot = isMandatory && isIncomplete && stepNum !== currentStep;

                    return (
                      <button key={stepNum} type="button"
                        onClick={() => { setCurrentStep(stepNum); setShowStepMenu(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-[12.5px] cursor-pointer transition-colors ${
                          stepNum === currentStep ? 'bg-[#E3EEEC] text-[#0F766E] font-semibold' : 'text-[#24312E] hover:bg-[#FBF3E7]'
                        }`}>
                        <span>{stepNum}. {title}</span>
                        {showDot && (
                          <span className="w-[6px] h-[6px] rounded-full bg-[#F59E0B] shrink-0" />
                        )}
                        {stepNum === currentStep && <Check size={13} className="text-[#0F766E] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button type="button" onClick={handleClose} className="text-[#5B665F] hover:text-[#24312E] cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-[22px] overflow-y-auto flex-1 min-h-0">
          <div style={{ minHeight: 340 }}>
            <StepContent />
          </div>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-5 sm:px-[22px] py-4 border-t border-[#E4D8C4] bg-[#FFFDF9] shrink-0">
          <button type="button" onClick={handleBack} disabled={currentStep === 1}
            className={`flex items-center gap-1 border border-[#E4D8C4] bg-[#FFFDF9] text-[#5B665F] text-[12.5px] font-medium py-2 px-4 rounded-[10px] cursor-pointer transition-all ${
              currentStep === 1 ? 'opacity-40' : ''
            }`}>
            <ChevronLeft size={14} /> Voltar
          </button>
          <span className="text-[11px] text-[#9b9280]">salvo às {savedTime}</span>
          {currentStep === TOTAL_STEPS ? (
            <button type="button" onClick={handleFinish} disabled={!canAdvance()}
              className="flex items-center gap-1 border-none bg-[#0F766E] text-white text-[12.5px] font-medium py-2 px-4.5 rounded-[10px] cursor-pointer disabled:opacity-40">
              Concluir atendimento <Check size={14} />
            </button>
          ) : (
            <button type="button" onClick={handleNext} disabled={!canAdvance()}
              className="flex items-center gap-1 border-none bg-[#0F766E] text-white text-[12.5px] font-medium py-2 px-4.5 rounded-[10px] cursor-pointer disabled:opacity-40">
              Continuar <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Confirm close modal */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] rounded-[16px] p-5 max-w-[340px] w-full shadow-2xl border border-[#E4D8C4]">
            <h3 className="font-fraunces text-[16px] font-semibold text-[#24312E] mb-2">Sair sem salvar?</h3>
            <p className="text-[13px] text-[#5B665F] mb-4">Há dados preenchidos que serão perdidos.</p>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2.5 rounded-[10px] border border-[#E4D8C4] bg-[#FFFDF9] text-[#5B665F] text-[13px] font-medium cursor-pointer">
                Continuar editando
              </button>
              <button type="button" onClick={confirmClose}
                className="flex-1 py-2.5 rounded-[10px] bg-[#B5542B] text-white text-[13px] font-semibold cursor-pointer">
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
