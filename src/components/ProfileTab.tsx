import React from 'react';
import { User, Award, Phone, ShieldCheck, MapPin, Sparkles, BookOpen, Clock } from 'lucide-react';

export const ProfileTab: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto px-5 pt-3 pb-28 no-scrollbar max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Profile Card */}
        <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#E4D8C4] rounded-[20px] p-5 text-center shadow-2xs">
          <div className="w-24 h-24 rounded-2xl mx-auto mb-3.5 bg-[#E3EEEC] border-2 border-[#0F766E] flex items-center justify-center text-[#0B5D56] shadow-sm relative">
            <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12">
              <path d="M9.5 4.5c1 0 1.7.9 1.7 2s-.7 2-1.7 2-1.7-.9-1.7-2 .7-2 1.7-2Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12.3 5.2c.8 0 1.4.8 1.4 1.7 0 1-.6 1.7-1.4 1.7-.8 0-1.4-.8-1.4-1.7 0-1 .6-1.7 1.4-1.7Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M14.6 6.6c.7 0 1.2.7 1.2 1.5 0 .8-.5 1.5-1.2 1.5-.7 0-1.2-.7-1.2-1.5 0-.8.5-1.5 1.2-1.5Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7.3 6.4c.8 0 1.4.8 1.4 1.8s-.6 1.8-1.4 1.8-1.4-.8-1.4-1.8.6-1.8 1.4-1.8Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 11c-2 1-3.3 3-3.3 5.4 0 2.7 2 4.1 4.4 4.1 1.6 0 2.5-.6 3.7-.6 1 0 1.7.6 3 .6 2.4 0 3.9-1.8 3.9-4 0-3.6-2.6-5.6-4.6-7.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="absolute -bottom-1 -right-1 bg-[#0F766E] text-white p-1.5 rounded-full border-2 border-white shadow-xs">
              <ShieldCheck size={13} />
            </span>
          </div>

          <h2 className="font-fraunces text-[20px] font-bold text-[#24312E]">
            Drª. Renata Silveira
          </h2>
          <p className="text-[13px] text-[#0F766E] font-semibold mt-0.5">
            Podóloga Especialista · CRPO/ABRAP 4529-SP
          </p>
          <p className="text-[12px] text-[#5B665F] mt-1.5 leading-relaxed">
            Especialista em Podogeriatria, Onicocriptose e Pé Diabético com foco em cicatrização acelerada e biossegurança.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-[#E4D8C4]/60 text-center">
            <div className="bg-[#FBF3E7] p-2.5 rounded-xl">
              <div className="text-[17px] font-bold text-[#24312E]">148</div>
              <div className="text-[10.5px] text-[#5B665F]">Atendimentos/mês</div>
            </div>
            <div className="bg-[#FBF3E7] p-2.5 rounded-xl">
              <div className="text-[17px] font-bold text-[#0F766E]">96%</div>
              <div className="text-[10.5px] text-[#5B665F]">Resolutividade</div>
            </div>
            <div className="bg-[#FBF3E7] p-2.5 rounded-xl">
              <div className="text-[17px] font-bold text-[#B5542B]">4.9 ★</div>
              <div className="text-[10.5px] text-[#5B665F]">Avaliação</div>
            </div>
          </div>
        </div>

        {/* Right side info cards on desktop */}
        <div className="lg:col-span-7 space-y-4">
          {/* Clinic info */}
          <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[20px] p-5 shadow-2xs">
            <h3 className="text-[14px] font-semibold text-[#24312E] mb-3 flex items-center gap-2">
              <MapPin size={17} className="text-[#0F766E]" />
              Consultório e Biossegurança
            </h3>
            <div className="text-[13px] text-[#5B665F] space-y-2.5">
              <div className="flex justify-between py-1 border-b border-[#E4D8C4]/40">
                <span>Unidade:</span>
                <span className="font-semibold text-[#24312E]">Clínica Cuidar+ Saúde — Sala 304</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E4D8C4]/40">
                <span>Autoclave Hospitalar:</span>
                <span className="text-[#5B7A63] font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#5B7A63]" />
                  Ciclo 134°C OK (12:30 — Fita aprovada)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E4D8C4]/40">
                <span>Próximo plantão:</span>
                <span className="font-medium text-[#24312E]">Amanhã a partir das 08:30</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Registro Sanitário:</span>
                <span className="font-medium text-[#24312E]">Alvará Ativo SP-2026/8892</span>
              </div>
            </div>
          </div>

          {/* Clinical quick references */}
          <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[20px] p-5 shadow-2xs">
            <h3 className="text-[14px] font-semibold text-[#24312E] mb-3 flex items-center gap-2">
              <BookOpen size={17} className="text-[#0F766E]" />
              Protocolos Clínicos Integrados
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#FBF3E7] hover:bg-[#F3E6D2] transition-colors flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-[#24312E]">Classificação de Onicocriptose</div>
                  <div className="text-[11.5px] text-[#5B665F]">Graus I a III, técnicas de espícula e assepsia</div>
                </div>
                <span className="text-[#0F766E] font-bold text-[11.5px] bg-[#FFFDF9] px-2.5 py-1 rounded-lg border border-[#E4D8C4]">Ativo</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FBF3E7] hover:bg-[#F3E6D2] transition-colors flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-[#24312E]">Protocolo de Rastreio Pé Diabético</div>
                  <div className="text-[11.5px] text-[#5B665F]">Monofilamento 10g Semmes-Weinstein + Pulsos</div>
                </div>
                <span className="text-[#0F766E] font-bold text-[11.5px] bg-[#FFFDF9] px-2.5 py-1 rounded-lg border border-[#E4D8C4]">Ativo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
