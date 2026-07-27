import React, { useState, useRef, useEffect } from "react";
import { Patient } from "../types";
import {
  Search,
  User,
  Heart,
  Phone,
  Calendar,
  Shield,
  FileText,
  Printer,
  Sparkles,
  Save,
  CheckCircle,
  Clock,
  Briefcase,
  AlertCircle,
  Lock,
  UserCheck,
  Check,
  X,
} from "lucide-react";

const contractTemplates = {
  consent: {
    title: "Termo de Consentimento Livre e Esclarecido",
    content: (patientName: string, docDob: string, docPhone: string) => `Eu, ${patientName || "________________________"}, nascido(a) em ${docDob ? new Date(docDob).toLocaleDateString("pt-BR") : "___/___/_____"}, portador(a) do telefone ${docPhone || "________________"}, autorizo voluntariamente a Dra. Fabrícia Rodrigues, profissional de Podologia, a realizar a avaliação física de meus pés, diagnóstico podal e a execução de procedimentos técnicos podológicos necessários para o meu tratamento de saúde e bem-estar (tais como remoção de calosidades, tratamento de unhas encravadas/onicocriptose, ortoniquia, assepsia, curetagem e tratamentos auxiliares).

Fui plenamente esclarecido(a) de que os procedimentos podológicos clínicos visam a saúde e a reabilitação das estruturas podais, tendo recebido orientações sobre o plano de cuidados, possíveis reações transitórias pós-procedimento (como leve sensibilidade local ou vermelhidão) e as diretrizes de homecare (cuidados em casa) que devo seguir rigorosamente para garantir a eficácia do tratamento.

Confirmo que forneci informações verdadeiras e completas sobre minhas condições de saúde sistêmica nesta ficha de anamnese (incluindo diabetes, alergias medicamentosas, problemas circulatórios, hipertensão, uso de anticoagulantes, estado de gestação, entre outros), ciente de que a omissão de fatos clínicos relevantes pode comprometer a segurança e o resultado do procedimento.

Este consentimento é válido por tempo indeterminado ou até que seja formalmente revogado por escrito.`
  },
  service: {
    title: "Contrato de Prestação de Serviços de Podologia",
    content: (patientName: string, docDob: string, docPhone: string) => `CONTRATANTE: ${patientName || "________________________"}, telefone ${docPhone || "________________"}.
CONTRATADA: DRA. FABRÍCIA RODRIGUES, profissional de Podologia Clínica e Preventiva, atuante em ambiente ambulatorial e homecare.

CLÁUSULA PRIMEIRA - DO OBJETO: O presente instrumento tem como objeto a prestação de serviços de assistência podológica especializada, englobando tratamentos clínicos preventivos, reabilitadores e corretivos de afecções superficiais do pé humano, conforme a necessidade individual identificada na avaliação podal e descrita no prontuário clínico do(a) paciente.

CLÁUSULA SEGUNDA - DA EXECUÇÃO: O tratamento será executado utilizando-se técnicas de assepsia rigorosas, instrumentais devidamente esterilizados em autoclave e insumos descartáveis de uso único, prezando pela máxima biossegurança. O(A) CONTRATANTE compromete-se a comparecer nos dias e horários agendados e a cumprir as orientações técnicas passadas pela profissional.

CLÁUSULA TERCEIRA - DA DURAÇÃO E AGENDAMENTO: As sessões serão marcadas previamente em comum acordo entre as partes. No caso de não comparecimento sem aviso prévio de no mínimo 2 horas, poderá ser cobrada taxa de remarcação ou perda de crédito.

CLÁUSULA QUARTA - DOS VALORES E PAGAMENTOS: Os valores referentes aos procedimentos avulsos ou pacotes contratados seguem a tabela de preços vigente informada na clínica ou nos canais de agendamento online. Os pagamentos deverão ser realizados em dinheiro, Pix ou cartões de débito/crédito no ato do atendimento.`
  },
  image: {
    title: "Termo de Autorização de Uso de Imagem e Voz",
    content: (patientName: string, docDob: string, docPhone: string) => `Eu, ${patientName || "________________________"}, telefone ${docPhone || "________________"}, autorizo livremente e sem ônus a Dra. Fabrícia Rodrigues a realizar capturas fotográficas e gravações audiovisuais de meus pés antes, durante e após a execução dos procedimentos podológicos realizados.

Declaro estar ciente de que as imagens capturadas destinam-se exclusivamente a:
1. Prontuário Clínico: Para fins de registro interno da evolução clínica e acompanhamento do progresso das lesões/afecções.
2. Fins Educacionais e Científicos: Para estudo de casos clínicos, apresentações acadêmicas e divulgação profissional.
3. Redes Sociais e Portfólio de Trabalho (opcional): Publicação de fotos no formato de "Antes e Depois" com o intuito de ilustrar o trabalho da profissional, garantindo-se sempre a preservação da minha identidade pessoal e fisionomia (as imagens focarão apenas nas extremidades podais, de forma anônima).

Esta autorização é concedida a título gratuito, abrangendo a veiculação das imagens em mídias físicas ou digitais.`
  }
};

