import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Database,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Save,
  Shield,
  Phone,
} from 'lucide-react';

export const ConfiguracoesTab: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form states matching Screenshots 8 & 9
  const [blockWeekends, setBlockWeekends] = useState(false);
  const [showPrices, setShowPrices] = useState(true);
  const [requireConfirmation, setRequireConfirmation] = useState(true);
  const [clinicPhone, setClinicPhone] = useState('(19) 99876-5432');
  const [clinicAddress, setClinicAddress] = useState('Rua das Flores, 450 - Centro Médico Integrado');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [slotDuration, setSlotDuration] = useState('45');

  const [whatsappTemplate, setWhatsappTemplate] = useState(
    `Olá {paciente}! 🌿\nSua consulta na Clínica CuidarX com {profissional} está agendada para {data} às {horario}.\nProcedimento: {servico}.\n\nPara confirmar ou esclarecer dúvidas, basta responder esta mensagem!`
  );

  const clientPortalUrl = 'https://cuidarx-20052026.web.app/cliente';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientPortalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-24 no-scrollbar space-y-6">
      {/* Header matching Screenshot 8 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4D8C4]">
        <div>
          <h1 className="font-fraunces text-[22px] font-semibold text-[#14261C]">
            Configurações do Sistema
          </h1>
          <p className="text-[13px] text-[#55695E] mt-0.5">
            Preferências da clínica, regras do Portal do Cliente, horários de expediente e integrações
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          <span>{saved ? 'Alterações Salvas!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Portal do Cliente & Agendamento Online */}
        <div className="space-y-6">
          {/* Card: Portal do Cliente Online */}
          <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E4D8C4]">
              <Globe size={18} className="text-[#0F766E]" />
              <h3 className="font-bold text-[15px] text-[#14261C]">
                Portal de Agendamento do Cliente
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#55695E] uppercase tracking-wider mb-1.5">
                Link Público do Agendamento
              </label>
              <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2">
                <input
                  type="text"
                  readOnly
                  value={clientPortalUrl}
                  className="flex-1 bg-transparent border-none text-[12.5px] font-mono text-[#14261C] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-[#0F766E] text-white text-[11.5px] font-bold flex items-center gap-1 hover:bg-[#0B5D56] transition-colors"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E4D8C4]">
                <div>
                  <span className="font-bold text-[13px] text-[#14261C] block">
                    Exibir Preços dos Procedimentos no Portal
                  </span>
                  <span className="text-[11.5px] text-[#55695E]">
                    Permite ao paciente visualizar os valores antes de reservar
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showPrices}
                  onChange={(e) => setShowPrices(e.target.checked)}
                  className="w-5 h-5 accent-[#0F766E] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E4D8C4]">
                <div>
                  <span className="font-bold text-[13px] text-[#14261C] block">
                    Bloquear Fins de Semana (Sáb/Dom)
                  </span>
                  <span className="text-[11.5px] text-[#55695E]">
                    Impede agendamento online fora dos dias úteis
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={blockWeekends}
                  onChange={(e) => setBlockWeekends(e.target.checked)}
                  className="w-5 h-5 accent-[#0F766E] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E4D8C4]">
                <div>
                  <span className="font-bold text-[13px] text-[#14261C] block">
                    Exigir Confirmação via WhatsApp
                  </span>
                  <span className="text-[11.5px] text-[#55695E]">
                    Agendamento entra como "Pendente" até confirmação da clínica
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={requireConfirmation}
                  onChange={(e) => setRequireConfirmation(e.target.checked)}
                  className="w-5 h-5 accent-[#0F766E] rounded"
                />
              </div>
            </div>
          </div>

          {/* Card: Horário de Atendimento */}
          <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E4D8C4]">
              <Clock size={18} className="text-[#0F766E]" />
              <h3 className="font-bold text-[15px] text-[#14261C]">
                Horários de Expediente da Clínica
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#55695E] uppercase tracking-wider mb-1">
                  Abertura
                </label>
                <input
                  type="text"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#55695E] uppercase tracking-wider mb-1">
                  Encerramento
                </label>
                <input
                  type="text"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#55695E] uppercase tracking-wider mb-1">
                Duração Padrão do Slot de Atendimento (minutos)
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
              >
                <option value="30">30 minutos</option>
                <option value="45">45 minutos (Recomendado)</option>
                <option value="60">60 minutos (1 hora)</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WhatsApp & Informações da Clínica */}
        <div className="space-y-6">
          {/* Card: WhatsApp Notification Template */}
          <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E4D8C4]">
              <MessageSquare size={18} className="text-[#0F766E]" />
              <h3 className="font-bold text-[15px] text-[#14261C]">
                Mensagem Automática de Confirmação (WhatsApp)
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#55695E] uppercase tracking-wider mb-1">
                WhatsApp Oficial da Clínica
              </label>
              <input
                type="text"
                value={clinicPhone}
                onChange={(e) => setClinicPhone(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#55695E] uppercase tracking-wider mb-1">
                Template da Mensagem
              </label>
              <textarea
                rows={5}
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl p-3 text-[12.5px] font-mono text-[#14261C]"
              />
              <span className="text-[11px] text-[#55695E] block mt-1">
                Tags disponíveis: <b>{'{paciente}'}</b>, <b>{'{profissional}'}</b>, <b>{'{data}'}</b>, <b>{'{horario}'}</b>, <b>{'{servico}'}</b>
              </span>
            </div>
          </div>

          {/* Card: Endereço & Unidade */}
          <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E4D8C4]">
              <Shield size={18} className="text-[#0F766E]" />
              <h3 className="font-bold text-[15px] text-[#14261C]">
                Dados da Unidade Clínica
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#55695E] uppercase tracking-wider mb-1">
                Endereço Físico
              </label>
              <input
                type="text"
                value={clinicAddress}
                onChange={(e) => setClinicAddress(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
              />
            </div>

            <div className="p-3 bg-[#E3EEEC] rounded-xl border border-[#0F766E]/30 text-[12px] text-[#0F766E]">
              <span className="font-bold block">Status da Conexão:</span>
              <span>Banco de dados operacional e sincronizado localmente. Pronto para persistência em nuvem.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
