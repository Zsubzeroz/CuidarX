import React, { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import { getClinicWhatsAppLink, getClinicWhatsAppDisplay } from "../services/whatsappAutoService";
import { generateAIResponse } from "../services/aiService";

interface ChatMsg {
  id: string;
  sender: "client" | "ai";
  text: string;
}

const RECEPTIONIST_SYSTEM_PROMPT = `Você é a Recepcionista Virtual da Dra. Fabrícia Rodrigues — clínica de Podologia & Enfermagem.
Você atende clientes no site de agendamento online, sempre em português brasileiro, de forma extremamente acolhedora, educada e prestativa.

### DADOS OFICIAIS DA CLÍNICA (use SEMPRE estes dados):
- ENDEREÇO: Rua Papa João Paulo II, 256 — Artur Nogueira/SP.
- WHATSAPP: 19 99727-0910.
- HORÁRIO DE FUNCIONAMENTO: Segunda a sábado, das 08:00 às 20:00. FECHADA aos domingos.
- REGRA DE AGENDAMENTO ONLINE: exige no mínimo 24 horas de antecedência.
- O cliente está NA PÁGINA DE AGENDAMENTO: oriente a preencher o formulário ao lado/lado inferior para escolher serviço, dia e horário.

### SERVIÇOS E VALORES (tabela de referência):
- Podologia Geral — R$ 150
- Tratamento de Órtese — R$ 120
- Tratamento de Verruga Plantar — R$ 180
- Tratamento de Onicocriptose — R$ 160
- Avaliação de Pé Diabético — R$ 150

### DIRETRIZES:
1. Seja sempre acolhedora e educada. Use emojis com moderação para transmitir calor humano.
2. Seja curta e direta; use listas/negrito quando ajudar.
3. Se o paciente perguntar sobre algum tratamento clínico (unha encravada, micose, pé diabético, verruga, calosidade), explique de forma simples e gentil, e SEMPRE recomende agendar uma avaliação com a Dra. Fabrícia: "Para um diagnóstico preciso e um tratamento personalizado, que tal agendar uma avaliação? Você pode escolher o dia e horário pelo formulário ao lado! 😊"
4. Nunca dê diagnósticos definitivos. Use frases como "Parece ser...", "Pode ser indicativo de...", "A Dra. Fabrícia vai poder avaliar melhor..."
5. Termine recomendações clínicas com: "Lembre-se: a decisão final e o diagnóstico cabem exclusivamente à Dra. Fabrícia."
6. Se o paciente agradecer, responda com carinho e reforce que está à disposição.
7. Se não souber responder algo, diga que vai verificar e oriente a chamar no WhatsApp.`;

// Normaliza acentos e caixa para a busca por palavras-chave
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const kb: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["endereco", "local", "onde", "fica", "rua", "localizacao", "chegar", "endereco"],
    answer:
      "📍 **Endereço da clínica:**\n\nRua Papa João Paulo II, 256 — **Artur Nogueira/SP**\n\nVocê pode abrir no mapa pelo botão de WhatsApp e pedir a localização da Dra. Fabrícia.",
  },
  {
    keywords: ["whatsapp", "zap", "telefone", "contato", "ligar", "numero", "mensagem", "falar", "falar"],
    answer: `💬 **WhatsApp da clínica:** ${getClinicWhatsAppDisplay()}\n\nÉ só tocar aqui para chamar: [Abrir conversa no WhatsApp](${getClinicWhatsAppLink()})`,
  },
  {
    keywords: ["horario", "funcionamento", "funciona", "abre", "fecha", "aberto", "atende", "domingo", "sabado", "segunda", "aberta"],
    answer:
      "🕗 **Horário de funcionamento:**\n\n• **Segunda a sábado:** 08:00 às 20:00\n• **Domingos:** fechado\n\nO agendamento online está disponível a qualquer hora.",
  },
  {
    keywords: ["agenda", "marcar", "consulta", "agendar", "dispon", "vagas", "antecedencia", "horario", "agendamento"],
    answer:
      "📅 **Como agendar pelo portal:**\n\n• Escolha o **serviço**, o **dia** e o **horário** disponível abaixo.\n• O agendamento online exige **no mínimo 24 horas de antecedência**.\n• Ao confirmar, você recebe o comprovante pelo WhatsApp.\n\nFique à vontade para preencher o formulário ao lado. 😊",
  },
  {
    keywords: ["valor", "preco", "custo", "quanto", "custa", "pagamento", "pagar", "pix", "cartao", "dinheiro", "precos"],
    answer:
      "💰 **Valores dos serviços:**\n\n• Podologia Geral — R$ 150\n• Tratamento de Órtese — R$ 120\n• Tratamento de Verruga Plantar — R$ 180\n• Tratamento de Onicocriptose — R$ 160\n• Avaliação de Pé Diabético — R$ 150\n\nValores podem variar conforme avaliação. Aceitamos pagamento na clínica.",
  },
  {
    keywords: ["servico", "faz", "oferece", "tratamento", "especialidade", "procedimento", "unha", "encravada", "micose", "calo", "verruga", "ortese", "fissura"],
    answer:
      "✨ **Serviços oferecidos pela clínica:**\n\n• Podologia Geral\n• Tratamento de Órtese (hálux)\n• Tratamento de Verruga Plantar\n• Tratamento de Onicocriptose (unha encravada)\n• Onicomicose (micose nas unhas)\n• Calosidades e fissuras\n• Avaliação de Pé Diabético\n\nTudo com acompanhamento da Dra. Fabrícia Rodrigues.",
  },
  {
    keywords: ["diabetico", "diabetes", "pe diabetico"],
    answer:
      "🩺 **Pé Diabético:**\n\nA clínica realiza avaliação e cuidados especializados para pés diabéticos, com inspeção minuciosa e orientações de autocuidado. Recomendamos avaliação periódica com a Dra. Fabrícia.",
  },
  {
    keywords: ["oi", "ola", "bom dia", "boa tarde", "boa noite", "hey", "eai", "tudo bem", "opa"],
    answer:
      "Olá! 😊 Sou a **recepcionista virtual** da Dra. Fabrícia Rodrigues.\n\nPosso te ajudar com **endereço**, **horários**, **valores**, **serviços** e **agendamentos**. O que você precisa?",
  },
  {
    keywords: ["obrigado", "obrigada", "valeu", "grato", "gratidao", "vlw", "agradeco"],
    answer: "De nada! 🥰 Estou à disposição. Qualquer dúvida, é só chamar por aqui ou no WhatsApp.",
  },
];

