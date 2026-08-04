import React, { useState, useRef, useEffect } from "react";
import { Patient } from "../types";
import {
  Cpu,
  Send,
  Sparkles,
  User,
  Activity,
  Heart,
  FileText,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

const SYSTEM_PROMPT = `Você é o Assistente Clínico Inteligente da Dra. Fabrícia, uma podóloga especialista em saúde dos pés.
Sua missão é auxiliar na gestão da clínica, análise de prontuários e suporte à decisão clínica.

### DIRETRIZES DE ATUAÇÃO:
1. CONHECIMENTO ESPECIALIZADO: Você domina assuntos como: Pé Diabético, Onicocriptose (unhas encravadas), Onicomicose, Calosidades, e biomecânica da pisada.
2. TOM DE VOZ: Profissional, empático, organizado e técnico (mas acessível).
3. PRIVACIDADE: Você nunca compartilha dados de um paciente com outro.
4. PADRÃO DE PRONTUÁRIO: Quando solicitado para criar um resumo de atendimento, utilize o método SOAP (Subjetivo, Objetivo, Avaliação e Plano).

### FUNÇÕES PRINCIPAIS:
- RESUMO DE CASOS: Analisar o histórico de consultas do paciente e destacar alertas.
- ALERTAS DIABÉTICOS: Se um paciente for marcado como "Diabético", sempre reforce a necessidade de inspeção minuciosa e orientações de autocuidado.
- ORIENTAÇÕES PÓS-OPERATÓRIAS: Guia completo de cuidados após procedimentos podológicos.

### SEGURANÇA MÉDICA:
- Você é uma ferramenta de apoio. Sempre termine recomendações clínicas complexas com: "Esta é uma sugestão da IA. A decisão final e o diagnóstico cabem exclusivamente à Dra. Fabrícia."

Responda sempre em português brasileiro de forma clara e formatada com Markdown.`;

interface AiAssistantProps {
  patients: Patient[];
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function AiAssistantView({ patients }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: "Olá! Sou o **Assistente Clínico IA da Dra. Fabrícia Rodrigues**. \n\nPosso ajudar você a gerar guias de cuidados pós-operatórios para seus pacientes, sintetizar anotações rápidas de procedimentos ou dar conselhos sobre podopediatria e acompanhamento de pé diabético. \n\nComo posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activePatient = patients.find((p) => p.id === selectedPatientId);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || isSending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText("");
    setIsSending(true);

    try {
      let patientContext: Patient | null = null;
      if (activePatient) {
        patientContext = activePatient;
      }

      // Try local Ollama (via server) first — 100% offline
      const ollamaRes = await fetch("/api/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          systemPrompt: SYSTEM_PROMPT,
          patientContext: patientContext ? { name: activePatient.name, isDiabetic: activePatient.isDiabetic, hasCirculatoryIssues: activePatient.hasCirculatoryIssues, hasAllergies: activePatient.hasAllergies, observations: activePatient.observations, footIssues: activePatient.footIssues } : undefined,
        }),
      });

      let aiText: string;
      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        aiText = data.text || "Desculpe, não consegui gerar uma resposta.";
      } else {
        aiText = "⚠️ **Ollama local indisponível.**\\n\\nO servidor não conseguiu acessar o Ollama em `localhost:11434`. Verifique se ele está rodando com `ollama serve`.";
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: "Houve um erro ao conectar com o assistente de IA local. Certifique-se de que o Ollama está rodando (`ollama serve`).",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    {
      title: "Guia Pós-Operatório",
      prompt: "Gere recomendações pós-operatório (onicocriptose/unha encravada) completas e fáceis de ler para enviar ao WhatsApp do paciente.",
      icon: <Sparkles className="w-4 h-4 text-gold" />,
    },
    {
      title: "Cuidados Pé Diabético",
      prompt: "Quais são as orientações completas de homecare que devo dar para um paciente idoso diabético com tendência a fissuras severas?",
      icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-50" />,
    },
    {
      title: "Tratamento de Órteses",
      prompt: "Explique as melhores práticas para a aplicação de órteses metálicas e de fibra de memória molecular no hálux. Qual a periodicidade ideal de manutenção?",
      icon: <Activity className="w-4 h-4 text-amber-500" />,
    },
    {
      title: "Sintetizar Caso Clínico",
      prompt: "Com base no histórico deste paciente, formule um resumo de caso clínico completo adequado para enviar a um médico dermatologista ou angiologista.",
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      requirePatient: true,
    },
  ];

  return (
    <div id="ai-assistant-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Patient Context Selector & Prompts */}
      <div className="lg:col-span-4 space-y-6 text-left">
        {/* Patient context card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-gold" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contexto de Paciente</h4>
          </div>
          
          <p className="text-xs text-slate-500">
            Selecione um paciente para injetar automaticamente seu histórico clínico e anamnese como contexto para a inteligência artificial:
          </p>

          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="">Nenhum paciente selecionado (IA Geral)</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isDiabetic ? "🐾 (Diabético)" : ""}
              </option>
            ))}
          </select>

          {activePatient && (
            <div className="bg-emerald-50/30 border border-emerald-100/50 p-3 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-800">Contexto Carregado:</p>
              <p className="text-slate-600 font-medium">Nome: {activePatient.name}</p>
              <p className="text-slate-600">
                Problemas: {activePatient.footIssues.filter((i) => i.status === "active").length} ativos
              </p>
              <p className="text-[10px] text-slate-400 italic">
                A IA responderá com base nas patologias e histórico dele(a).
              </p>
            </div>
          )}
        </div>

        {/* Quick actions/prompts list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Consultas Rápidas
          </h4>

          <div className="space-y-2">
            {quickPrompts.map((qp, idx) => {
              const disabled = qp.requirePatient && !selectedPatientId;
              return (
                <button
                  key={idx}
                  disabled={disabled}
                  onClick={() => handleSendMessage(qp.prompt)}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex gap-2.5 items-start transition-all cursor-pointer ${
                    disabled
                      ? "bg-slate-50 border-slate-100 opacity-55 cursor-not-allowed"
                      : "bg-white border-slate-100 hover:border-gold/30 hover:bg-gold/5"
                  }`}
                >
                  <div className="pt-0.5">{qp.icon}</div>
                  <div>
                    <p className="font-bold text-slate-800">{qp.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{qp.prompt}</p>
                    {qp.requirePatient && !selectedPatientId && (
                      <span className="text-[9px] text-amber-600 font-bold mt-1 inline-block bg-amber-50 px-1 py-0.5 rounded">
                        Requer selecionar paciente acima
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Chat Area */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[600px] text-left">
        {/* Chat header */}
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
            <h3 className="text-sm font-bold text-slate-800">Trabalho Auxiliado por IA</h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full uppercase">
            Ollama · Offline
          </span>
        </div>

        {/* Chat message stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 my-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] text-xs ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.sender === "user"
                    ? "bg-brand border-emerald-700 text-white"
                    : "bg-emerald-50 border-emerald-100 text-emerald-800"
                }`}
              >
                {msg.sender === "user" ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-brand text-white rounded-tr-none shadow-sm"
                    : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none shadow-sm"
                }`}
              >
                {/* Parse basic markdown format simple way to preserve style */}
                {msg.text.split("\n").map((line, lIdx) => {
                  let formatted = line;
                  // Handle bolding **text**
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  let match;
                  const parts = [];
                  let lastIndex = 0;
                  
                  while ((match = boldRegex.exec(line)) !== null) {
                    if (match.index > lastIndex) {
                      parts.push(line.substring(lastIndex, match.index));
                    }
                    parts.push(<strong key={match.index} className={msg.sender === "user" ? "text-emerald-100 font-extrabold" : "text-emerald-950 font-bold"}>{match[1]}</strong>);
                    lastIndex = boldRegex.lastIndex;
                  }
                  if (lastIndex < line.length) {
                    parts.push(line.substring(lastIndex));
                  }

                  return (
                    <p key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>
                      {parts.length > 0 ? parts : line}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex gap-3 max-w-[80%] text-xs mr-auto items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center">
                <Cpu className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-none text-slate-400 italic">
                Analisando diagnóstico e gerando resposta...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area form */}
        <div className="border-t border-slate-100 pt-3 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Perguntar ao assistente IA... (ex: 'Como acelerar a cicatrização de granuloma?')"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            disabled={isSending}
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-60"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isSending}
            className="bg-brand hover:bg-brand-700 text-white p-3 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
