import React, { useState } from 'react';
import { Patient } from '../types';
import {
  Sparkles,
  Send,
  User,
  Bot,
  Copy,
  Check,
  FileText,
  AlertCircle,
  HelpCircle,
  Share2,
} from 'lucide-react';

interface IaTabProps {
  patients: Patient[];
  selectedPatientId: string | null;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

const QUICK_PROTOCOLS = [
  {
    title: '🦶 Protocolo Pé Diabético',
    prompt: 'Quais os cuidados essenciais e contraindicações de corte e desbaste em paciente neuropata diabético?',
  },
  {
    title: '🩹 Onicocriptose Grau II/III',
    prompt: 'Qual a conduta clínica recomendada para espícula ungueal infectada com tecido de granulação?',
  },
  {
    title: '🌿 Micose / Tinea Pedis',
    prompt: 'Qual o protocolo de assepsia, desbastamento e orientação para onicomicose em idosos?',
  },
  {
    title: '📲 Gerar Pós-Consulta WhatsApp',
    prompt: 'Gere uma mensagem amigável e profissional para WhatsApp com instruções pós-atendimento para os pés do meu paciente.',
  },
];

export const IaTab: React.FC<IaTabProps> = ({ patients, selectedPatientId }) => {
  const [activePatientId, setActivePatientId] = useState<string>(
    selectedPatientId || (patients[0]?.id ?? '')
  );

  const currentPatient = patients.find((p) => p.id === activePatientId);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Olá, Doutora! Sou a sua Assistente Clínica Inteligente da CuidarX. Posso auxiliar com diretrizes de conduta para onicocriptose, rastreio de pé de risco diabético, sugestão de produtos emolientes e redação de orientações pós-atendimento para enviar ao paciente.',
      time: 'Agora',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    // Simulate AI response customized with patient context
    setTimeout(() => {
      let aiReply = '';
      const lower = text.toLowerCase();

      if (lower.includes('diabético') || lower.includes('neuropata')) {
        aiReply = `📋 **Protocolo Podológico — Pé Diabético (${currentPatient?.name || 'Geral'}):**\n\n1. **Inspeção Prévia:** Avaliar pulso pedioso e tibial posterior. Rastrear perda de sensibilidade protetora com Monofilamento 10g.\n2. **Corte das Lâminas:** Corte estritamente reto, sem arredondar os cantos nem invadir sulcos periungueais. Lixar com lixa descartável de baixa abrasão.\n3. **Desbastamento:** Jamais utilizar bisturis de corte profundo sem hidratação prévia. Evitar sangramentos a qualquer custo.\n4. **Hidratação:** Creme com Ureia 10% no dorso e planta; **NUNCA aplicar entre os artelhos (risco de maceração e micose)**.\n5. **Encaminhamento:** Ao notar hiperemia com calor local ou flictena, encaminhar ao médico endocrinologista ou vascular.`;
      } else if (lower.includes('onicocriptose') || lower.includes('granulação')) {
        aiReply = `🩹 **Conduta em Onicocriptose Grau II/III:**\n\n1. **Assepsia Rigorosa:** Lavagem com clorexidina degermante 2% e secagem com gaze estéril.\n2. **Desobstrução:** Identificação da espícula com sonda exploradora nº 47. Ressecção precisa com bisturi nº 206 ou lâmina 15, sem tracionar a matriz.\n3. **Desinfecção do Leito:** Aplicação de alta frequência (ozônio) ou laserterapia (vermelho + infravermelho 2J por ponto) para bioestimulação.\n4. **Curativo Oclusivo:** Pomada bacteriostática (sulfadiazina de prata ou gel de neomicina com bacitracina) e oclusão não compressiva.\n5. **Retorno:** Avaliação obrigatória em 48 a 72 horas para troca de curativo.`;
      } else if (lower.includes('whatsapp') || lower.includes('pós-consulta') || lower.includes('instruções')) {
        aiReply = `📲 **Mensagem Pronta para WhatsApp (Paciente: ${currentPatient?.name || 'Cliente'}):**\n\n"Olá, ${currentPatient?.name ? currentPatient.name.split(' ')[0] : 'querido(a) paciente'}! Tudo bem? 🌿\n\nAqui é da Clínica CuidarX Podologia! Passando para checar como estão seus pés após o procedimento de hoje.\n\nLembre-se das nossas recomendações:\n✅ Mantenha os pés secos, especialmente entre os dedos.\n✅ Use sapatos confortáveis e evite bicos estreitos nos próximos dias.\n✅ Aplique o hidratante recomendado apenas no calcanhar e sola à noite.\n\nSe sentir qualquer incômodo ou tiver dúvidas, estamos à disposição aqui pelo WhatsApp! Um abraço carinhoso da nossa equipe!"`;
      } else {
        aiReply = `Entendido! Considerando o histórico ${currentPatient ? `do(a) paciente **${currentPatient.name}** (Condição: ${currentPatient.condition})` : 'clínico podológico'}, a recomendação padrão envolve esterilização rigorosa de instrumentais em autoclave hospitalar, assepsia com clorexidina e hidratação com cremes não comedogênicos. Deseja que eu elabore um protocolo específico para este caso?`;
      }

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 600);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-24 no-scrollbar space-y-5">
      {/* Header matching Screenshot 7 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4D8C4]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-fraunces text-[22px] font-semibold text-[#14261C]">
              Podologia IA · Assistente Clínico
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E3EEEC] text-[#0F766E] border border-[#0F766E]/30 flex items-center gap-1">
              <Sparkles size={11} />
              Inteligência Clínica Integrada
            </span>
          </div>
          <p className="text-[13px] text-[#55695E] mt-0.5">
            Orientações clínicas, protocolos profiláticos e mensagens personalizadas para pacientes
          </p>
        </div>
      </div>

      {/* Patient Context Ingestion Card (Screenshot 7) */}
      <div className="bg-[#FAF8F5] border border-[#E4D8C4] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E3EEEC] text-[#0F766E] flex items-center justify-center shrink-0">
            <User size={20} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#55695E] uppercase tracking-wider block">
              Contexto do Paciente Ativo
            </span>
            <span className="text-[14px] font-bold text-[#14261C]">
              {currentPatient ? currentPatient.name : 'Nenhum paciente selecionado'}
            </span>
            {currentPatient && (
              <span className="text-[12px] text-[#0F766E] block font-medium">
                Diagnóstico: {currentPatient.condition}
              </span>
            )}
          </div>
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-[11px] font-bold text-[#55695E] mb-1">
            Trocar Paciente em Atendimento:
          </label>
          <select
            value={activePatientId}
            onChange={(e) => setActivePatientId(e.target.value)}
            className="w-full bg-white border border-[#E4D8C4] rounded-xl px-3 py-2 text-[12.5px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.condition})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Protocol Buttons */}
      <div>
        <span className="text-[11.5px] font-bold text-[#55695E] uppercase tracking-wider block mb-2">
          Consultas Rápidas & Protocolos Padronizados
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {QUICK_PROTOCOLS.map((proto, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(proto.prompt)}
              className="text-left bg-[#FFFDF9] hover:bg-[#FAF8F5] border border-[#E4D8C4] hover:border-[#0F766E] rounded-xl p-3 text-[12.5px] font-bold text-[#14261C] transition-all shadow-2xs group flex flex-col justify-between"
            >
              <span>{proto.title}</span>
              <span className="text-[11px] font-normal text-[#55695E] mt-1.5 line-clamp-2">
                {proto.prompt}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Chat Window */}
      <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl overflow-hidden shadow-2xs flex flex-col h-[480px]">
        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-[#14261C] text-white'
                    : 'bg-[#E3EEEC] text-[#0F766E]'
                }`}
              >
                {m.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-[13px] leading-relaxed relative group ${
                  m.sender === 'user'
                    ? 'bg-[#0F766E] text-white rounded-tr-xs'
                    : 'bg-[#FAF8F5] text-[#14261C] border border-[#E4D8C4] rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/10 text-[10.5px] opacity-70">
                  <span>{m.time}</span>
                  {m.sender === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, m.text)}
                      className="flex items-center gap-1 font-bold hover:underline cursor-pointer"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check size={11} /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> Copiar
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-[12px] text-[#55695E] italic">
              <Sparkles size={14} className="text-[#0F766E] animate-spin" />
              <span>Consultando protocolos clínicos podológicos...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-[#FAF8F5] border-t border-[#E4D8C4] flex items-center gap-2">
          <input
            type="text"
            placeholder={`Escreva sua pergunta clínica sobre ${currentPatient ? currentPatient.name : 'o paciente'}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 bg-white border border-[#E4D8C4] rounded-xl px-4 py-2.5 text-[13px] text-[#14261C] focus:outline-none focus:border-[#0F766E]"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-50 text-white font-bold text-[13px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Send size={15} />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
