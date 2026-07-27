import React, { useState } from "react";
import { db, isFirebaseConfigured } from "../services/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import {
  Globe,
  Smartphone,
  CheckCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  User,
  Heart,
  FileCode,
  Activity,
  Send,
  HelpCircle,
} from "lucide-react";

interface BookingPortalProps {
  onBookingSuccess?: () => void;
}

export default function BookingPortalView({ onBookingSuccess }: BookingPortalProps) {
  const [portalTab, setPortalTab] = useState<"portal" | "simulator" | "code">("portal");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Feminino");
  const [isDiabetic, setIsDiabetic] = useState(false);
  const [footStrike, setFootStrike] = useState("Não sei");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [service, setService] = useState("Podologia Geral");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Standalone code block for copy-paste
  const standaloneHTMLCode = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agendamento Online - Dra. Fabrícia Rodrigues</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 min-h-screen text-slate-800 flex items-center justify-center p-4">

  <div class="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-br from-teal-800 to-teal-950 p-6 text-white text-center relative">
      <div class="absolute inset-0 bg-black opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <h2 class="text-xl font-bold tracking-tight relative z-10">Dra. Fabrícia Rodrigues</h2>
      <p class="text-teal-200 text-xs mt-1 relative z-10">Saúde & Bem-Estar para seus Pés</p>
      <div class="mt-4 bg-teal-500/20 text-teal-300 text-[10px] px-3 py-1 rounded-full inline-block font-semibold border border-teal-500/30">
        Agendamento 100% Online
      </div>
    </div>

    <!-- Form -->
    <form id="booking-form" class="p-6 space-y-4">
      <div>
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome Completo</label>
        <input type="text" id="patient-name" required placeholder="Ex: Maria das Graças Silva" 
          class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp</label>
          <input type="tel" id="patient-phone" required placeholder="(11) 99999-9999" 
            class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nascimento</label>
          <input type="date" id="patient-dob" required 
            class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500">
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gênero</label>
          <select id="patient-gender" class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white">
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Pisada</label>
          <select id="patient-footstrike" class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white">
            <option value="Não sei">Não sei</option>
            <option value="Neutra">Neutra</option>
            <option value="Pronada">Pronada</option>
            <option value="Supinada">Supinada</option>
          </select>
        </div>
      </div>

      <div class="p-3 bg-rose-50 border border-rose-100/50 rounded-xl flex items-center justify-between">
        <span class="text-xs font-bold text-rose-800">Você é paciente Diabético(a)?</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" id="patient-diabetic" class="sr-only peer">
          <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
        </label>
      </div>

      <div class="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data do Agendamento</label>
          <input type="date" id="appointment-date" required 
            class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Horário</label>
          <input type="time" id="appointment-time" required 
            class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500">
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Procedimento / Motivo</label>
        <select id="appointment-service" class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white">
          <option value="Podologia Geral">Podologia Geral (R$ 150)</option>
          <option value="Tratamento de Órtese">Aplicação / Ajuste de Órtese (R$ 120)</option>
          <option value="Tratamento de Verruga Plantar">Verruga Plantar / Olho de Peixe (R$ 180)</option>
          <option value="Tratamento de Onicocriptose">Unha Encravada (R$ 160)</option>
          <option value="Avaliação de Pé Diabético">Avaliação Preventiva de Pé Diabético (R$ 150)</option>
        </select>
      </div>

      <div>
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Observações ou Queixas (Opcional)</label>
        <textarea id="appointment-notes" rows="2" placeholder="Ex: Sinto dores ao caminhar com calçado fechado."
          class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"></textarea>
      </div>

      <button type="submit" id="submit-btn" 
        class="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2">
        Agendar Consulta
      </button>
    </form>

    <!-- Success Container -->
    <div id="success-view" class="hidden p-8 text-center space-y-4">
      <div class="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
      <h3 class="text-xl font-bold text-slate-800">Agendamento Solicitado!</h3>
      <p class="text-xs text-slate-500 leading-relaxed">
        Seu horário foi enviado diretamente para o consultório da Dra. Fabrícia. Você receberá uma confirmação oficial em seu WhatsApp em instantes!
      </p>
      <div class="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 text-left text-xs space-y-1 mt-4">
        <p class="font-bold text-teal-800">Resumo do Pré-Agendamento:</p>
        <p><span class="font-medium">Paciente:</span> <span id="summary-name"></span></p>
        <p><span class="font-medium">Data/Hora:</span> <span id="summary-datetime"></span></p>
        <p><span class="font-medium">Procedimento:</span> <span id="summary-service"></span></p>
      </div>
      <button onclick="window.location.reload()" 
        class="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all">
        Agendar Outro Horário
      </button>
    </div>
  </div>

  <!-- Firebase Integration Script -->
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getFirestore, doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

    // CONFIGURE SUAS CREDENCIAIS DO FIREBASE AQUI
    const firebaseConfig = {
      apiKey: "AIzaSyD3RrLSn0wl4svO9JJjZXOpkBkLurfKZEO",
      authDomain: "podologa-fabricia.firebaseapp.com",
      projectId: "podologa-fabricia",
      storageBucket: "podologa-fabricia.firebasestorage.app",
      messagingSenderId: "862057567005",
      appId: "1:862057567005:web:cec60212b5e9f341acc7f4"
    };

    // Inicializa Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const serviceSelect = document.getElementById("appointment-service");

    async function loadDynamicServices() {
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const srvList = [];
        querySnapshot.forEach((docSnap) => {
          srvList.push({ id: docSnap.id, ...docSnap.data() });
        });
        const activeSrvs = srvList.filter(s => s.isActive !== false);
        if (activeSrvs.length > 0) {
          serviceSelect.innerHTML = "";
          activeSrvs.forEach((s) => {
            const opt = document.createElement("option");
            opt.value = s.name;
            opt.textContent = s.name + " (R$ " + s.price + ")";
            opt.setAttribute("data-price", s.price);
            serviceSelect.appendChild(opt);
          });
        }
      } catch (err) {
        console.warn("Utilizando serviços padrão de fallback:", err);
      }
    }
    loadDynamicServices();

    const form = document.getElementById("booking-form");
    const successView = document.getElementById("success-view");
    const submitBtn = document.getElementById("submit-btn");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.innerText = "Agendando...";

      const name = document.getElementById("patient-name").value;
      const phone = document.getElementById("patient-phone").value;
      const dob = document.getElementById("patient-dob").value;
      const gender = document.getElementById("patient-gender").value;
      const footStrike = document.getElementById("patient-footstrike").value;
      const isDiabetic = document.getElementById("patient-diabetic").checked;
      const date = document.getElementById("appointment-date").value;
      const time = document.getElementById("appointment-time").value;
      const service = document.getElementById("appointment-service").value;
      const notes = document.getElementById("appointment-notes").value;

      const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
      const selectedPriceAttr = selectedOption ? selectedOption.getAttribute("data-price") : null;
      const parsedPrice = selectedPriceAttr ? parseFloat(selectedPriceAttr) : (service.includes("Verruga") ? 180 : service.includes("Órtese") ? 120 : service.includes("Onicocriptose") ? 160 : 150);

      const patientId = "pat-web-" + Date.now();
      const appointmentId = "app-web-" + Date.now();

      try {
        // 1. Salvar o paciente diretamente na coleção 'patients'
        await setDoc(doc(db, "patients", patientId), {
          name: name,
          phone: phone,
          dob: dob,
          gender: gender,
          isDiabetic: isDiabetic,
          footStrikeType: footStrike,
          hasCirculatoryIssues: isDiabetic, // padrão para automação
          isSmoker: false,
          hasAllergies: "Não",
          observations: "Paciente pré-agendado pelo site. Queixa principal: " + (notes || "Nenhuma informada"),
          footIssues: [],
          evolutions: [],
          createdAt: new Date().toISOString()
        });

        // 2. Salvar o agendamento correspondente na coleção 'appointments'
        await setDoc(doc(db, "appointments", appointmentId), {
          patientId: patientId,
          patientName: name,
          date: date,
          time: time,
          service: service,
          price: parsedPrice,
          status: "scheduled",
          notes: notes || "Solicitado pelo agendamento online."
        });

        // Exibir tela de sucesso
        document.getElementById("summary-name").innerText = name;
        document.getElementById("summary-datetime").innerText = date + " às " + time;
        document.getElementById("summary-service").innerText = service;

        form.classList.add("hidden");
        successView.classList.remove("hidden");
      } catch (error) {
        console.error("Erro ao salvar no Firebase:", error);
        alert("Ocorreu um erro no agendamento, por favor tente novamente ou entre em contato pelo WhatsApp!");
        submitBtn.disabled = false;
        submitBtn.innerText = "Agendar Consulta";
      }
    });
  </script>
