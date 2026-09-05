import React, { useState } from 'react';
import { Patient } from '../types';
import { X, SlidersHorizontal, Grid } from 'lucide-react';

interface PhotoInspectionModalProps {
  isOpen: boolean;
  patient: Patient | null;
  onClose: () => void;
}

export const PhotoInspectionModal: React.FC<PhotoInspectionModalProps> = ({
  isOpen,
  patient,
  onClose,
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');

  if (!isOpen || !patient) return null;

  const beforePhoto = patient.photos.find((p) => p.type === 'before') || patient.photos[0];
  const afterPhoto = patient.photos.find((p) => p.type === 'after') || patient.photos[1];

  return (
    <div className="fixed inset-0 z-50 bg-[#24312E]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FFFDF9] w-full max-w-[390px] sm:max-w-[540px] md:max-w-[640px] rounded-[24px] p-5 sm:p-6 shadow-2xl border border-[#E4D8C4] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4D8C4]">
          <div>
            <h2 className="font-fraunces text-[16px] font-bold text-[#24312E]">
              Evolução Fotográfica
            </h2>
            <p className="text-[11.5px] text-[#5B665F]">
              {patient.name} · {patient.condition}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F3E6D2] hover:bg-[#E4D8C4] flex items-center justify-center text-[#5B665F]"
          >
            <X size={15} />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1.5 p-1 bg-[#F3E6D2]/60 rounded-xl my-3.5 border border-[#E4D8C4]">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`flex-1 py-1.5 text-[11.5px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'slider'
                ? 'bg-white text-[#0F766E] shadow-xs'
                : 'text-[#5B665F] hover:text-[#24312E]'
            }`}
          >
            <SlidersHorizontal size={13} />
            Comparativo Antes/Depois
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex-1 py-1.5 text-[11.5px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-[#0F766E] shadow-xs'
                : 'text-[#5B665F] hover:text-[#24312E]'
            }`}
          >
            <Grid size={13} />
            Todas as Fotos ({patient.photos.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {viewMode === 'slider' ? (
            <div>
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black select-none shadow-inner border border-[#E4D8C4]">
                {/* After image (background) */}
                <img
                  src={afterPhoto?.url}
                  alt="Depois"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute bottom-3 right-3 z-10 bg-[#0F766E]/90 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                  Depois
                </span>

                {/* Before image (clipped on top) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={beforePhoto?.url}
                    alt="Antes"
                    className="absolute inset-0 max-w-none h-full object-cover"
                    style={{ width: '330px' }}
                  />
                  <span className="absolute bottom-3 left-3 z-10 bg-[#B5542B]/90 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                    Antes
                  </span>
                </div>

                {/* Divider Line & Handle */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-white shadow-lg pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-[#24312E] shadow-md border border-[#E4D8C4] flex items-center justify-center text-[10px] font-bold">
                    ↔
                  </div>
                </div>
              </div>

              {/* Slider Controller */}
              <div className="mt-3 px-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="w-full accent-[#0F766E] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#5B665F] font-medium mt-1">
                  <span>← 100% Antes</span>
                  <span>Arraste para comparar</span>
                  <span>100% Depois →</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {patient.photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="bg-[#FBF3E7] rounded-xl overflow-hidden border border-[#E4D8C4] group"
                >
                  <div className="relative aspect-square">
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span
                      className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                        photo.type === 'before'
                          ? 'bg-[#B5542B]'
                          : photo.type === 'after'
                          ? 'bg-[#0F766E]'
                          : 'bg-[#5B7A63]'
                      }`}
                    >
                      {photo.label}
                    </span>
                  </div>
                  <div className="p-2 text-[11.5px] text-[#5B665F] flex justify-between items-center bg-white">
                    <span>Foto #{idx + 1}</span>
                    <span className="text-[10.5px] text-[#86918a]">{photo.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-3.5 w-full py-2.5 rounded-[12px] bg-[#0F766E] text-white text-[13px] font-semibold hover:bg-[#0B5D56] transition-colors"
        >
          Fechar Visualizador
        </button>
      </div>
    </div>
  );
};
