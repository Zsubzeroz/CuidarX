import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const AI_RESPONSES: Record<string, string> = {
  agendamento:
    'Para agendar uma consulta, clique em "Agendar Consulta Online" e preencha seus dados. Você pode escolher o profissional, procedimento, data e horário disponível.',
  horario:
    'Nosso horário de funcionamento é de Segunda a Sexta das 08:30 às 18:30, e Sábado das 08:30 às 13:00.',
  profissional:
    'Temos 4 profissionais: Dra. Fabrícia Rodrigues (Especialista e Fundadora), Dra. Renata Pires (Pé Diabético), Dr. Carlos Eduardo Lima (Esportivo) e Dra. Mariana Santos (Podopediatria).',
  valor:
    'Os valores variam por procedimento. Unha encravada: R$ 150, Pé diabético: R$ 180, Calosidades: R$ 130. Para mais detalhes, agende sua consulta.',
  cancelamento:
    'Para cancelar ou remarcar, entre em contato pelo WhatsApp (19) 99722-2694 com pelo menos 24h de antecedência.',
  preparo:
    'Para sua primeira consulta, traga documentos de identidade, cartão do SUS (se tiver), e chegue 10 minutos antes do horário. Evite cortar as unhas antes da consulta.',
  diabete:
    'Pacientes diabéticos têm atendimento especializado com protocolo de segurança. Informe sua condição no formulário de agendamento para prepararmos o atendimento.',
  dor:
    'Se você está sentindo dor intensa, recomendamos contato imediato pelo WhatsApp (19) 99722-2694 para encaixe de urgência.',
  local:
    'Estamos localizados na Clínica Cuidar+ Saúde, Sala 304, Av. Paulista, 1000 — Bela Vista, São Paulo.',
};

function getAIReply(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes('agend') || lower.includes('marcar') || lower.includes('consulta'))
    return AI_RESPONSES.agendamento;
  if (lower.includes('horário') || lower.includes('horario') || lower.includes('funciona'))
    return AI_RESPONSES.horario;
  if (lower.includes('profission') || lower.includes('doutora') || lower.includes('doutor') || lower.includes('quem'))
    return AI_RESPONSES.profissional;
  if (lower.includes('valor') || lower.includes('preço') || lower.includes('preco') || lower.includes('quanto'))
    return AI_RESPONSES.valor;
  if (lower.includes('cancel') || lower.includes('remarcar') || lower.includes('desmarcar'))
    return AI_RESPONSES.cancelamento;
  if (lower.includes('prepar') || lower.includes('levar') || lower.includes('trazer'))
    return AI_RESPONSES.preparo;
  if (lower.includes('diabét') || lower.includes('diabet'))
    return AI_RESPONSES.diabete;
  if (lower.includes('dor') || lower.includes('urgên') || lower.includes('urgenc'))
    return AI_RESPONSES.dor;
  if (lower.includes('onde') || lower.includes('endereço') || lower.includes('local') || lower.includes('fica'))
    return AI_RESPONSES.local;

  return 'Posso ajudar com: agendamento, horários, profissionais, valores, cancelamento, preparo para consulta, atendimento para diabéticos e localização. Como posso ajudar?';
}

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Olá! Sou a assistente virtual da CuidarX. Como posso ajudar?' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const aiMsg: Message = { role: 'ai', text: getAIReply(trimmed) };
      setMessages((prev) => [...prev, aiMsg]);
    }, 500);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir assistente virtual"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#0F766E] hover:bg-[#0B5D56] text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
      >
        <Bot size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[340px] max-w-[calc(100vw-2rem)] bg-[#FFFDF9] border border-[#E4D8C4] rounded-[20px] shadow-2xl flex flex-col overflow-hidden" style={{ height: '480px' }}>
      {/* Header */}
      <div className="bg-[#133023] text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0F766E] flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-[12px] font-bold">Assistente CuidarX</div>
            <div className="text-[10px] text-[#A7F3D0]">Online agora</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-7 h-7 rounded-full bg-[#214D39] text-[#E4D8C4] flex items-center justify-center hover:bg-[#2D664C] cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#0F766E] text-white rounded-br-md'
                  : 'bg-[#F3E6D2] text-[#24312E] rounded-bl-md'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E4D8C4] p-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Digite sua dúvida..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            className="flex-1 bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2.5 text-[12.5px] text-[#14261C] placeholder-[#9CA3AF] focus:outline-none focus:border-[#0F766E]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-[#0F766E] hover:bg-[#0B5D56] text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