const FALLBACK = `🤔 Ainda não entendi essa dúvida.\n\nVocê pode perguntar sobre:\n\n• **Endereço** e como chegar\n• **Horários** de funcionamento\n• **Valores** dos serviços\n• **Como agendar**\n\nOu fale comigo direto no WhatsApp: [${getClinicWhatsAppDisplay()}](${getClinicWhatsAppLink()})`;

function getAnswer(input: string): string {
  const text = normalize(input);
  let best: { score: number; answer: string } | null = null;
  for (const entry of kb) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (text.includes(kw)) {
        score += kw.length > 4 ? 2 : 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { score, answer: entry.answer };
    }
  }
  return best ? best.answer : FALLBACK;
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s*(.*$)/gim, '<h4 class="font-bold text-[#1B4332] mt-3 mb-1 text-xs uppercase tracking-wider">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\*\s*(.*$)/gim, '<li class="ml-3 list-disc text-slate-700">$1</li>')
    .replace(/^•\s*(.*$)/gim, '<li class="ml-3 list-disc text-slate-700">$1</li>')
    .replace(/\n/g, '<br/>');
}

const QUICK_SUGGESTIONS = ["Endereço da clínica", "Horários de funcionamento", "Valores dos serviços", "Como agendar"];

export default function AiReceptionistWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Olá! 😊 Sou a **recepcionista virtual** da Dra. Fabrícia.\n\nPergunte sobre **endereço**, **horários**, **valores** ou **agendamento**.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = async (text?: string) => {
    const toSend = (text ?? inputText).trim();
    if (!toSend || isSending) return;
    setMessages((prev) => [...prev, { id: `c-${Date.now()}`, sender: "client", text: toSend }]);
    setInputText("");
    setIsSending(true);
    try {
      const aiText = await generateAIResponse({
        prompt: toSend,
        systemPrompt: RECEPTIONIST_SYSTEM_PROMPT,
      });
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now() + 1}`, sender: "ai", text: aiText || getAnswer(toSend) },
      ]);
    } catch (err) {
      console.warn("[Recepcao] IA indisponivel, usando base de conhecimento:", err);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now() + 1}`, sender: "ai", text: getAnswer(toSend) },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative">
      {/* Floating chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[360px] max-w-[calc(100vw-3rem)] h-[480px] max-h-[70vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden chat-enter">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F3B2E] to-[#0A2B21] px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C8A45A]/20 border border-[#C8A45A]/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-[#C8A45A]" />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Recepcionista Virtual</p>
                <p className="text-[9px] text-[#C8A45A]/80 font-medium">Dra. Fabrícia Rodrigues · Podologia</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              aria-label="Fechar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 text-xs max-w-[85%] ${
                  msg.sender === "client" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    msg.sender === "client"
                      ? "bg-[#0F3B2E] border-[#C8A45A]/40 text-white"
                      : "bg-emerald-50 border-emerald-100 text-emerald-700"
                  }`}
                >
                  {msg.sender === "client" ? (
                    <MessageCircle className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "client"
                      ? "bg-[#0F3B2E] text-white rounded-tr-none"
                      : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none"
                  }`}
                >
                  <div
                    className="text-xs leading-relaxed space-y-1"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatMarkdown(msg.text)) }}
                  />
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex gap-2 text-xs max-w-[85%] mr-auto items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Bot className="w-3 h-3" />
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-none text-slate-400 italic">
                  Digitando...
                </div>
              </div>
            )}

            {/* Quick suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-[10px] font-bold text-[#0F3B2E] bg-emerald-50 border border-emerald-100 hover:border-[#C8A45A]/50 hover:bg-[#C8A45A]/10 px-2.5 py-1.5 rounded-full transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Escreva sua dúvida..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#C8A45A]"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputText.trim()}
              aria-label="Enviar mensagem"
              className="bg-[#0F3B2E] hover:bg-[#1B523E] text-white p-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Fechar atendente virtual" : "Abrir atendente virtual"}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-[#0F3B2E] hover:bg-[#1B523E] border border-[#C8A45A]/50 text-white shadow-[0_4px_20px_rgba(15,59,46,0.35)] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <span className="flex items-center justify-center w-full h-full">
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C8A45A] flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-[#0F3B2E]" />
          </span>
        )}
      </button>
    </div>
  );
}
