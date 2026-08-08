import React, { useState, useRef, useEffect } from "react";
import { Patient } from "../types";
import { generateAIResponse } from "../services/aiService";
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
  Stethoscope,
  Shield,
  BookOpen,
} from "lucide-react";

const SYSTEM_PROMPT = `Você é o Assistente Virtual e Recepcionista da clínica da Dra. Fabrícia Rodrigues — Podologia & Enfermagem.
Você combina duas funções: (1) recepcionista virtual e especialista no sistema de gestão da clínica e (2) assistente clínico de podologia para apoiar a Dra. Fabrícia.

### DADOS OFICIAIS DA CLÍNICA (responda com precisão sempre que perguntado):
- ENDEREÇO: Rua Papa João Paulo II, 256 — Artur Nogueira/SP.
- WHATSAPP: 19 99727-0910 (fale "clínica" ou "agendamento" para ser direcionado ao contato).
- HORÁRIO DE FUNCIONAMENTO: Segunda a sábado, das 08:00 às 20:00. FECHADA aos domingos.
- REGRA DE AGENDAMENTO ONLINE: O agendamento pelo portal online exige no mínimo 24 horas de antecedência.

### DÚVIDAS SOBRE O APP / SISTEMA DE GESTÃO:
1. COMO AGENDAR: No menu superior, entre em "Minha Agenda" e clique em um horário livre da grade ou use o botão "Novo Agendamento". Selecione o cliente, o serviço, a data e o horário e confirme.
2. AGENDA SINCRONIZADA COM O GOOGLE CALENDAR: A agenda exibe automaticamente os eventos do Google Calendar (ex.: "Estágio 07:00–12:00" aparece bloqueado na grade). O agendamento cria o evento no Google Calendar e a conexão é feita pelo botão "Conectar Google Agenda" no topo do painel.
3. CADASTRO DE CLIENTES: No menu "Clientes", clique em "Novo Cliente", preencha nome, telefone, data de nascimento e anamnese, e salve. O histórico e prontuário ficam registrados para consulta futura.
4. WHATSAPP 1-CLIQUE: Na ficha do cliente ou no agendamento há um botão de WhatsApp que abre a conversa direta com o número do cliente em um clique, facilitando confirmações e envio de orientações.
5. BLOQUEIO DE HORÁRIO: No canto inferior da Agenda Diária, clique em "Bloquear Horário". Escolha o motivo (Almoço, Médico, Férias, Feriado), defina data e horário. Para bloqueios recorrentes, selecione "Recorrente" e escolha a frequência: Diariamente, Semanalmente, Dias Úteis (Seg-Sex) ou Personalizado com seleção de dias da semana.
6. ESTOQUE: No menu "Estoque", cadastre itens com categoria (Material, Descartável, Medicamento), unidade e estoque mínimo. Controle lotes por validade, gere kits de atendimento e receba alertas automáticos de itens abaixo do mínimo ou próximos ao vencimento.
7. FINANCEIRO: No menu "Financeiro", registre receitas e despesas por categoria (Serviço, Materiais, Aluguel, etc.). O painel exibe gráficos de fluxo de caixa, saldo líquido e breakdown de despesas por categoria. Use o livro-caixa para consultar lançamentos anteriores.
8. SERVIÇOS: No menu "Serviços", cadastre procedimentos com nome, valor, duração e status (ativo/inativo). Os serviços cadastrados aparecem automaticamente no formulário de agendamento.

### DIRETRIZES DE ATUAÇÃO:
1. RECEPÇÃO: Ao responder perguntas sobre horários, endereço, valores ou regras, use os dados oficiais acima e seja acolhedor(a) e objetivo(a).
2. CONHECIMENTO ESPECIALIZADO: Você domina assuntos clínicos como: Pé Diabético, Onicocriptose (unhas encravadas), Onicomicose, Calosidades, e biomecânica da pisada.
3. TOM DE VOZ: Profissional, empático, organizado e técnico (mas acessível).
4. PRIVACIDADE: Você nunca compartilha dados de um paciente com outro.
5. PADRÃO DE PRONTUÁRIO: Quando solicitado para criar um resumo de atendimento, utilize o método SOAP (Subjetivo, Objetivo, Avaliação e Plano).

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
      text: "Olá! Sou o **Assistente Virtual da Dra. Fabrícia Rodrigues** 🤖✨\n\nPosso ajudar com dúvidas sobre o **sistema** (como agendar, ver a agenda sincronizada com o Google Calendar, cadastrar clientes, usar o WhatsApp 1-clique) e sobre a **clínica** (endereço, horários, regras de agendamento).\n\nTambém sou assistente clínico: gero guias de cuidados pós-operatórios, sintetizo prontuários e apoio no acompanhamento de pé diabético.\n\nComo posso ajudar você hoje?",
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

      const ollamaRes = await generateAIResponse({
        prompt: textToSend,
        systemPrompt: SYSTEM_PROMPT,
        patientContext: patientContext
          ? {
              name: activePatient.name,
              isDiabetic: activePatient.isDiabetic,
              hasCirculatoryIssues: activePatient.hasCirculatoryIssues,
              hasAllergies: activePatient.hasAllergies,
              observations: activePatient.observations,
              footIssues: activePatient.footIssues,
            }
          : undefined,
      });

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: ollamaRes,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: "Houve um erro ao conectar com o assistente de IA. Verifique se a chave **Gemini (Google AI Studio)** está configurada no build.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    {
      title: "Dúvidas da Clínica",
      prompt: "Quais são o endereço, o WhatsApp, o horário de funcionamento e as regras de agendamento online da clínica?",
      icon: <Lightbulb className="w-4 h-4 text-amber-500" />,
      color: "amber",
    },
    {
      title: "Como Usar o App (Manual Interativo)",
      prompt: "Atue como Suporte Técnico do sistema. Explique passo a passo como usar: (1) Agenda Diária — ver grade, bloquear horários, criar recorrências, (2) Estoque — cadastrar itens, controlar lotes, gerar kits, alertas de validade, (3) Bloqueio de Horário — bloqueio único, recorrente diário/semanal/dias úteis, e (4) Integrações — Google Calendar e WhatsApp 1-clique.",
      icon: <Cpu className="w-4 h-4 text-blue-500" />,
      color: "blue",
    },
    {
      title: "Protocolo Pé Diabético",
      prompt: "Gere o protocolo completo de avaliação e cuidados para paciente com Pé Diabético (Wagner 0-1), incluindo inspeção visual, testes de sensibilidade (monofilamento), orientações de homecare e critérios de encaminhamento vascular.",
      icon: <Shield className="w-4 h-4 text-emerald-600" />,
      color: "emerald",
    },
    {
      title: "Protocolo Onicocriptose",
      prompt: "Gere o protocolo clínico completo para tratamento de onicocriptose (unha encravada): técnica de corte, cuidados pós-operatórios, orientações ao paciente, critérios de gravidade e sinais de alarme para reencaminhamento ao médico.",
      icon: <Stethoscope className="w-4 h-4 text-rose-500" />,
      color: "rose",
    },
    {
      title: "Guia Pós-Operatório",
      prompt: "Gere recomendações pós-operatório (onicocriptose/unha encravada) completas e fáceis de ler para enviar ao WhatsApp do paciente.",
      icon: <Sparkles className="w-4 h-4 text-gold" />,
      color: "gold",
    },
    {
      title: "Cuidados Pé Diabético",
      prompt: "Quais são as orientações completas de homecare que devo dar para um paciente idoso diabético com tendência a fissuras severas?",
      icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-50" />,
      color: "rose",
    },
    {
      title: "Tratamento de Órteses",
      prompt: "Explique as melhores práticas para a aplicação de órteses metálicas e de fibra de memória molecular no hálux. Qual a periodicidade ideal de manutenção?",
      icon: <Activity className="w-4 h-4 text-amber-500" />,
      color: "amber",
    },
    {
      title: "Sintetizar Caso Clínico",
      prompt: "Com base no histórico deste paciente, formule um resumo de caso clínico completo adequado para enviar a um médico dermatologista ou angiologista.",
      icon: <FileText className="w-4 h-4 text-blue-500" />,
      color: "blue",
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
              const colorMap: Record<string, string> = {
                amber: "hover:border-amber-300 hover:bg-amber-50/50",
                blue: "hover:border-blue-300 hover:bg-blue-50/50",
                emerald: "hover:border-emerald-300 hover:bg-emerald-50/50",
                rose: "hover:border-rose-300 hover:bg-rose-50/50",
                gold: "hover:border-[#C8A45A]/40 hover:bg-[#C8A45A]/5",
              };
              return (
                <button
                  key={idx}
                  disabled={disabled}
                  onClick={() => handleSendMessage(qp.prompt)}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex gap-2.5 items-start transition-all cursor-pointer ${
                    disabled
                      ? "bg-slate-50 border-slate-100 opacity-55 cursor-not-allowed"
                      : `bg-white border-slate-100 shadow-sm hover:shadow-md ${colorMap[qp.color || "amber"]}`
                  }`}
                >
                  <div className="pt-0.5 shrink-0">{qp.icon}</div>
                  <div className="min-w-0">
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
            Gemini · Nuvem
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