interface AnamneseViewProps {
  patients: Patient[];
  onUpdatePatient: (updatedPatient: Patient) => Promise<void>;
  onNavigate: (tab: string) => void;
  embeddedPatientId?: string;
  compact?: boolean;
}

export default function AnamneseView({ patients, onUpdatePatient, onNavigate, embeddedPatientId, compact }: AnamneseViewProps) {
  const [selectedId, setSelectedId] = useState<string>(embeddedPatientId || patients[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "contracts">("edit");

  // If embeddedPatientId changes (from CalendarView selection), update selection
  React.useEffect(() => {
    if (embeddedPatientId) {
      setSelectedId(embeddedPatientId);
    }
  }, [embeddedPatientId]);

  // In compact mode, force preview tab
  React.useEffect(() => {
    if (compact) {
      setActiveTab("preview");
    }
  }, [compact]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAiStructuring, setIsAiStructuring] = useState(false);

  // Search filtered patients
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const patient = patients.find((p) => p.id === selectedId);

  // Signature Drawing States & Handlers
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Determine correct coordinates relative to the canvas
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = "#0f172a"; // slate-900 / dark pen
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      if (e.cancelable) e.preventDefault(); // Prevent page scrolling while signing
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSaveSignature = async () => {
    if (!patient) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL("image/png");
    
    setIsSaving(true);
    const updatedPatient: Patient = {
      ...patient,
      signature: signatureDataUrl,
      contractAccepted: true,
      contractConsentType: formData.contractConsentType,
      imageUseAuthorized: formData.imageUseAuthorized,
      contractObservations: formData.contractObservations,
      signedAt: new Date().toISOString(),
    };

    try {
      await onUpdatePatient(updatedPatient);
      // Also update local form state to show signature immediately
      setFormData(prev => ({
        ...prev,
        signature: signatureDataUrl,
        contractAccepted: true,
        signedAt: updatedPatient.signedAt || "",
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSignature = async () => {
    if (!patient) return;
    if (!confirm("Tem certeza de que deseja revogar a assinatura digital deste contrato? Isso apagará a assinatura e mudará o status para Pendente.")) return;

    setIsSaving(true);
    const updatedPatient: Patient = {
      ...patient,
      signature: "",
      contractAccepted: false,
      signedAt: "",
    };

    try {
      await onUpdatePatient(updatedPatient);
      setFormData(prev => ({
        ...prev,
        signature: "",
        contractAccepted: false,
        signedAt: "",
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setHasSigned(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Form State - initialized from selected patient
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dob: "",
    gender: "Feminino",
    isDiabetic: false,
    hasCirculatoryIssues: false,
    isSmoker: false,
    hasAllergies: "Não",
    observations: "",
    footStrikeType: "Normal",
    // Extended podiatry anamnesis fields
    profession: "",
    hypertension: false,
    cardiopathy: false,
    oncological: false,
    pregnant: false,
    anticoagulant: false,
    physicalActivity: false,
    mainComplaint: "",
    tactileSensitivity: "Normal",
    footwearType: "Tênis",
    jointPain: false,
    // Contract & Digital Signature Fields
    signature: "",
    contractAccepted: false,
    contractConsentType: "Termo de Consentimento Livre e Esclarecido",
    imageUseAuthorized: "Pendente",
    contractObservations: "",
    signedAt: "",
  });

  // Sync state with selected patient
  React.useEffect(() => {
    if (patient) {
      // Parse observations to retrieve extended fields if they exist as JSON, otherwise read defaults
      let parsedExtended: any = {};
      try {
        if (patient.observations && patient.observations.startsWith("{") && patient.observations.endsWith("}")) {
          parsedExtended = JSON.parse(patient.observations);
        }
      } catch (e) {
        // Fallback
      }

      setFormData({
        name: patient.name,
        phone: patient.phone,
        dob: patient.dob,
        gender: patient.gender || "Feminino",
        isDiabetic: patient.isDiabetic || false,
        hasCirculatoryIssues: patient.hasCirculatoryIssues || false,
        isSmoker: patient.isSmoker || false,
        hasAllergies: patient.hasAllergies || "Não",
        observations: patient.observations && !patient.observations.startsWith("{") 
          ? patient.observations 
          : (parsedExtended.observations || ""),
        footStrikeType: patient.footStrikeType || parsedExtended.footStrikeType || "Normal",
        profession: patient.profession || parsedExtended.profession || "",
        hypertension: patient.hypertension !== undefined ? patient.hypertension : (parsedExtended.hypertension || false),
        cardiopathy: patient.cardiopathy !== undefined ? patient.cardiopathy : (parsedExtended.cardiopathy || false),
        oncological: patient.oncological !== undefined ? patient.oncological : (parsedExtended.oncological || false),
        pregnant: patient.pregnant !== undefined ? patient.pregnant : (parsedExtended.pregnant || false),
        anticoagulant: patient.anticoagulant !== undefined ? patient.anticoagulant : (parsedExtended.anticoagulant || false),
        physicalActivity: patient.physicalActivity !== undefined ? patient.physicalActivity : (parsedExtended.physicalActivity || false),
        mainComplaint: patient.mainComplaint || parsedExtended.mainComplaint || "",
        tactileSensitivity: patient.tactileSensitivity || parsedExtended.tactileSensitivity || "Normal",
        footwearType: patient.footwearType || parsedExtended.footwearType || "Tênis",
        jointPain: patient.jointPain !== undefined ? patient.jointPain : (parsedExtended.jointPain || false),
        signature: patient.signature || "",
        contractAccepted: patient.contractAccepted || false,
        contractConsentType: patient.contractConsentType || "Termo de Consentimento Livre e Esclarecido",
        imageUseAuthorized: patient.imageUseAuthorized || "Pendente",
        contractObservations: patient.contractObservations || "",
        signedAt: patient.signedAt || "",
      });
      setSaveSuccess(false);
    }
  }, [selectedId, patient]);

  if (patients.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center max-w-2xl mx-auto my-12">
        <User className="w-12 h-12 text-teal-600/40 mx-auto mb-4" />
        <h3 className="text-base font-bold text-slate-800">Nenhum paciente cadastrado</h3>
        <p className="text-xs text-slate-500 mt-2">
          Para acessar a ficha de anamnese, primeiro cadastre um cliente.
        </p>
        <button
          onClick={() => onNavigate("pacientes")}
          className="mt-6 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
        >
          Ir para Cadastro de Clientes
        </button>
      </div>
    );
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!patient) return;

    setIsSaving(true);
    
    const updatedPatient: Patient = {
      ...patient,
      name: formData.name,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      isDiabetic: formData.isDiabetic,
      hasCirculatoryIssues: formData.hasCirculatoryIssues,
      isSmoker: formData.isSmoker,
      hasAllergies: formData.hasAllergies,
      footStrikeType: formData.footStrikeType,
      profession: formData.profession,
      hypertension: formData.hypertension,
      cardiopathy: formData.cardiopathy,
      oncological: formData.oncological,
      pregnant: formData.pregnant,
      anticoagulant: formData.anticoagulant,
      physicalActivity: formData.physicalActivity,
      mainComplaint: formData.mainComplaint,
      tactileSensitivity: formData.tactileSensitivity,
      footwearType: formData.footwearType,
      jointPain: formData.jointPain,
      observations: formData.observations,
      signature: formData.signature,
      contractAccepted: formData.contractAccepted,
      contractConsentType: formData.contractConsentType,
      imageUseAuthorized: formData.imageUseAuthorized,
      contractObservations: formData.contractObservations,
      signedAt: formData.signedAt,
    };

    try {
      await onUpdatePatient(updatedPatient);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Uses server-side Gemini to write a professional clinical anamnesis review
  const handleAiReviewAnamnese = async () => {
    if (!patient) return;
    setIsAiStructuring(true);
    try {
      const summaryInput = `
        Paciente: ${formData.name} (${formData.gender}, Nasc: ${formData.dob})
        Queixa Principal: ${formData.mainComplaint || "Não informada"}
        Diabetes: ${formData.isDiabetic ? "Sim" : "Não"}
        Hipertensão: ${formData.hypertension ? "Sim" : "Não"}
        Cardiopatia: ${formData.cardiopathy ? "Sim" : "Não"}
        Sensibilidade Tátil: ${formData.tactileSensitivity}
        Tipo de Pisada: ${formData.footStrikeType}
        Observações iniciais: ${formData.observations || "Nenhuma"}
      `;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Com base nas seguintes informações de anamnese clínica, sintetize uma queixa principal e considerações clínicas podológicas de forma extremamente profissional, técnica e refinada para o prontuário permanente do paciente. Use os termos técnicos adequados da podologia clínica brasileira:\n\n${summaryInput}`,
          patientContext: patient,
        }),
      });
      const data = await response.json();
      if (data.text) {
        handleFieldChange("observations", data.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiStructuring(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Age helper
  const getAge = (dobString: string) => {
    if (!dobString) return "";
    const birth = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} anos`;
  };

  return (
    <div id="anamnese-view-tab" className={compact ? "space-y-4" : "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"}>
      {/* Print styles override to hide sidebars and headers when printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
            font-size: 11px;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* LEFT COLUMN: Patient list selector (no-print) - Hidden in compact/embedded mode */}
      {!compact && (
      <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 no-print text-left">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Fichas de Clientes</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
          />
        </div>

        {/* List of Patients */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredPatients.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">Nenhum paciente encontrado.</p>
          ) : (
            filteredPatients.map((p) => {
              const isSelected = p.id === selectedId;
              const hasCompletedAnamnese = p.observations && p.observations.startsWith("{");
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-teal-50/50 border-teal-200 ring-1 ring-teal-500/10"
                      : "bg-white border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.phone}</p>
                    </div>
                    {p.isDiabetic && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase">
                        Diabetes
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <span className="text-[9px] text-slate-400">
                      Nasc: {new Date(p.dob).toLocaleDateString("pt-BR")}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      hasCompletedAnamnese 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {hasCompletedAnamnese ? "Ficha Completa" : "Pendente"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* RIGHT COLUMN: The Anamnesis Form */}
      <div className={compact ? "space-y-6" : "lg:col-span-9 space-y-6"}>
        {patient ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-left">
            {/* Header / Tabs */}
            <div className="bg-slate-50/60 p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Ficha de Anamnese Podológica</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Paciente: <strong className="text-slate-700">{patient.name}</strong> • {getAge(patient.dob)}</p>
                  </div>
                </div>
              </div>

              {/* Action Tabs and Actions - Hidden in compact mode */}
              {!compact && (
              <div className="flex items-center gap-2.5">
                <div className="flex bg-slate-200/60 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === "edit" ? "bg-white text-teal-800 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Preencher Formulário
                  </button>
                  <button
                    onClick={() => setActiveTab("contracts")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === "contracts" ? "bg-white text-teal-800 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Contratos & Assinatura
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === "preview" ? "bg-white text-teal-800 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Visualizar & Imprimir
                  </button>
                </div>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  title="Imprimir prontuário podal"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
              </div>
              )}
            </div>

            {/* TAB CONTENT 1: EDIT FORM */}
            {activeTab === "edit" ? (
              <form onSubmit={handleSave} className="p-6 space-y-6 no-print">
                {/* Save status notification */}
                {saveSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2 text-emerald-800 text-xs font-medium animate-fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Ficha de Anamnese salva com sucesso no banco de dados da nuvem!</span>
                  </div>
                )}

                {/* Grid 1: Personal info (Identificação) */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                    1. Identificação Adicional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 cursor-not-allowed"
                        disabled
                        title="Nome editável no cadastro de clientes"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telefone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 cursor-not-allowed"
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Profissão / Ocupação</label>
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={(e) => handleFieldChange("profession", e.target.value)}
                        placeholder="Ex: Cabeleireira, Motorista"
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Grid 2: Clinical Systemic Anamnesis (Histórico Geral) */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-teal-600" /> 2. Histórico de Saúde Sistêmica
                  </h3>
                  
                  <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-3">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione todas as condições médicas existentes:</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Diabetes */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formData.isDiabetic}
                          onChange={(e) => handleFieldChange("isDiabetic", e.target.checked)}
                          className="accent-teal-600 w-4 h-4 rounded"
                        />
                        <span className={formData.isDiabetic ? "text-amber-700 font-bold" : ""}>
                          Diabético(a)?
                        </span>
                      </label>

                      {/* Circulatório */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formData.hasCirculatoryIssues}
                          onChange={(e) => handleFieldChange("hasCirculatoryIssues", e.target.checked)}
                          className="accent-teal-600 w-4 h-4 rounded"
                        />
                        <span className={formData.hasCirculatoryIssues ? "text-rose-700 font-bold" : ""}>
                          Má Circulação?
                        </span>
                      </label>

                      {/* Hipertensão */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formData.hypertension}
                          onChange={(e) => handleFieldChange("hypertension", e.target.checked)}
                          className="accent-teal-600 w-4 h-4 rounded"
                        />
                        <span className={formData.hypertension ? "text-teal-700 font-bold" : ""}>
                          Hipertensão (HAS)?
                        </span>
                      </label>

                      {/* Cardiopata */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formData.cardiopathy}
                          onChange={(e) => handleFieldChange("cardiopathy", e.target.checked)}
                          className="accent-teal-600 w-4 h-4 rounded"
                        />
                        <span>Cardiopatia?</span>
                      </label>

                      {/* Paciente Oncológico */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formData.oncological}
                          onChange={(e) => handleFieldChange("oncological", e.target.checked)}
                          className="accent-teal-600 w-4 h-4 rounded"
                        />
                        <span>Pact. Oncológico?</span>
                      </label>

                      {/* Anticoagulantes */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formData.anticoagulant}
                          onChange={(e) => handleFieldChange("anticoagulant", e.target.checked)}
                          className="accent-teal-600 w-4 h-4 rounded"
                        />
                        <span>Usa Anticoagulante?</span>
                      </label>

                      {/* Gestante */}
                      {formData.gender === "Feminino" && (
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={formData.pregnant}
                            onChange={(e) => handleFieldChange("pregnant", e.target.checked)}
                            className="accent-teal-600 w-4 h-4 rounded"
                          />
                          <span>Está Gestante?</span>
                        </label>
                      )}

                      {/* Fumante */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={formData.isSmoker}
                          onChange={(e) => handleFieldChange("isSmoker", e.target.checked)}
                          className="accent-teal-600 w-4 h-4 rounded"
                        />
                        <span>Fumante?</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alergias (A medicamentos, latex, esmalte, iodo...)</label>
                      <input
                        type="text"
                        value={formData.hasAllergies}
                        onChange={(e) => handleFieldChange("hasAllergies", e.target.value)}
                        placeholder="Ex: Dipirona, Corantes ou Nenhuma"
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pratica Esportes / Atividades Físicas?</label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                          <input
                            type="radio"
                            name="physicalActivity"
                            checked={formData.physicalActivity === true}
                            onChange={() => handleFieldChange("physicalActivity", true)}
                            className="accent-teal-600 w-4 h-4"
                          />
                          Sim
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-slate-700">
                          <input
                            type="radio"
                            name="physicalActivity"
                            checked={formData.physicalActivity === false}
                            onChange={() => handleFieldChange("physicalActivity", false)}
                            className="accent-teal-600 w-4 h-4"
                          />
                          Não praticante
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid 3: Exame Físico Podal (Especificidades) */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                    3. Exame Físico & Avaliação Podal
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Pisada / Pé</label>
                      <select
                        value={formData.footStrikeType}
                        onChange={(e) => handleFieldChange("footStrikeType", e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Normal">Normal / Neutro</option>
                        <option value="Pronada">Pronada (Pisa para dentro)</option>
                        <option value="Supinada">Supinada (Pisa para fora)</option>
                        <option value="Cavo">Cavo (Arco acentuado)</option>
                        <option value="Plano">Plano / Chato</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sensibilidade Tátil (Monofilamento)</label>
                      <select
                        value={formData.tactileSensitivity}
                        onChange={(e) => handleFieldChange("tactileSensitivity", e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Normal">Normal / Preservada</option>
                        <option value="Diminuída">Diminuída (Sinal de Alerta)</option>
                        <option value="Ausente">Ausente (Risco de Pé Diabético)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Calçado Predominante</label>
                      <input
                        type="text"
                        value={formData.footwearType}
                        onChange={(e) => handleFieldChange("footwearType", e.target.value)}
                        placeholder="Ex: Tênis de corrida, Bota de biqueira, Salto"
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={formData.jointPain}
                        onChange={(e) => handleFieldChange("jointPain", e.target.checked)}
                        className="accent-teal-600 w-4 h-4 rounded"
                      />
                      <span>Paciente relata dores articulares frequentes nos joelhos, quadris ou tornozelos?</span>
                    </label>
                  </div>
                </div>

                {/* Grid 4: Queixa Principal & AI observations */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-teal-800 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center justify-between">
                    <span>4. Motivo do Atendimento & Prontuário</span>
                    <button
                      type="button"
                      onClick={handleAiReviewAnamnese}
                      disabled={isAiStructuring}
                      className="text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-600 hover:text-white px-2.5 py-1.5 rounded-xl border border-teal-100 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
                      title="Sintetiza todas as informações médicas acima em um prontuário super profissional usando o cérebro artificial Gemini."
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isAiStructuring ? "Analisando com IA..." : "Sintetizar com IA"}
                    </button>
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Queixa Principal do Paciente (O que motivou a vinda?)</label>
                      <textarea
                        value={formData.mainComplaint}
                        onChange={(e) => handleFieldChange("mainComplaint", e.target.value)}
                        placeholder="Ex: Unha encravada no hálux esquerdo inflamada há 4 dias, dores ao calçar sapato fechado..."
                        rows={2}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Parecer Clínico / Recomendações e Prontuário Permanente (Dra. Fabricia)</label>
                      <textarea
                        value={formData.observations}
                        onChange={(e) => handleFieldChange("observations", e.target.value)}
                        placeholder="Parecer do exame clínico dos pés, orientações de assepsia, encaminhamentos a outros profissionais se necessário..."
                        rows={5}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Save Actions */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-60 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Gravando Ficha..." : "Gravar Ficha de Anamnese"}
                  </button>
                </div>
              </form>
            ) : activeTab === "contracts" ? (
              /* TAB CONTENT 2: CONTRATOS & ASSINATURA DIGITAL */
              <div className="p-6 space-y-6 no-print">
                {saveSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2 text-emerald-800 text-xs font-medium animate-fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Contrato e assinatura salvos com sucesso na nuvem Firebase!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* Left Column: Template Selection & Text Preview */}
                  <div className="xl:col-span-7 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Selecione o Modelo de Contrato</label>
                        <select
                          value={formData.contractConsentType === "Termo de Consentimento Livre e Esclarecido" ? "consent" : formData.contractConsentType === "Contrato de Prestação de Serviços de Podologia" ? "service" : "image"}
                          onChange={(e) => {
                            const val = e.target.value;
                            const label = val === "consent" 
                              ? "Termo de Consentimento Livre e Esclarecido" 
                              : val === "service" 
                                ? "Contrato de Prestação de Serviços de Podologia" 
                                : "Termo de Autorização de Uso de Imagem e Voz";
                            handleFieldChange("contractConsentType", label);
                          }}
                          className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer mt-0.5"
                        >
                          <option value="consent">Termo de Consentimento Livre</option>
                          <option value="service">Contrato de Prestação de Serviços</option>
                          <option value="image">Autorização de Uso de Imagem</option>
                        </select>
                      </div>
                      <span className={`self-start sm:self-auto text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        formData.contractAccepted 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${formData.contractAccepted ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {formData.contractAccepted ? "Contrato Assinado" : "Aguardando Assinatura"}
                      </span>
                    </div>

                    {/* Document Paper box */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 md:p-6 max-h-[500px] overflow-y-auto font-sans text-xs text-slate-700 leading-relaxed shadow-inner">
                      <div className="text-center mb-5 border-b border-slate-200 pb-4">
                        <h4 className="font-bold text-slate-800 text-sm uppercase">
                          {formData.contractConsentType}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">Dra. Fabrícia Rodrigues • Podologia Clínica</p>
                      </div>

                      {/* Render text with placeholders replaced with actual client data */}
                      <p className="whitespace-pre-line text-[11px]">
                        {formData.contractConsentType === "Termo de Consentimento Livre e Esclarecido" 
                          ? contractTemplates.consent.content(formData.name, formData.dob, formData.phone)
                          : formData.contractConsentType === "Contrato de Prestação de Serviços de Podologia"
                            ? contractTemplates.service.content(formData.name, formData.dob, formData.phone)
                            : contractTemplates.image.content(formData.name, formData.dob, formData.phone)
                        }
                      </p>

                      <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                        <p className="text-[10px] text-slate-400 font-mono">
                          Documento Eletrônico gerado via AI Clinic Suite
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Settings & Digital Signature Pad */}
                  <div className="xl:col-span-5 space-y-4">
                    {/* Settings Panel */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                        <Shield className="w-4 h-4 text-teal-600" />
                        Status & Opções do Contrato
                      </h4>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Autorização de Uso de Imagem (Fotografias dos Pés)</label>
                        <select
                          value={formData.imageUseAuthorized}
                          onChange={(e) => handleFieldChange("imageUseAuthorized", e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                        >
                          <option value="Pendente">Ainda não decidido / Pendente</option>
                          <option value="Autorizado">Sim, Autorizo o uso para fins clínicos e portfólio</option>
                          <option value="Apenas Interno">Apenas para Prontuário Interno (Privado)</option>
                          <option value="Não Autorizado">Não Autorizo qualquer uso de imagem</option>
                        </select>
                        <p className="text-[9px] text-slate-400 mt-1">Isso ajuda a podóloga a saber se pode postar o "antes e depois" respeitando o sigilo do cliente.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cláusulas Especiais / Observações do Contrato</label>
                        <textarea
                          value={formData.contractObservations}
                          onChange={(e) => handleFieldChange("contractObservations", e.target.value)}
                          placeholder="Ex: Responsável assinou em nome do menor, observação de desconto especial..."
                          rows={2}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    {/* Signature Pad Panel */}
                    <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
                        <UserCheck className="w-4 h-4 text-teal-600" />
                        Assinatura Digital do Paciente
                      </h4>

                      {formData.signature ? (
                        // SIGNED STATE
                        <div className="space-y-4">
                          <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="p-2 bg-emerald-100/60 rounded-full">
                              <Check className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-emerald-800">Assinatura Capturada com Sucesso</p>
                              {formData.signedAt && (
                                <p className="text-[10px] text-emerald-600/80 mt-0.5">
                                  Registrado em {new Date(formData.signedAt).toLocaleString("pt-BR")}
                                </p>
                              )}
                            </div>
                            
                            {/* Signature Render preview */}
                            <div className="bg-white border border-slate-100 rounded-lg p-2.5 max-w-[280px] w-full flex justify-center shadow-xs">
                              <img 
                                src={formData.signature} 
                                alt="Assinatura Digital" 
                                className="h-16 object-contain mix-blend-multiply" 
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRevokeSignature}
                            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-100 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <X className="w-3.5 h-3.5" />
                            Revogar Assinatura & Redesenhar
                          </button>
                        </div>
                      ) : (
                        // NOT SIGNED / DRAWING PAD STATE
                        <div className="space-y-3">
                          <p className="text-[10px] text-slate-500">
                            Use o dedo na tela sensível ao toque ou o mouse para desenhar a assinatura no quadro abaixo:
                          </p>
                          
                          <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:bg-slate-50/80 transition-colors">
                            <canvas
                              ref={canvasRef}
                              width={400}
                              height={180}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                              className="w-full h-[180px] block cursor-crosshair touch-none"
                            />
                            
                            <div className="absolute bottom-2.5 right-2.5 flex gap-2">
                              <button
                                type="button"
                                onClick={clearCanvas}
                                className="bg-slate-200/80 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all border border-slate-300/40 shadow-xs"
                              >
                                Limpar Quadro
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2 text-[9px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>
                              Ao clicar em confirmar, você declara ter lido, entendido e aceito todos os termos do documento selecionado. A assinatura digital possui validade consensual no âmbito deste tratamento.
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleSaveSignature}
                            disabled={!hasSigned || isSaving}
                            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-md disabled:shadow-none cursor-pointer disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                          >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Registrando..." : "Registrar Assinatura & Aceitar Termos"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB CONTENT 3: CLINICAL PAPER PRINT LAYOUT PREVIEW */
              <div className="p-6 bg-slate-100 min-h-[500px] flex justify-center overflow-auto no-print">
                {/* Print Sheet Paper Container */}
                <div id="print-area" className="w-[210mm] min-h-[297mm] bg-white p-12 text-slate-900 border border-slate-200 shadow-xl space-y-8 text-xs font-sans">
                  
                  {/* Clinic Sheet Header */}
                  <div className="flex justify-between items-start border-b-2 border-teal-800 pb-5">
                    <div className="space-y-1">
                      <h1 className="text-sm font-black tracking-wider uppercase text-teal-900">Dra. Fabrícia Rodrigues</h1>
                      <p className="text-[10px] font-bold text-emerald-800">PODOLOGIA CLÍNICA • SAÚDE & BEM-ESTAR</p>
                      <p className="text-[9px] text-slate-400">Atendimento Clínico Personalizado & Homecare</p>
                    </div>
                    <div className="text-right text-[9px] text-slate-400 space-y-0.5">
                      <p className="font-bold text-slate-700">WhatsApp: (19) 99722-2694</p>
                      <p>Sincronizado: AI Cloud Studio</p>
                      <p>Ficha de Registro Nº: {patient.id.replace("pat-temp-", "")}</p>
                    </div>
                  </div>

                  {/* Title of Document */}
                  <div className="text-center">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 bg-slate-50 py-2 border-y border-slate-100">
                      FICHA DE ANAMNESE E HISTÓRICO CLÍNICO PODAL
                    </h2>
                  </div>

                  {/* Identification Table */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">I. Identificação do Paciente</h3>
                    <table className="w-full border-collapse border border-slate-200 text-[10px]">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200 bg-slate-50 font-bold w-1/4">Nome do Paciente:</td>
                          <td className="p-2 font-semibold w-1/2" colSpan={3}>{formData.name}</td>
                          <td className="p-2 border-r border-slate-200 bg-slate-50 font-bold">Gênero:</td>
                          <td className="p-2">{formData.gender}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200 bg-slate-50 font-bold">Nascimento:</td>
                          <td className="p-2 border-r border-slate-200">{new Date(formData.dob).toLocaleDateString("pt-BR")}</td>
                          <td className="p-2 border-r border-slate-200 bg-slate-50 font-bold">Idade:</td>
                          <td className="p-2 border-r border-slate-200">{getAge(formData.dob)}</td>
                          <td className="p-2 border-r border-slate-200 bg-slate-50 font-bold">Telefone:</td>
                          <td className="p-2">{formData.phone}</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r border-slate-200 bg-slate-50 font-bold">Profissão / Ocupação:</td>
                          <td className="p-2" colSpan={5}>{formData.profession || "Não informada"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Systemic health checklist */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">II. Histórico Médico e Sistêmico (Anamnese Geral)</h3>
                    <div className="grid grid-cols-3 gap-y-2 border border-slate-200 p-3.5 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center font-bold text-[10px] ${formData.isDiabetic ? "bg-teal-800 text-white border-teal-800" : ""}`}>
                          {formData.isDiabetic ? "X" : ""}
                        </span>
                        <span>Diabetes Mellitus</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center font-bold text-[10px] ${formData.hasCirculatoryIssues ? "bg-teal-800 text-white border-teal-800" : ""}`}>
                          {formData.hasCirculatoryIssues ? "X" : ""}
                        </span>
                        <span>Má Circulação</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center font-bold text-[10px] ${formData.hypertension ? "bg-teal-800 text-white border-teal-800" : ""}`}>
                          {formData.hypertension ? "X" : ""}
                        </span>
                        <span>Hipertensão Arterial</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center font-bold text-[10px] ${formData.cardiopathy ? "bg-teal-800 text-white border-teal-800" : ""}`}>
                          {formData.cardiopathy ? "X" : ""}
                        </span>
                        <span>Cardiopatias</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center font-bold text-[10px] ${formData.oncological ? "bg-teal-800 text-white border-teal-800" : ""}`}>
                          {formData.oncological ? "X" : ""}
                        </span>
                        <span>Histórico Oncológico</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center font-bold text-[10px] ${formData.anticoagulant ? "bg-teal-800 text-white border-teal-800" : ""}`}>
                          {formData.anticoagulant ? "X" : ""}
                        </span>
                        <span>Uso de Anticoagulantes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center font-bold text-[10px] ${formData.isSmoker ? "bg-teal-800 text-white border-teal-800" : ""}`}>
                          {formData.isSmoker ? "X" : ""}
                        </span>
                        <span>Fumante / Tabagista</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center font-bold text-[10px] ${formData.pregnant ? "bg-teal-800 text-white border-teal-800" : ""}`}>
                          {formData.pregnant ? "X" : ""}
                        </span>
                        <span>Gestante</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 border border-slate-400 flex items-center justify-center font-bold text-[10px] ${formData.physicalActivity ? "bg-teal-800 text-white border-teal-800" : ""}`}>
                          {formData.physicalActivity ? "X" : ""}
                        </span>
                        <span>Pratica Atividades Físicas</span>
                      </div>
                    </div>
                    <div className="border border-slate-200 border-t-0 p-3 bg-slate-50 flex justify-between">
                      <p><strong>Alergias relatadas:</strong> <span className="text-rose-700 font-bold">{formData.hasAllergies}</span></p>
                    </div>
                  </div>

                  {/* Physical assessment */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">III. Avaliação Clínica Podal</h3>
                    <table className="w-full border-collapse border border-slate-200 text-[10px]">
                      <tbody>
                        <tr className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200 bg-slate-50 font-bold w-1/3">Tipo de Pé / Pisada:</td>
                          <td className="p-2">{formData.footStrikeType}</td>
                          <td className="p-2 border-x border-slate-200 bg-slate-50 font-bold w-1/3">Sensibilidade nos Pés:</td>
                          <td className="p-2">{formData.tactileSensitivity}</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r border-slate-200 bg-slate-50 font-bold">Calçado predominante:</td>
                          <td className="p-2">{formData.footwearType}</td>
                          <td className="p-2 border-x border-slate-200 bg-slate-50 font-bold">Dores Articulares:</td>
                          <td className="p-2">{formData.jointPain ? "Sim, relatado" : "Não relatadas"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Complaint & observations */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">IV. Motivo da Consulta & Queixa Principal</h3>
                    <div className="border border-slate-200 p-3.5 rounded-lg min-h-[60px] leading-relaxed italic text-slate-800">
                      {formData.mainComplaint || "Nenhuma queixa principal descrita."}
                    </div>
                  </div>

                  {/* Clinical opinion / recommendations */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">V. Parecer Clínico, Condutas e Evolução Recomendada</h3>
                    <div className="border border-slate-200 p-3.5 rounded-lg min-h-[140px] leading-relaxed whitespace-pre-line font-mono bg-slate-50/50 text-slate-800">
                      {formData.observations || "Nenhuma observação clínica ou conduta registrada."}
                    </div>
                  </div>

                  {/* Active Pathologies detected on interactive foot map */}
                  {patient.footIssues.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-teal-900 uppercase tracking-wider">VI. Lesões / Afecções Ativas Registradas no Mapa Podal</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {patient.footIssues.map((issue) => (
                          <div key={issue.id} className="border border-slate-200 p-2 rounded flex justify-between bg-slate-50/40">
                            <span><strong>{issue.condition}</strong> - Pé {issue.foot === "left" ? "Esquerdo" : "Direito"}</span>
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">{issue.status === "active" ? "ATIVA" : "RESOLVIDA"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signature lines */}
                  <div className="pt-16 grid grid-cols-2 gap-12 text-center text-[10px]">
                    <div className="space-y-1">
                      <div className="border-t border-slate-400 w-4/5 mx-auto pt-1"></div>
                      <p className="font-bold text-slate-700">Dra. Fabrícia Rodrigues</p>
                      <p className="text-slate-400">Podóloga Especialista • Assinatura Profissional</p>
                    </div>
                    <div className="space-y-1 flex flex-col items-center">
                      {formData.signature ? (
                        <div className="h-12 flex items-center justify-center">
                          <img 
                            src={formData.signature} 
                            alt="Assinatura Digital" 
                            className="h-12 object-contain mix-blend-multiply max-w-[200px]" 
                          />
                        </div>
                      ) : (
                        <div className="h-12"></div>
                      )}
                      <div className="border-t border-slate-400 w-4/5 mx-auto pt-1"></div>
                      <p className="font-bold text-slate-700">{formData.name}</p>
                      <p className="text-slate-400">Assinatura do Paciente / Responsável</p>
                      {formData.signedAt && (
                        <p className="text-[8px] text-emerald-600 font-bold mt-0.5">
                          ASSINADO DIGITALMENTE EM {new Date(formData.signedAt).toLocaleDateString("pt-BR")} às {new Date(formData.signedAt).toLocaleTimeString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Print footer */}
                  <div className="text-center pt-8 text-[8px] text-slate-400 border-t border-slate-100">
                    <p>Ficha de Prontuário Clínico Digital em conformidade com as diretrizes do Conselho de Saúde e de Podologia Brasileira. Termo assinado sob responsabilidade das partes.</p>
                  </div>

                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400 no-print">
            <User className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-semibold">Nenhum paciente selecionado</p>
            <p className="text-xs mt-1 text-slate-400">Por favor, selecione um paciente na lista lateral para preencher ou visualizar a ficha de anamnese.</p>
          </div>
        )}
      </div>
    </div>
  );
}