</body>
</html>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(standaloneHTMLCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSimulateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const price = service.includes("Verruga") ? 180 : service.includes("Órtese") ? 120 : service.includes("Onicocriptose") ? 160 : 150;
    const patientId = `pat-sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const appointmentId = `app-sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    try {
      if (!isFirebaseConfigured || !db) {
        throw new Error("Firebase não configurado. Verifique VITE_FIREBASE_* no .env");
      }

      // 1. Save patient directly to Firestore 'patients' collection
      await setDoc(doc(db, "patients", patientId), {
        name,
        phone,
        dob,
        gender,
        isDiabetic,
        footStrikeType: footStrike,
        hasCirculatoryIssues: isDiabetic,
        isSmoker: false,
        hasAllergies: "Nenhuma",
        observations: `Paciente pré-agendado online pelo simulador. Tipo de Pisada: ${footStrike}. Notas do paciente: "${notes || "Sem notas adicionais"}"`,
        footIssues: [],
        evolutions: [],
        createdAt: new Date().toISOString(),
      });

      // 2. Save appointment directly to Firestore 'appointments' collection
      await setDoc(doc(db, "appointments", appointmentId), {
        patientId,
        patientName: name,
        date,
        time,
        service,
        price,
        status: "scheduled",
        notes: notes || "Solicitado via Portal Online",
      });

      setIsSubmitted(true);
      onBookingSuccess?.();
    } catch (err) {
      console.error(err);
      alert("Houve um erro na simulação de agendamento. Verifique o Firebase.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setDob("");
    setIsDiabetic(false);
    setFootStrike("Não sei");
    setDate("");
    setTime("");
    setService("Podologia Geral");
    setNotes("");
    setIsSubmitted(false);
  };

  return (
    <div id="booking-portal-view" className="space-y-6 text-left">
      {/* Intro Header banner */}
      <div className="bg-gradient-to-r from-teal-900 to-teal-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-teal-400 animate-pulse" /> Site de Agendamento Online
          </h2>
          <p className="text-teal-200 text-xs">
            Seu portal público de agendamentos está ativo e totalmente integrado ao Firebase!
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setPortalTab("portal")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              portalTab === "portal"
                ? "bg-teal-500 text-white shadow-sm"
                : "bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900"
            }`}
          >
            <Globe className="w-4 h-4" /> Portal Oficial Ativo
          </button>
          <button
            onClick={() => setPortalTab("simulator")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              portalTab === "simulator"
                ? "bg-teal-500 text-white shadow-sm"
                : "bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900"
            }`}
          >
            <Smartphone className="w-4 h-4" /> Simulador de Teste
          </button>
          <button
            onClick={() => setPortalTab("code")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              portalTab === "code"
                ? "bg-teal-500 text-white shadow-sm"
                : "bg-teal-950 text-teal-300 border border-teal-800 hover:bg-teal-900"
            }`}
          >
            <FileCode className="w-4 h-4" /> Código de Backup
          </button>
        </div>
      </div>

      {portalTab === "portal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live Site Status and Action */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Site Ativo e Online
                </span>
                <h3 className="text-base font-bold text-slate-800 tracking-tight mt-2">
                  Portal de Agendamento da Dra. Fabrícia
                </h3>
              </div>
              <Globe className="w-8 h-8 text-teal-600 opacity-20" />
            </div>

            {/* Visual representation of the live site */}
            <div className="bg-gradient-to-br from-emerald-950 to-teal-950 rounded-2xl p-6 text-white text-center relative overflow-hidden shadow-sm border border-emerald-900">
              <div className="absolute inset-0 bg-black opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                  <Globe className="w-8 h-8 text-teal-300" />
                </div>
                <div>
                  <p className="text-xs text-teal-200 font-semibold tracking-wider uppercase">Endereço Oficial do Portal</p>
                  <p className="text-lg font-mono font-bold text-teal-100 mt-1 selection:bg-teal-600">
                    podologa-fabricia.web.app/cliente
                  </p>
                </div>
                
                <p className="text-xs text-teal-300 max-w-sm mx-auto leading-relaxed">
                  Este é o site onde seus clientes selecionam serviços, informam o tipo de pisada, histórico de diabetes e realizam o pré-agendamento de consultas.
                </p>

                <div className="pt-2">
                  <a
                    href="https://podologa-fabricia.web.app/cliente"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-6 rounded-xl text-xs tracking-wide transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <Globe className="w-4 h-4" /> Acessar Portal do Cliente
                  </a>
                </div>
              </div>
            </div>

            {/* Sync explanations */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Como funciona a Integração em Tempo Real:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-xs font-bold text-slate-800">1. Cadastro Direto de Pacientes</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Quando um paciente novo preenche o formulário no site, ele é salvo automaticamente na coleção <code className="bg-white px-1 py-0.5 border border-slate-100 rounded font-mono font-bold text-teal-700">patients</code> do Firebase com as informações de Diabetes e Pisada.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-xs font-bold text-slate-800">2. Criação do Agendamento</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    O sistema cria um agendamento na coleção <code className="bg-white px-1 py-0.5 border border-slate-100 rounded font-mono font-bold text-teal-700">appointments</code>, associando-o ao paciente para visualização imediata no calendário e na lista de atendimentos de hoje.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: WhatsApp automations & Checklist */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-600" /> Integração com WhatsApp
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Para direcionar os pacientes que entram em contato no WhatsApp automaticamente para o seu site, configure esta mensagem automática no seu WhatsApp Business:
              </p>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-3 relative">
                <p className="font-bold text-teal-800 text-[11px]">Mensagem Recomendada:</p>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-600 font-mono text-[10px] whitespace-pre-line leading-relaxed">
                  {`Olá! Seja muito bem-vindo à clínica de Podologia Dra. Fabrícia Rodrigues. 🐾

Para realizar seu agendamento de forma 100% online em segundos, ver valores e escolher o melhor horário, clique no link abaixo:
👇👇👇
https://podologa-fabricia.web.app/cliente`}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Olá! Seja muito bem-vindo à clínica de Podologia Dra. Fabrícia Rodrigues. 🐾\n\nPara realizar seu agendamento de forma 100% online em segundos, ver valores e escolher o melhor horário, clique no link abaixo:\n👇👇👇\nhttps://podologa-fabricia.web.app/cliente`);
                    alert("Copiado com sucesso!");
                  }}
                  className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-lg border border-slate-200 text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Mensagem do WhatsApp
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Status de Sincronização
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Conexão Firebase
                  </div>
                  <span className="font-bold font-mono text-[11px]">CONECTADO</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Sincronização de Prontuários
                  </div>
                  <span className="font-bold font-mono text-[11px]">ATIVO</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Integração de Agenda
                  </div>
                  <span className="font-bold font-mono text-[11px]">SINCRONIZADO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {portalTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form container left side */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Simulador do Portal de Agendamento Clínico
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Preencha os dados abaixo para simular um agendamento em tempo real. Útil para testar o fluxo de registro nas coleções <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-teal-700">patients</code> e <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-teal-700">appointments</code> do Firebase!
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSimulateBooking} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Roberto Carlos"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Celular / WhatsApp
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        required
                        placeholder="(11) 98888-7777"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Data Nascimento
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Gênero
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Tipo de Pisada
                    </label>
                    <select
                      value={footStrike}
                      onChange={(e) => setFootStrike(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option value="Não sei">Não sei</option>
                      <option value="Neutra">Neutra</option>
                      <option value="Pronada">Pronada</option>
                      <option value="Supinada">Supinada</option>
                    </select>
                  </div>
                </div>

                {/* Patient status checklist diabetic */}
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-between">
                  <div className="flex gap-2.5 items-center">
                    <Heart className="w-5 h-5 text-rose-600 fill-rose-100" />
                    <div>
                      <p className="text-xs font-bold text-rose-900">Paciente possui Diabetes?</p>
                      <p className="text-[10px] text-rose-600 mt-0.5">Ativa alertas preventivos de pé diabético no painel.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDiabetic}
                      onChange={(e) => setIsDiabetic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {/* Appointment date and time selection */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Escolha de Horário</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Data Pretendida
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Horário de Preferência
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="time"
                          required
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Procedimento / Especialidade
                    </label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                    >
                      <option value="Podologia Geral">Podologia Geral (R$ 150)</option>
                      <option value="Tratamento de Órtese">Aplicação / Ajuste de Órtese (R$ 120)</option>
                      <option value="Tratamento de Verruga Plantar">Verruga Plantar / Olho de Peixe (R$ 180)</option>
                      <option value="Tratamento de Onicocriptose">Unha Encravada (R$ 160)</option>
                      <option value="Avaliação de Pé Diabético">Avaliação Preventiva de Pé Diabético (R$ 150)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Sintomas ou Notas Extras (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Sentindo queimação na planta do pé."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-sm hover:shadow transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Activity className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Salvando dados no Firebase..." : "Confirmar Agendamento de Teste"}
                </button>
              </form>
            ) : (
              <div className="p-8 text-center bg-teal-50/25 rounded-2xl border border-teal-100/50 space-y-5 animate-fadeIn">
                <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Agendamento Realizado com Sucesso!</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Os dados foram registrados no Firestore. Um novo prontuário foi estruturado em <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-teal-800">pacientes</code> e a agenda clínica foi populada.
                  </p>
                </div>

                {/* Simulated WhatsApp Notification Card */}
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-left text-xs space-y-2 max-w-md mx-auto">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-emerald-600" /> Notificação de Automação do WhatsApp (Simulada)
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-emerald-100/50 text-slate-600 font-mono text-[10px] whitespace-pre-line leading-relaxed">
                    {`*Clínica Dra. Fabrícia Rodrigues* 🐾
Olá, *${name}*! Confirmamos seu agendamento online:

📅 *Data:* ${date}
🕒 *Horário:* ${time}h
📍 *Procedimento:* ${service}

_Por favor, se você for diabético, lembre-se de trazer os exames mais recentes. Caso precise desmarcar, nos avise com 24h de antecedência!_`}
                  </div>
                </div>

                <div className="flex gap-2 justify-center max-w-xs mx-auto">
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Agendar Outro
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines on the right side */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-600" /> Como Funciona o Simulador
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Este simulador escreve dados no Firestore exatamente como o portal do cliente faria, permitindo que você avalie em tempo real se a agenda e a tela de prontuários estão sendo atualizadas corretamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {portalTab === "code" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Código-Fonte HTML/JS para Emergências (Backup)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Caso você precise recriar, migrar ou hospedar um espelho do seu portal de agendamentos em outro servidor no futuro, aqui está o código-fonte autônomo totalmente configurado.
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                navigator.clipboard.writeText(standaloneHTMLCode);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className="absolute right-3 top-3 bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm z-10"
            >
              {isCopied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
              {isCopied ? "Copiado!" : "Copiar Código"}
            </button>

            <pre className="text-[10px] leading-relaxed font-mono bg-slate-900 text-teal-400 p-5 rounded-2xl overflow-x-auto max-h-[400px] text-left">
              {standaloneHTMLCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
