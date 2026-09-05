import React, { useState } from 'react';
import { Patient } from '../types';
import {
  Copy,
  Check,
  QrCode,
  Share2,
  ExternalLink,
  MessageSquare,
  X,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';

interface ClientShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onOpenClientPortal: () => void;
}

export const ClientShareModal: React.FC<ClientShareModalProps> = ({
  isOpen,
  onClose,
  patient,
  onOpenClientPortal,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const clientUrl = 'https://cuidarx-20052026.web.app/cliente';

  const handleCopy = () => {
    navigator.clipboard.writeText(clientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappMessage = `Olá ${patient ? patient.name.split(' ')[0] : ''}! Aqui está o seu acesso exclusivo à Área do Cliente CuidarX para acompanhar sua evolução podológica, fotos de antes e depois e orientações de cuidados: ${clientUrl}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#24312E]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] p-6 max-w-md w-full shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FBF3E7] hover:bg-[#F3E6D2] border border-[#E4D8C4] flex items-center justify-center text-[#5B665F] transition-colors"
        >
          <X size={15} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center shrink-0">
            <Share2 size={22} />
          </div>
          <div>
            <h3 className="font-fraunces text-[18px] font-bold text-[#24312E]">
              Área do Cliente CuidarX
            </h3>
            <p className="text-[12px] text-[#5B665F]">
              Compartilhe o prontuário e orientações com o paciente
            </p>
          </div>
        </div>

        {patient && (
          <div className="bg-[#FBF3E7] p-3 rounded-xl mb-4 border border-[#E4D8C4]/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#5B665F] block">Paciente Selecionado</span>
              <span className="text-[13px] font-bold text-[#24312E]">{patient.name}</span>
            </div>
            <span className="text-[11px] font-semibold text-[#0F766E] bg-white px-2 py-0.5 rounded border border-[#E4D8C4]">
              {patient.condition.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Official URL Box */}
        <div className="mb-4">
          <label className="text-[11.5px] font-semibold text-[#5B665F] mb-1.5 block">
            Endereço Web do Portal do Cliente:
          </label>
          <div className="flex items-center gap-2 bg-white border border-[#E4D8C4] rounded-xl p-2.5">
            <input
              type="text"
              readOnly
              value={clientUrl}
              className="bg-transparent border-none outline-none text-[12.5px] text-[#0F766E] font-mono flex-1 select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="bg-[#0F766E] hover:bg-[#0B5D56] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* QR Code Preview */}
        <div className="text-center bg-[#FBF3E7] p-4 rounded-2xl border border-[#E4D8C4]/60 mb-4">
          <div className="bg-white p-2.5 rounded-xl border border-[#E4D8C4] inline-block mb-2 shadow-xs">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                clientUrl
              )}`}
              alt="QR Code CuidarX Cliente"
              className="w-28 h-28 mx-auto"
            />
          </div>
          <p className="text-[11.5px] text-[#5B665F]">
            O paciente pode apontar a câmera do celular para abrir imediatamente.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <MessageSquare size={16} />
            <span>Enviar Link via WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenClientPortal();
            }}
            className="w-full bg-[#FFFDF9] hover:bg-[#F3E6D2] border border-[#E4D8C4] text-[#24312E] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ExternalLink size={15} className="text-[#0F766E]" />
            <span>Abrir e Visualizar como Paciente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
