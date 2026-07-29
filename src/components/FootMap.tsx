import React, { useState } from "react";
import { FootIssue } from "../types";
import { AlertCircle, CheckCircle, Info, PlusCircle, Trash2 } from "lucide-react";

interface FootMapProps {
  issues: FootIssue[];
  onAddIssue: (issue: Omit<FootIssue, "id" | "createdAt">) => void;
  onResolveIssue: (id: string) => void;
  onDeleteIssue: (id: string) => void;
  readOnly?: boolean;
}

export default function FootMap({
  issues,
  onAddIssue,
  onResolveIssue,
  onDeleteIssue,
  readOnly = false,
}: FootMapProps) {
  const [selectedFoot, setSelectedFoot] = useState<"left" | "right">("left");
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [condition, setCondition] = useState("Onicocriptose (Unha Encravada)");
  const [notes, setNotes] = useState("");

  const conditionsList = [
    "Onicocriptose (Unha Encravada)",
    "Onicomicose (Micose de Unha)",
    "Fissura Calcânea (Rachadura)",
    "Calo com Núcleo",
    "Verruga Plantar (Olho de Peixe)",
    "Tínea Pedis (Frieira)",
    "Hiperqueratose (Pele Grossa)",
    "Calosidade Geral",
    "Órtese Instalada",
  ];

  const handleFootClick = (e: React.MouseEvent<SVGSVGElement>, foot: "left" | "right") => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setClickCoords({ x, y });
    setSelectedFoot(foot);
  };

  const handleSaveIssue = () => {
    if (!clickCoords) return;
    onAddIssue({
      foot: selectedFoot,
      x: clickCoords.x,
      y: clickCoords.y,
      condition,
      notes,
      status: "active",
    });
    setClickCoords(null);
    setNotes("");
  };

  return (
    <div id="footmap-container" className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      {/* Interactive Map */}
      <div className="md:col-span-7 flex flex-col items-center">
        <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-gold" />
          {readOnly ? "Mapa de Lesões Ativas" : "Clique no mapa podal para registrar uma patologia"}
        </h4>

        <div className="flex gap-8 justify-center w-full max-w-md bg-slate-50 p-6 rounded-2xl border border-slate-100">
          {/* LEFT FOOT */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-xs font-semibold text-slate-500 mb-2">PÉ ESQUERDO (A)</span>
            <div className="relative w-full aspect-[2/3] max-w-[150px]">
              <svg
                viewBox="0 0 100 150"
                className={`w-full h-full cursor-crosshair select-none transition-all ${
                  !readOnly ? "hover:opacity-95" : ""
                }`}
                onClick={(e) => handleFootClick(e, "left")}
              >
                {/* Left Foot Path Outline */}
                <path
                  d="M 50,15 
                     C 38,15 32,22 34,30 
                     C 30,22 22,25 24,35 
                     C 18,28 12,32 16,42 
                     C 10,35 6,42 10,50 
                     C 6,45 2,52 6,60 
                     C 2,75 8,95 18,110 
                     C 28,125 35,142 50,142 
                     C 65,142 70,128 72,115 
                     C 74,95 72,75 66,60 
                     C 60,45 58,25 50,15 Z"
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  className="transition-colors hover:fill-emerald-50/40"
                />
                {/* Internal Details */}
                <path
                  d="M 50,110 C 45,115 35,110 32,120"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                
                {/* Active Foot Issues Markers */}
                {issues
                  .filter((issue) => issue.foot === "left")
                  .map((issue) => (
                    <g key={issue.id} className="group cursor-pointer">
                      <circle
                        cx={issue.x}
                        cy={issue.y}
                        r={issue.status === "active" ? "5" : "4"}
                        fill={issue.status === "active" ? "#f43f5e" : "#10b981"}
                        className={issue.status === "active" ? "animate-pulse" : ""}
                      />
                      <circle
                        cx={issue.x}
                        cy={issue.y}
                        r="10"
                        fill="transparent"
                        className="hover:stroke-slate-400 hover:stroke-1"
                      />
                    </g>
                  ))}
              </svg>
            </div>
          </div>

          {/* RIGHT FOOT */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-xs font-semibold text-slate-500 mb-2">PÉ DIREITO (B)</span>
            <div className="relative w-full aspect-[2/3] max-w-[150px]">
              <svg
                viewBox="0 0 100 150"
                className={`w-full h-full cursor-crosshair select-none transition-all ${
                  !readOnly ? "hover:opacity-95" : ""
                }`}
                onClick={(e) => handleFootClick(e, "right")}
              >
                {/* Right Foot Path Outline (Mirrored) */}
                <path
                  d="M 50,15 
                     C 62,15 68,22 66,30 
                     C 70,22 78,25 76,35 
                     C 82,28 88,32 84,42 
                     C 90,35 94,42 90,50 
                     C 94,45 98,52 94,60 
                     C 98,75 92,95 82,110 
                     C 72,125 65,142 50,142 
                     C 35,142 30,128 28,115 
                     C 26,95 28,75 34,60 
                     C 40,45 42,25 50,15 Z"
                  fill="#f8fafc"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  className="transition-colors hover:fill-emerald-50/40"
                />
                {/* Internal Details */}
                <path
                  d="M 50,110 C 55,115 65,110 68,120"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Active Foot Issues Markers */}
                {issues
                  .filter((issue) => issue.foot === "right")
                  .map((issue) => (
                    <g key={issue.id} className="group cursor-pointer">
                      <circle
                        cx={issue.x}
                        cy={issue.y}
                        r={issue.status === "active" ? "5" : "4"}
                        fill={issue.status === "active" ? "#f43f5e" : "#10b981"}
                        className={issue.status === "active" ? "animate-pulse" : ""}
                      />
                      <circle
                        cx={issue.x}
                        cy={issue.y}
                        r="10"
                        fill="transparent"
                        className="hover:stroke-slate-400 hover:stroke-1"
                      />
                    </g>
                  ))}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel / Issue Form / Markers List */}
      <div className="md:col-span-5 flex flex-col justify-between">
        {clickCoords && !readOnly ? (
          /* Create New Marker Form */
          <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl flex flex-col gap-3">
            <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <PlusCircle className="w-4 h-4 text-gold" />
              Novo Registro no Pé {selectedFoot === "left" ? "Esquerdo" : "Direito"}
            </h5>
            <p className="text-xs text-emerald-700">
              Coordenadas marcadas: X: {clickCoords.x}%, Y: {clickCoords.y}%
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Patologia:</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {conditionsList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Notas Clínicas / Detalhes:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Unha inflamada, dor de grau III, calo sob pressão metatarsal..."
                rows={3}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={() => setClickCoords(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveIssue}
                className="px-3 py-1.5 text-xs font-medium text-white bg-brand hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
              >
                Salvar Ponto
              </button>
            </div>
          </div>
        ) : (
          /* Markers list */
          <div className="flex flex-col h-full justify-start">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">Diagnósticos Registrados ({issues.length})</h4>
            {issues.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 h-full">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs">Nenhum ponto de lesão marcado no mapa ainda.</p>
                {!readOnly && <p className="text-[10px] mt-1 text-slate-400">Clique nos pés à esquerda para adicionar.</p>}
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col gap-1 transition-all ${
                      issue.status === "active"
                        ? "bg-rose-50/40 border-rose-100 text-slate-700"
                        : "bg-emerald-50/30 border-emerald-100 text-slate-500"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            issue.status === "active" ? "bg-rose-500" : "bg-gold"
                          }`}
                        />
                        {issue.condition}
                      </span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-medium uppercase">
                        {issue.foot === "left" ? "Pé Esq." : "Pé Dir."} ({issue.x}%, {issue.y}%)
                      </span>
                    </div>

                    {issue.notes && <p className="text-[11px] text-slate-600 italic bg-white/60 p-1.5 rounded">{issue.notes}</p>}

                    {!readOnly && (
                      <div className="flex justify-end gap-2 mt-1.5 border-t border-slate-100 pt-1.5">
                        {issue.status === "active" && (
                          <button
                            onClick={() => onResolveIssue(issue.id)}
                            className="text-[10px] text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-0.5 bg-emerald-50 hover:bg-gold/10 px-2 py-1 rounded transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" /> Resolvido
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteIssue(issue.id)}
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-0.5 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
