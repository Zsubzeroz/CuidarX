import React, { useState, useEffect } from "react";
import { Patient, FootIssue } from "../types";
import FootMap from "./FootMap";
import {
  Search,
  Plus,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  FileText,
  Heart,
  PlusCircle,
  HelpCircle,
  Trash2,
  Check,
} from "lucide-react";

interface PatientViewProps {
  patients: Patient[];
  onAddPatient: (patient: Omit<Patient, "id" | "createdAt" | "footIssues" | "evolutions">) => void;
  onDeletePatient: (id: string) => Promise<void>;
  onUpdatePatientIssues: (patientId: string, issues: FootIssue[]) => void;
}

export default function PatientView({
  patients,
  onAddPatient,
  onDeletePatient,
  onUpdatePatientIssues,
}: PatientViewProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "map">("info");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  // New Patient Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newGender, setNewGender] = useState("Feminino");
  const [newIsDiabetic, setNewIsDiabetic] = useState(false);
  const [newHasCirculatory, setNewHasCirculatory] = useState(false);
  const [newIsSmoker, setNewIsSmoker] = useState(false);
  const [newAllergies, setNewAllergies] = useState("Não");
  const [newObservations, setNewObservations] = useState("");



  // Filter patients
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentPatient = patients.find((p) => p.id === selectedPatientId);

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    onAddPatient({
      name: newName,
      phone: newPhone,
      dob: newDob || "1990-01-01",
      gender: newGender,
      isDiabetic: newIsDiabetic,
      hasCirculatoryIssues: newHasCirculatory,
      isSmoker: newIsSmoker,
      hasAllergies: newAllergies,
      observations: newObservations,
    });

    // Reset Form
    setNewName("");
    setNewPhone("");
    setNewDob("");
    setNewGender("Feminino");
    setNewIsDiabetic(false);
    setNewHasCirculatory(false);
    setNewIsSmoker(false);
    setNewAllergies("Não");
    setNewObservations("");
    setShowAddForm(false);
  };

  const handleAddIssue = (newIssue: Omit<FootIssue, "id" | "createdAt">) => {
    if (!currentPatient) return;
    const issueWithId: FootIssue = {
      ...newIssue,
      id: `issue-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedIssues = [...currentPatient.footIssues, issueWithId];
    onUpdatePatientIssues(currentPatient.id, updatedIssues);
  };

  const handleResolveIssue = (issueId: string) => {
    if (!currentPatient) return;
    const updatedIssues = currentPatient.footIssues.map((issue) =>
      issue.id === issueId ? { ...issue, status: "resolved" as const } : issue
    );
    onUpdatePatientIssues(currentPatient.id, updatedIssues);
  };

  const handleDeleteIssue = (issueId: string) => {
    if (!currentPatient) return;
    const updatedIssues = currentPatient.footIssues.filter((issue) => issue.id !== issueId);
    onUpdatePatientIssues(currentPatient.id, updatedIssues);
  };


  return (
    <div id="patients-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {feedback && (
        <div className={`fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white page-enter ${feedback.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {feedback.message}
        </div>
      )}
      {/* LEFT SIDE: Patients List & Search */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Prontuários</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 bg-brand hover:bg-brand-700 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold transition-all"
          />
        </div>

        {/* Patients Cards */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredPatients.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">Nenhum paciente encontrado.</p>
          ) : (
            filteredPatients.map((patient) => {
              const activeCount = patient.footIssues.filter((i) => i.status === "active").length;
              return (
                <div
                  key={patient.id}
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setShowAddForm(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedPatientId === patient.id
                      ? "bg-emerald-50/50 border-emerald-200 ring-1 ring-emerald-500/10"
                      : "bg-white border-slate-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{patient.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{patient.phone}</p>
                    </div>
                    {patient.isDiabetic && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5 fill-amber-500 stroke-none" /> Diabético
                      </span>
                    )}
                  </div>
                  {activeCount > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-rose-600 font-medium">
                      <AlertTriangle className="w-3 h-3" /> {activeCount} lesões ativas
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Patient Clinical Dossier / Add Patient Form */}
      <div className="lg:col-span-8 space-y-6">
        {showAddForm ? (
          /* ADD PATIENT FORM */
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-gold" />
              Novo Prontuário de Paciente
            </h3>

            <form onSubmit={handleCreatePatient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Maria das Dores"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Data de Nascimento *</label>
                <input
                  type="date"
                  required
                  value={newDob}
                  onChange={(e) => setNewDob(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gênero</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Health checklist checkboxes */}
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Informações de Saúde</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={newIsDiabetic}
                      onChange={(e) => setNewIsDiabetic(e.target.checked)}
                      className="accent-gold w-4 h-4"
                    />
                    Diabético(a)?
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={newHasCirculatory}
                      onChange={(e) => setNewHasCirculatory(e.target.checked)}
                      className="accent-gold w-4 h-4"
                    />
                    Problemas Circulatórios?
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={newIsSmoker}
                      onChange={(e) => setNewIsSmoker(e.target.checked)}
                      className="accent-gold w-4 h-4"
                    />
                    Fumante?
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Alergias (Medicamentos / Tintas):</label>
                <input
                  type="text"
                  value={newAllergies}
                  onChange={(e) => setNewAllergies(e.target.value)}
                  placeholder="Ex: Dipirona, Latex, Iodo ou Nenhuma"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Observações Gerais / Histórico:</label>
                <textarea
                  value={newObservations}
                  onChange={(e) => setNewObservations(e.target.value)}
                  placeholder="Observações de cuidados preventivos extras, medicação contínua..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand hover:bg-brand-700 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Registrar Paciente
                </button>
              </div>
            </form>
          </div>
        ) : currentPatient ? (
          /* COMPLETE PATIENT CLINICAL DOSSIER */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden text-left space-y-4">
            {/* Patient Header card */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-800">{currentPatient.name}</h3>
                  {currentPatient.isDiabetic && (
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <Heart className="w-2.5 h-2.5 fill-amber-600 stroke-none" /> Diabético(a)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {currentPatient.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Nascimento: {new Date(currentPatient.dob + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              <button
                onClick={async () => {
                  if (confirm(`Tem certeza que deseja excluir permanentemente o prontuário de ${currentPatient.name}?`)) {
                    try {
                      await onDeletePatient(currentPatient.id);
                      setFeedback({ type: "success", message: `${currentPatient.name} excluído(a) com sucesso` });
                      const remaining = patients.filter((p) => p.id !== currentPatient.id);
                      setSelectedPatientId(remaining[0]?.id || "");
                    } catch (err) {
                      console.error("Erro ao excluir paciente:", err);
                      setFeedback({ type: "error", message: "Erro ao excluir paciente. Tente novamente." });
                    }
                  }
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 px-3 py-1.5 rounded-xl border border-rose-100 hover:border-rose-600 transition-all flex items-center gap-1 ml-auto cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Paciente
              </button>
            </div>

            {/* View Tabs */}
            <div className="px-6 border-b border-slate-100 flex gap-4">
              <button
                onClick={() => setActiveTab("info")}
                className={`pb-3 text-xs font-bold border-b-2 tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === "info"
                    ? "border-brand text-emerald-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Dados & Perfil
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`pb-3 text-xs font-bold border-b-2 tracking-wider uppercase transition-all cursor-pointer ${
                  activeTab === "map"
                    ? "border-brand text-emerald-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Mapa Podal Interativo
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {/* TAB 1: BASIC ANAMNESE */}
              {activeTab === "info" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gold" /> Perfil Clínico
                    </h4>
                    
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-50">
                          <td className="py-2.5 font-bold text-slate-500 w-1/3">Gênero:</td>
                          <td className="py-2.5 text-slate-700">{currentPatient.gender}</td>
                        </tr>
                        <tr className="border-b border-slate-50">
                          <td className="py-2.5 font-bold text-slate-500">Diabetes:</td>
                          <td className="py-2.5 text-slate-700 font-semibold">
                            {currentPatient.isDiabetic ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Sim (Requer Cuidado)</span>
                            ) : (
                              "Não"
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-50">
                          <td className="py-2.5 font-bold text-slate-500">Má Circulação:</td>
                          <td className="py-2.5 text-slate-700">
                            {currentPatient.hasCirculatoryIssues ? (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Sim</span>
                            ) : (
                              "Não"
                            )}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-50">
                          <td className="py-2.5 font-bold text-slate-500">Fumante:</td>
                          <td className="py-2.5 text-slate-700">{currentPatient.isSmoker ? "Sim" : "Não"}</td>
                        </tr>
                        <tr className="border-b border-slate-50">
                          <td className="py-2.5 font-bold text-slate-500">Alergias:</td>
                          <td className="py-2.5 text-rose-700 font-semibold">{currentPatient.hasAllergies}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-gold" /> Observações & Histórico
                    </h4>
                    
                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-slate-600">Fatos Podológicos Relevantes:</p>
                      <p className="text-slate-600 leading-relaxed italic whitespace-pre-line">
                        {currentPatient.observations || "Nenhuma observação clínica extra cadastrada."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE FOOT MAP */}
              {activeTab === "map" && (
                <div className="space-y-4">
                  <FootMap
                    issues={currentPatient.footIssues}
                    onAddIssue={handleAddIssue}
                    onResolveIssue={handleResolveIssue}
                    onDeleteIssue={handleDeleteIssue}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center text-slate-400">
            <User className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-semibold">Nenhum paciente selecionado.</p>
            <p className="text-xs mt-1 text-slate-400">Por favor, selecione um paciente na lista ou adicione um novo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
