import React, { useState } from 'react';
import { FootMarker } from '../types';
import { Plus, Trash2, CheckCircle2, AlertCircle, Info, Footprints, ShieldAlert } from 'lucide-react';

interface PodogramMapProps {
  patientName: string;
  isDiabetic?: boolean;
  markers: FootMarker[];
  onAddMarker: (marker: FootMarker) => void;
  onRemoveMarker: (markerId: string) => void;
}

export const PodogramMap: React.FC<PodogramMapProps> = ({
  patientName,
  isDiabetic,
  markers = [],
  onAddMarker,
  onRemoveMarker,
}) => {
  const [activeFootView, setActiveFootView] = useState<'both' | 'left' | 'right'>('both');
  const [selectedMarker, setSelectedMarker] = useState<FootMarker | null>(null);

  // New marker draft state when user clicks on a foot
  const [draftCoords, setDraftCoords] = useState<{ foot: 'left' | 'right'; x: number; y: number } | null>(null);
  const [draftCondition, setDraftCondition] = useState('Onicocriptose (Hálux)');
  const [draftSeverity, setDraftSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [draftNotes, setDraftNotes] = useState('');

  const COMMON_CONDITIONS = [
    'Onicocriptose (Hálux)',
    'Calo com Núcleo (Heloma)',
    'Fissura Calcânea Profunda',
    'Verruga Plantar (Olho de Peixe)',
    'Hiperqueratose Metatarsal',
    'Onicomicose com Espessamento',
    'Tínea Pedis (Frieira)',
    'Úlcera / Lesão por Pressão',
  ];

  const handleFootClick = (e: React.MouseEvent<SVGSVGElement>, foot: 'left' | 'right') => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setDraftCoords({
      foot,
      x: Math.round(clickX),
      y: Math.round(clickY),
    });
    setSelectedMarker(null);
  };

  const handleSaveDraft = () => {
    if (!draftCoords) return;

    const newMarker: FootMarker = {
      id: `mark-${Date.now()}`,
      foot: draftCoords.foot,
      x: draftCoords.x,
      y: draftCoords.y,
      condition: draftCondition,
      severity: draftSeverity,
      notes: draftNotes.trim() || undefined,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    };

    onAddMarker(newMarker);
    setDraftCoords(null);
    setDraftNotes('');
  };

  const leftMarkers = markers.filter((m) => m.foot === 'left');
  const rightMarkers = markers.filter((m) => m.foot === 'right');

  return (
    <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[18px] p-4 sm:p-5 shadow-xs select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-[#E4D8C4]/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] sm:text-[15px] font-semibold text-[#24312E] flex items-center gap-1.5">
              <Footprints size={16} className="text-[#0F766E]" />
              Podograma Interativo (Mapeamento Clínico)
            </h3>
            {isDiabetic && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F6E4DA] text-[#B5542B] border border-[#B5542B]/30">
                <ShieldAlert size={12} />
                Pé Diabético
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#5B665F] mt-0.5">
            Clique no pé para marcar a localização exata de lesões, unhas encravadas ou calosidades.
          </p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-[#F3E6D2]/60 p-1 rounded-[10px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFootView('both')}
            className={`px-2.5 py-1 text-[11.5px] font-medium rounded-[7px] transition-all ${
              activeFootView === 'both'
                ? 'bg-[#FFFDF9] text-[#0B5D56] shadow-xs font-semibold'
                : 'text-[#5B665F] hover:text-[#24312E]'
            }`}
          >
            Ambos os pés
          </button>
          <button
            type="button"
            onClick={() => setActiveFootView('left')}
            className={`px-2.5 py-1 text-[11.5px] font-medium rounded-[7px] transition-all ${
              activeFootView === 'left'
                ? 'bg-[#FFFDF9] text-[#0B5D56] shadow-xs font-semibold'
                : 'text-[#5B665F] hover:text-[#24312E]'
            }`}
          >
            Pé Esquerdo ({leftMarkers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFootView('right')}
            className={`px-2.5 py-1 text-[11.5px] font-medium rounded-[7px] transition-all ${
              activeFootView === 'right'
                ? 'bg-[#FFFDF9] text-[#0B5D56] shadow-xs font-semibold'
                : 'text-[#5B665F] hover:text-[#24312E]'
            }`}
          >
            Pé Direito ({rightMarkers.length})
          </button>
        </div>
      </div>

      {/* Feet Canvas Area */}
      <div className="py-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
        {/* Left Foot */}
        {(activeFootView === 'both' || activeFootView === 'left') && (
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-semibold text-[#5B665F] mb-1.5 uppercase tracking-wider">
              Pé Esquerdo
            </span>
            <div className="relative w-[150px] sm:w-[170px] h-[260px] sm:h-[280px] bg-[#FAF6F0] rounded-[22px] border border-[#E4D8C4] p-3 flex items-center justify-center shadow-inner cursor-crosshair">
              {/* SVG silhouette for left foot sole */}
              <svg
                viewBox="0 0 100 180"
                className="w-full h-full text-[#0F766E]/20 hover:text-[#0F766E]/30 transition-colors"
                onClick={(e) => handleFootClick(e, 'left')}
              >
                {/* Toes left foot (big toe is on the right side of left foot sole) */}
                <circle cx="68" cy="18" r="9" fill="currentColor" />
                <circle cx="50" cy="19" r="6.5" fill="currentColor" />
                <circle cx="36" cy="23" r="5.5" fill="currentColor" />
                <circle cx="25" cy="29" r="4.8" fill="currentColor" />
                <circle cx="16" cy="37" r="4.2" fill="currentColor" />
                {/* Main sole contour */}
                <path
                  d="M 68 34 C 82 42, 85 65, 82 85 C 80 100, 75 115, 68 128 C 66 142, 66 160, 52 165 C 38 168, 30 156, 30 142 C 30 120, 22 95, 20 75 C 18 55, 30 40, 52 35 Z"
                  fill="currentColor"
                  stroke="#0F766E"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* Anatomical guide lines: metatarsal arch & heel */}
                <path d="M 28 65 Q 50 72 78 65" stroke="#E4D8C4" strokeWidth="1" strokeDasharray="2,2" fill="none" />
                <path d="M 33 138 Q 45 130 63 138" stroke="#E4D8C4" strokeWidth="1" strokeDasharray="2,2" fill="none" />
              </svg>

              {/* Placed Markers for left foot */}
              {leftMarkers.map((marker) => (
                <button
                  key={marker.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarker(marker);
                    setDraftCoords(null);
                  }}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  title={`${marker.condition} (${marker.severity})`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md cursor-pointer transition-transform hover:scale-125 z-10 ${
                    marker.severity === 'severe'
                      ? 'bg-[#B5542B] ring-2 ring-[#B5542B]/40 animate-pulse'
                      : marker.severity === 'moderate'
                      ? 'bg-[#C8A45A] ring-2 ring-[#C8A45A]/40'
                      : 'bg-[#0F766E] ring-2 ring-[#0F766E]/40'
                  }`}
                >
                  !
                </button>
              ))}

              {/* Draft placement indicator */}
              {draftCoords?.foot === 'left' && (
                <div
                  style={{ left: `${draftCoords.x}%`, top: `${draftCoords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-[12px] animate-bounce shadow-lg pointer-events-none z-20 ring-4 ring-[#0F766E]/30"
                >
                  <Plus size={14} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Foot */}
        {(activeFootView === 'both' || activeFootView === 'right') && (
          <div className="flex flex-col items-center">
            <span className="text-[12px] font-semibold text-[#5B665F] mb-1.5 uppercase tracking-wider">
              Pé Direito
            </span>
            <div className="relative w-[150px] sm:w-[170px] h-[260px] sm:h-[280px] bg-[#FAF6F0] rounded-[22px] border border-[#E4D8C4] p-3 flex items-center justify-center shadow-inner cursor-crosshair">
              {/* SVG silhouette for right foot sole */}
              <svg
                viewBox="0 0 100 180"
                className="w-full h-full text-[#0F766E]/20 hover:text-[#0F766E]/30 transition-colors"
                onClick={(e) => handleFootClick(e, 'right')}
              >
                {/* Toes right foot (big toe is on the left side of right foot sole) */}
                <circle cx="32" cy="18" r="9" fill="currentColor" />
                <circle cx="50" cy="19" r="6.5" fill="currentColor" />
                <circle cx="64" cy="23" r="5.5" fill="currentColor" />
                <circle cx="75" cy="29" r="4.8" fill="currentColor" />
                <circle cx="84" cy="37" r="4.2" fill="currentColor" />
                {/* Main sole contour */}
                <path
                  d="M 32 34 C 18 42, 15 65, 18 85 C 20 100, 25 115, 32 128 C 34 142, 34 160, 48 165 C 62 168, 70 156, 70 142 C 70 120, 78 95, 80 75 C 82 55, 70 40, 48 35 Z"
                  fill="currentColor"
                  stroke="#0F766E"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                {/* Anatomical guide lines */}
                <path d="M 72 65 Q 50 72 22 65" stroke="#E4D8C4" strokeWidth="1" strokeDasharray="2,2" fill="none" />
                <path d="M 67 138 Q 55 130 37 138" stroke="#E4D8C4" strokeWidth="1" strokeDasharray="2,2" fill="none" />
              </svg>

              {/* Placed Markers for right foot */}
              {rightMarkers.map((marker) => (
                <button
                  key={marker.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarker(marker);
                    setDraftCoords(null);
                  }}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  title={`${marker.condition} (${marker.severity})`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md cursor-pointer transition-transform hover:scale-125 z-10 ${
                    marker.severity === 'severe'
                      ? 'bg-[#B5542B] ring-2 ring-[#B5542B]/40 animate-pulse'
                      : marker.severity === 'moderate'
                      ? 'bg-[#C8A45A] ring-2 ring-[#C8A45A]/40'
                      : 'bg-[#0F766E] ring-2 ring-[#0F766E]/40'
                  }`}
                >
                  !
                </button>
              ))}

              {/* Draft placement indicator */}
              {draftCoords?.foot === 'right' && (
                <div
                  style={{ left: `${draftCoords.x}%`, top: `${draftCoords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0F766E] text-white flex items-center justify-center text-[12px] animate-bounce shadow-lg pointer-events-none z-20 ring-4 ring-[#0F766E]/30"
                >
                  <Plus size={14} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helper Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-[#5B665F] border-t border-[#E4D8C4]/40">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" /> Leve (Em observação)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8A45A]" /> Moderado (Procedimento ativo)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B5542B]" /> Severo (Atenção redobrada)
        </span>
      </div>

      {/* Popover / Box: Creating a new pin */}
      {draftCoords && (
        <div className="mt-4 p-3.5 sm:p-4 bg-[#FAF6F0] rounded-[14px] border border-[#0F766E]/30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12.5px] font-semibold text-[#0B5D56] flex items-center gap-1">
              <Plus size={14} />
              Novo Ponto no {draftCoords.foot === 'left' ? 'Pé Esquerdo' : 'Pé Direito'} ({draftCoords.x}%, {draftCoords.y}%)
            </span>
            <button
              type="button"
              onClick={() => setDraftCoords(null)}
              className="text-[11.5px] text-[#86918a] hover:text-[#24312E]"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
            <div>
              <label className="block text-[11px] font-medium text-[#5B665F] mb-1">
                Condição / Patologia
              </label>
              <select
                value={draftCondition}
                onChange={(e) => setDraftCondition(e.target.value)}
                className="w-full text-[12.5px] bg-[#FFFDF9] border border-[#E4D8C4] rounded-[8px] p-2 text-[#24312E] focus:outline-none focus:border-[#0F766E]"
              >
                {COMMON_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#5B665F] mb-1">
                Severidade
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDraftSeverity('mild')}
                  className={`flex-1 py-1.5 rounded-[8px] text-[11.5px] font-medium border transition-colors ${
                    draftSeverity === 'mild'
                      ? 'bg-[#E3EEEC] text-[#0F766E] border-[#0F766E] font-semibold'
                      : 'bg-[#FFFDF9] text-[#5B665F] border-[#E4D8C4]'
                  }`}
                >
                  Leve
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSeverity('moderate')}
                  className={`flex-1 py-1.5 rounded-[8px] text-[11.5px] font-medium border transition-colors ${
                    draftSeverity === 'moderate'
                      ? 'bg-[#F9F3E5] text-[#C8A45A] border-[#C8A45A] font-semibold'
                      : 'bg-[#FFFDF9] text-[#5B665F] border-[#E4D8C4]'
                  }`}
                >
                  Moderado
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSeverity('severe')}
                  className={`flex-1 py-1.5 rounded-[8px] text-[11.5px] font-medium border transition-colors ${
                    draftSeverity === 'severe'
                      ? 'bg-[#F6E4DA] text-[#B5542B] border-[#B5542B] font-semibold'
                      : 'bg-[#FFFDF9] text-[#5B665F] border-[#E4D8C4]'
                  }`}
                >
                  Severo
                </button>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-[11px] font-medium text-[#5B665F] mb-1">
              Observações clínicas para este ponto
            </label>
            <input
              type="text"
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder="Ex: Espícula lateral presente, dor à palpação grau 6..."
              className="w-full text-[12px] bg-[#FFFDF9] border border-[#E4D8C4] rounded-[8px] p-2 text-[#24312E] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="w-full py-2 bg-[#0F766E] hover:bg-[#0B5D56] text-white text-[12.5px] font-semibold rounded-[9px] transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            Salvar ponto no podograma
          </button>
        </div>
      )}

      {/* Selected Marker Detail Card */}
      {selectedMarker && !draftCoords && (
        <div className="mt-4 p-3.5 sm:p-4 bg-[#FFFDF9] rounded-[14px] border border-[#E4D8C4] shadow-sm animate-in fade-in duration-150">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  selectedMarker.severity === 'severe'
                    ? 'bg-[#B5542B]'
                    : selectedMarker.severity === 'moderate'
                    ? 'bg-[#C8A45A]'
                    : 'bg-[#0F766E]'
                }`}
              />
              <div>
                <h4 className="text-[13.5px] font-semibold text-[#24312E]">
                  {selectedMarker.condition}
                </h4>
                <div className="text-[11.5px] text-[#5B665F]">
                  {selectedMarker.foot === 'left' ? 'Pé Esquerdo' : 'Pé Direito'} · Registrado em {selectedMarker.date}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onRemoveMarker(selectedMarker.id);
                setSelectedMarker(null);
              }}
              className="text-[#B5542B] hover:text-[#8e3916] text-[11.5px] font-medium flex items-center gap-1 p-1 hover:bg-[#F6E4DA] rounded-[6px] transition-colors"
              title="Remover ponto"
            >
              <Trash2 size={13} />
              Remover
            </button>
          </div>

          {selectedMarker.notes && (
            <p className="mt-2 text-[12.5px] text-[#5B665F] bg-[#FAF6F0] p-2.5 rounded-[8px] border border-[#E4D8C4]/50">
              {selectedMarker.notes}
            </p>
          )}

          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => setSelectedMarker(null)}
              className="text-[11.5px] text-[#5B665F] hover:text-[#24312E] underline"
            >
              Fechar detalhes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
