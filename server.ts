import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import http from "http";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Patient, Appointment, FinanceRecord, ClinicService } from "./src/types.js";
import patientRouter from "./src/routes/patients.js";
import {
  fetchFromFirestore,
  saveToFirestore,
  deleteFromFirestore,
  uploadLocalToFirestore,
  isFirebaseEnabled
} from "./firebase-server.js";

dotenv.config();

// Initialize Firebase Admin SDK for token verification
if (getApps().length === 0 && process.env.FIREBASE_PROJECT_ID) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (err) {
    console.error("Firebase Admin init error:", err);
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(process.cwd(), "clinic_data.json");

// Initialize Gemini SDK lazily
let ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI Features will be simulated or return a warning.");
    }
    ai = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// CORS — whitelist
const ALLOWED_ORIGINS = [
  "https://podologa-fabricia.web.app",
  "https://podologa-fabricia.firebaseapp.com",
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Aguarde um momento." },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite de requisições de IA atingido. Aguarde." },
});
app.use("/api/", generalLimiter);

// Enable JSON body parsing
app.use(express.json());

// Firebase Auth middleware — verifies ID token from Authorization header
async function verifyFirebaseToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticação não fornecido." });
  }
  try {
    const token = authHeader.split("Bearer ")[1];
    await getAuth().verifyIdToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Token de autenticação inválido ou expirado." });
  }
}

// Patient CRUD REST API — requires auth
app.use("/api/patients", verifyFirebaseToken, patientRouter);

// Load and seed database
function loadClinicData() {
  const initialServices: ClinicService[] = [
    { id: "srv-1", name: "Podopatia Preventiva Geral", price: 150, duration: 45, description: "Tratamento completo preventivo e higienização dos pés.", isActive: true },
    { id: "srv-2", name: "Espiculotomia (Unha Encravada)", price: 180, duration: 60, description: "Procedimento cirúrgico clínico para remoção de espícula de unha encravada.", isActive: true },
    { id: "srv-3", name: "Órtese FMM / Fibra de Vidro", price: 120, duration: 30, description: "Aplicação e ajuste de órteses metálicas ou de fibra para correção ungueal.", isActive: true },
    { id: "srv-4", name: "Laserterapia Terapêutica (660nm)", price: 100, duration: 20, description: "Sessão de laser de baixa intensidade para cicatrização e redução de inflamação.", isActive: true },
    { id: "srv-5", name: "Tratamento Químico de Verruga", price: 110, duration: 30, description: "Cauterização química localizada para verrugas plantares (olho de peixe).", isActive: true },
    { id: "srv-6", name: "Debridamento de Calosidade", price: 140, duration: 40, description: "Desbastamento clínico profissional de calos e calosidades.", isActive: true },
  ];

  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (!parsed.services) {
        parsed.services = initialServices;
        saveClinicData(parsed);
      }
      return parsed;
    } catch (e) {
      console.error("Error reading data file, resetting...", e);
    }
  }

  // Beautiful Portuguese Brazilian clinic seeding
  const initialPatients: Patient[] = [
    {
      id: "pat-1",
      name: "Maria das Graças Silva",
      phone: "(11) 98765-4321",
      dob: "1958-05-14",
      gender: "Feminino",
      isDiabetic: true,
      hasCirculatoryIssues: true,
      isSmoker: false,
      hasAllergies: "Dipirona",
      observations: "Paciente diabética insulino-dependente. Apresenta pele muito xerótica (seca) nos pés e sensibilidade tátil reduzida. Requer debridamento delicado e acompanhamento periódico.",
      footIssues: [
        {
          id: "issue-1",
          foot: "right",
          x: 45,
          y: 85,
          condition: "Fissura Calcânea",
          notes: "Fissura profunda no calcanhar direito. Sem sinais de infecção ativa, mas com sangramento esporádico ao caminhar.",
          status: "active",
          createdAt: "2026-06-20T10:00:00Z"
        },
        {
          id: "issue-2",
          foot: "left",
          x: 45,
          y: 85,
          condition: "Fissura Calcânea",
          notes: "Fissura superficial no calcanhar esquerdo. Em processo de cicatrização após uso de creme com 20% de Ureia.",
          status: "resolved",
          createdAt: "2026-06-20T10:00:00Z"
        }
      ],
      evolutions: [
        {
          id: "evo-1",
          date: "2026-06-20",
          procedure: "Tratamento de Fissuras & Hidratação",
          notes: "Realizado debridamento das bordas das fissuras com lixa podológica esterilizada e lixa mecânica micromotor. Aplicação de curativo oclusivo com pomada cicatrizante e óleo de girassol ozonizado no pé direito.",
          recommendations: "Utilizar creme podológico hidratante com Ureia 20% duas vezes ao dia. Não andar descalça em hipótese alguma."
        },
        {
          id: "evo-2",
          date: "2026-07-05",
          procedure: "Retorno e Avaliação de Pé Diabético",
          notes: "Retorno excelente. Fissura do pé esquerdo totalmente fechada. Fissura do pé direito com profundidade reduzida em 80%. Sem hiperqueratose ao redor.",
          recommendations: "Manter a hidratação diária intensa. Agendado retorno preventivo para 30 dias."
        }
      ],
      createdAt: "2026-06-20T10:00:00Z"
    },
    {
      id: "pat-2",
      name: "João Pedro Santos",
      phone: "(11) 91234-5678",
      dob: "2002-09-22",
      gender: "Masculino",
      isDiabetic: false,
      hasCirculatoryIssues: false,
      isSmoker: false,
      hasAllergies: "Nenhuma",
      observations: "Atleta amador de futebol society. Sofre de onicocriptose crônica devido ao uso de chuteiras apertadas e corte incorreto das unhas.",
      footIssues: [
        {
          id: "issue-3",
          foot: "right",
          x: 24,
          y: 18,
          condition: "Onicocriptose (Unha Encravada)",
          notes: "Onicocriptose grau II no hálux direito com presença de espícula na prega ungueal lateral. Presença de leve granuloma inflamado.",
          status: "active",
          createdAt: "2026-07-01T14:30:00Z"
        }
      ],
      evolutions: [
        {
          id: "evo-3",
          date: "2026-07-01",
          procedure: "Espiculotomia & Órtese",
          notes: "Procedimento de espiculotomia realizado com bisturi de lâmina fina para remoção da espícula ungueal invasora no hálux direito. Limpeza do sulco, antissepsia vigorosa e aplicação de laserterapia de baixa intensidade (Vermelho 660nm) para acelerar a cicatrização do tecido granuloso. Colocação de órtese metálica FMM para correção de curvatura.",
          recommendations: "Fazer higienização diária com soro fisiológico e aplicar a pomada antibiótica recomendada por 3 dias. Evitar o uso de calçados fechados ou apertados nos próximos 5 dias."
        }
      ],
      createdAt: "2026-07-01T14:30:00Z"
    },
    {
      id: "pat-3",
      name: "Ana Beatriz Oliveira",
      phone: "(11) 97766-5544",
      dob: "1991-11-03",
      gender: "Feminino",
      isDiabetic: false,
      hasCirculatoryIssues: false,
      isSmoker: true,
      hasAllergies: "Não",
      observations: "Apresenta lesão hiperqueratósica dolorosa ao toque na região metatarsal esquerda.",
      footIssues: [
        {
          id: "issue-4",
          foot: "left",
          x: 42,
          y: 42,
          condition: "Verruga Plantar",
          notes: "Verruga plantar (olho de peixe) dolorosa sob o segundo metatarso do pé esquerdo. Apresenta pontos escuros de capilares trombosados.",
          status: "active",
          createdAt: "2026-07-08T16:00:00Z"
        }
      ],
      evolutions: [
        {
          id: "evo-4",
          date: "2026-07-08",
          procedure: "Cauterização Química de Verruga",
          notes: "Realizada antissepsia, desbastamento da camada hiperqueratósica superficial com lâmina de bisturi estéril. Aplicação controlada de ácido nítrico/salicílico localizado sobre a verruga plantar. Proteção ao redor com fita protetora.",
          recommendations: "Manter o curativo seco por 24 horas. Não tentar arrancar ou cortar a pele em casa. Retorno em 7 dias para acompanhamento."
        }
      ],
      createdAt: "2026-07-08T16:00:00Z"
    }
  ];

  const initialAppointments: Appointment[] = [
    {
      id: "app-1",
      patientId: "pat-1",
      patientName: "Maria das Graças Silva",
      date: "2026-07-10",
      time: "09:30",
      service: "Avaliação de Pé Diabético",
      price: 150,
      status: "confirmed",
      notes: "Avaliação de retorno pós-cicatrização das fissuras calcâneas."
    },
    {
      id: "app-2",
      patientId: "pat-2",
      patientName: "João Pedro Santos",
      date: "2026-07-10",
      time: "14:00",
      service: "Manutenção de Órtese",
      price: 120,
      status: "scheduled",
      notes: "Ajuste de tração da órtese metálica no hálux direito."
    },
    {
      id: "app-3",
      patientId: "pat-3",
      patientName: "Ana Beatriz Oliveira",
      date: "2026-07-15",
      time: "16:00",
      service: "Tratamento de Verruga Plantar",
      price: 180,
      status: "scheduled",
      notes: "Segunda sessão de aplicação de ácido cicatrizante."
    }
  ];

  const initialFinances: FinanceRecord[] = [
    { id: "fin-1", date: "2026-07-01", type: "income", category: "Serviço", amount: 150, description: "Consulta Podologia Geral - João Pedro" },
    { id: "fin-2", date: "2026-07-01", type: "income", category: "Serviço", amount: 120, description: "Procedimento de Órtese - João Pedro" },
    { id: "fin-3", date: "2026-07-03", type: "expense", category: "Materiais", amount: 240, description: "Compra de lâminas bisturi, gaze e órteses metálicas" },
    { id: "fin-4", date: "2026-07-05", type: "income", category: "Serviço", amount: 150, description: "Retorno Hidratação Profunda - Maria das Graças" },
    { id: "fin-5", date: "2026-07-08", type: "income", category: "Serviço", amount: 180, description: "Tratamento de Verruga Plantar - Ana Beatriz" },
    { id: "fin-6", date: "2026-07-09", type: "expense", category: "Energia/Luz", amount: 135, description: "Fatura de eletricidade do consultório" }
  ];

  // Seed standard data for the past 30 days to make financial dashboard beautiful!
  for (let i = 30; i >= 1; i--) {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - i);
    const dateStr = dateObj.toISOString().split("T")[0];
    
    // Seed some service income
    if (i % 2 === 0) {
      initialFinances.push({
        id: `fin-seed-in-${i}`,
        date: dateStr,
        type: "income",
        category: "Serviço",
        amount: 120 + (i % 5) * 30,
        description: `Procedimento clínico no dia ${dateStr}`
      });
    }
    // Seed some product income
    if (i % 5 === 0) {
      initialFinances.push({
        id: `fin-seed-prod-${i}`,
        date: dateStr,
        type: "income",
        category: "Produto",
        amount: 45 + (i % 3) * 15,
        description: `Venda de creme hidratante com Ureia no dia ${dateStr}`
      });
    }
    // Seed some recurring expenses
    if (i === 15) {
      initialFinances.push({
        id: `fin-seed-exp-rent`,
        date: dateStr,
        type: "expense",
        category: "Aluguel",
        amount: 1200,
        description: "Aluguel da sala do consultório"
      });
    }
    if (i % 10 === 0) {
      initialFinances.push({
        id: `fin-seed-exp-mat-${i}`,
        date: dateStr,
        type: "expense",
        category: "Materiais",
        amount: 150 + (i % 4) * 20,
        description: "Reposição de insumos clínicos descartáveis"
      });
    }
  }

  const defaultData = {
    patients: initialPatients,
    appointments: initialAppointments,
    finances: initialFinances,
    services: initialServices,
  };

  saveClinicData(defaultData);
  return defaultData;
}

function saveClinicData(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write database file", e);
  }
}

// Ensure database seeded at load time
let db = loadClinicData();

// REST API Endpoints
app.get("/api/data", verifyFirebaseToken, async (req: Request, res: Response) => {
  if (isFirebaseEnabled) {
    const firestoreData = await fetchFromFirestore();
    if (firestoreData) {
      db = firestoreData;
      saveClinicData(db);
    }
  } else {
    db = loadClinicData();
  }
  res.json(db);
});

app.post("/api/appointments", verifyFirebaseToken, async (req: Request, res: Response) => {
  const appt: Appointment = req.body;
  db = loadClinicData();
  
  const existingIdx = db.appointments.findIndex((a: Appointment) => a.id === appt.id);
  if (existingIdx !== -1) {
    db.appointments[existingIdx] = appt;
  } else {
    appt.id = `app-${Date.now()}`;
    db.appointments.push(appt);
  }
  
  // If completed, automatically add to finances if not already added
  let financeRecordToSave: FinanceRecord | null = null;
  if (appt.status === "completed") {
    const finExists = db.finances.some((f: FinanceRecord) => f.description.includes(appt.id));
    if (!finExists) {
      const finId = `fin-${Date.now()}`;
      financeRecordToSave = {
        id: finId,
        date: appt.date,
        type: "income",
        category: "Serviço",
        amount: appt.price,
        description: `Serviço de ${appt.service} - ${appt.patientName} (Ref: ${appt.id})`
      };
      db.finances.push(financeRecordToSave);
    }
  }
  
  saveClinicData(db);

  if (isFirebaseEnabled) {
    await saveToFirestore("appointments", appt.id, appt);
    if (financeRecordToSave) {
      await saveToFirestore("finances", financeRecordToSave.id, financeRecordToSave);
    }
  }

  res.json(appt);
});

app.delete("/api/appointments/:id", verifyFirebaseToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  db = loadClinicData();
  db.appointments = db.appointments.filter((a: Appointment) => a.id !== id);
  saveClinicData(db);

  if (isFirebaseEnabled) {
    await deleteFromFirestore("appointments", id);
  }

  res.json({ success: true });
});

app.post("/api/finances", verifyFirebaseToken, async (req: Request, res: Response) => {
  const record: FinanceRecord = req.body;
  db = loadClinicData();
  
  record.id = `fin-${Date.now()}`;
  db.finances.push(record);
  
  saveClinicData(db);

  if (isFirebaseEnabled) {
    await saveToFirestore("finances", record.id, record);
  }

  res.json(record);
});

app.post("/api/services", verifyFirebaseToken, async (req: Request, res: Response) => {
  const service: ClinicService = req.body;
  db = loadClinicData();
  
  if (!db.services) {
    db.services = [];
  }
  
  const existingIdx = db.services.findIndex((s: ClinicService) => s.id === service.id);
  if (existingIdx !== -1) {
    db.services[existingIdx] = service;
  } else {
    service.id = `srv-${Date.now()}`;
    db.services.push(service);
  }
  
  saveClinicData(db);

  if (isFirebaseEnabled) {
    await saveToFirestore("services", service.id, service);
  }

  res.json(service);
});

app.delete("/api/services/:id", verifyFirebaseToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  db = loadClinicData();
  
  if (db.services) {
    db.services = db.services.filter((s: ClinicService) => s.id !== id);
  }
  
  saveClinicData(db);

  if (isFirebaseEnabled) {
    await deleteFromFirestore("services", id);
  }

  res.json({ success: true });
});

// Server-side Gemini Clinical AI Assistant Endpoint
app.post("/api/gemini", verifyFirebaseToken, aiLimiter, async (req: Request, res: Response) => {
  const { prompt, patientContext, systemPrompt: clientSystemPrompt } = req.body;

  try {
    // Reload latest database to ensure dynamic accuracy
    db = isFirebaseEnabled ? (await fetchFromFirestore() || loadClinicData()) : loadClinicData();
    const aiClient = getGemini();
    const apiKeySet = !!process.env.GEMINI_API_KEY;

    // Helper to extract clinical alerts
    const getPatientAlerts = (p: Patient) => {
      const alerts = [];
      if (p.isDiabetic) alerts.push("⚠️ DIABÉTICO(A) - Cuidado redobrado com cortes e assepsia");
      if (p.hasCirculatoryIssues) alerts.push("⚠️ PROBLEMA CIRCULATÓRIO - Evitar compressão excessiva");
      const activeIssues = p.footIssues?.filter((i: any) => i.status === "active").map((i: any) => `${i.condition} (${i.notes || "Sem notas"})`) || [];
      if (activeIssues.length > 0) {
        alerts.push(`Problemas ativos: ${activeIssues.join(", ")}`);
      }
      return alerts.length > 0 ? alerts.join(" | ") : "Nenhum alerta crítico ativo";
    };

    const targetDate = new Date().toISOString().split("T")[0];
    const todayAppointments = db.appointments.filter((a: any) => a.date === targetDate);

    // Build automated response if user asks for schedule
    const isScheduleQuery = prompt.toLowerCase().includes("quem vem hoje") || 
                            prompt.toLowerCase().includes("quem eu atendo") || 
                            prompt.toLowerCase().includes("atendimentos de hoje") ||
                            prompt.toLowerCase().includes("agenda de hoje") ||
                            prompt.toLowerCase().includes("atendo hoje");

    if (!apiKeySet) {
      // Simulate highly advanced intelligent responses in Portuguese if API key is not yet configured
      let simulatedResponse = "Olá! Eu sou o Assistente Clínico IA da Dra. Fabrícia Rodrigues. ";
      
      if (isScheduleQuery) {
        simulatedResponse = `### 📅 Agenda de Atendimentos para Hoje (${targetDate}):\n\n` +
          `Aqui está a lista de pacientes agendados para hoje, com os respectivos horários e alertas clínicos:\n\n`;

        if (todayAppointments.length === 0) {
          simulatedResponse += "Nenhum paciente agendado para hoje no sistema. Que tal cadastrar ou simular um agendamento no Portal Online?";
        } else {
          todayAppointments.forEach((a: any) => {
            const patient = db.patients.find((p: any) => p.id === a.patientId || p.name === a.patientName);
            const alerts = patient ? getPatientAlerts(patient) : "Paciente não cadastrado nos prontuários";
            simulatedResponse += `*   **${a.time}** - **${a.patientName}**\n` +
              `    *   **Procedimento:** ${a.service}\n` +
              `    *   **Alertas/Status:** ${alerts}\n` +
              `    *   **Observações:** "${a.notes || "Nenhuma"}"\n\n`;
          });

          // Check for conflicts or special instructions
          const diabeticsCount = todayAppointments.filter((a: any) => {
            const p = db.patients.find((pt: any) => pt.id === a.patientId || pt.name === a.patientName);
            return p?.isDiabetic;
          }).length;

          if (diabeticsCount > 0) {
            simulatedResponse += `⚠️ **ALERTA DA IA:** Você tem **${diabeticsCount} paciente(s) diabético(s)** agendados para hoje. Recomendo preparar materiais extras esterilizados para assepsia rigorosa e reservar kits de laserterapia/cicatrizantes adicionais.\n\n`;
          }
        }
        simulatedResponse += `\n*Nota: Configure sua chave GEMINI_API_KEY para habilitar análises de IA em tempo real de prontuários complexos.*`;
        return res.json({ text: simulatedResponse });
      }

      if (prompt.toLowerCase().includes("onicocriptose") || prompt.toLowerCase().includes("encravada")) {
        simulatedResponse += `**Orientações Pós-Operatório para Onicocriptose (Espiculotomia):**\n\n` +
          `1. **Higienização:** Lavar suavemente com soro fisiológico ou água morna e sabonete neutro 2x ao dia.\n` +
          `2. **Curativo:** Aplicar a pomada cicatrizante e fechar com gaze estéril sem apertar muito.\n` +
          `3. **Repouso:** Evitar sapatos fechados de bico fino por pelo menos 5 dias. Dar preferência a chinelos ou sandálias confortáveis.\n` +
          `4. **Sinais de Alerta:** Se houver aumento de latejamento, pus, vermelhidão espalhada ou febre, o paciente deve retornar imediatamente para reavaliação.\n` +
          `5. **Laserterapia:** Caso tenha realizado a laserterapia de baixa intensidade (660nm) no consultório, o processo inflamatório já foi reduzido, mas siga as recomendações acima.`;
      } else if (prompt.toLowerCase().includes("diabet") || prompt.toLowerCase().includes("pé diabético")) {
        simulatedResponse += `**Orientações Clínicas e Cuidados com o Pé Diabético:**\n\n` +
          `1. **Inspeção Diária:** O paciente deve examinar a sola dos pés diariamente usando um espelho para verificar fissuras, bolhas, calosidades ou micoses.\n` +
          `2. **Secagem Cuidadosa:** Secar muito bem entre os dedos para evitar maceração e proliferação de fungos.\n` +
          `3. **Hidratação:** Usar cremes à base de ureia (até 10% ou 20% com cautela) apenas na sola e calcanhar. **Nunca aplicar entre os dedos**.\n` +
          `4. **Corte de Unhas:** Corte sempre reto, sem arredondar os cantos para evitar encravamentos. O ideal é ser feito sempre por um profissional de podologia.\n` +
          `5. **Calçados:** Nunca andar descalço. Usar meias de algodão sem costura e calçados macios com palmilhas adequadas.`;
      } else if (prompt.toLowerCase().includes("prontuário") || prompt.toLowerCase().includes("sintetizar")) {
        simulatedResponse += `**Rascunho de Evolução Clínica Estruturada (Terminologia Podológica):**\n\n` +
          `*   **Queixa Principal:** Dor na prega ungueal lateral devido a calçado inadequado.\n` +
          `*   **Avaliação Clínica:** Apresenta onicocriptose grau II com espícula visível, leve hiperemia e edema local.\n` +
          `*   **Conduta Podológica:** Realizada espiculotomia asséptica, remoção de espícula ungueal ofensora, assepsia com clorexidina 2% e fotobiomodulação (laserterapia 660nm, 2 Joules por ponto) para cicatrização.\n` +
          `*   **Encaminhamento/Recomendações:** Curativo oclusivo seco por 24 horas. Uso domiciliar de soro fisiológico 2x ao dia. Retorno em 7 dias.`;
      } else {
        simulatedResponse += `Estou aqui para lhe auxiliar na gestão do consultório! Você pode me pedir orientações clínicas para pacientes, conselhos sobre cuidados com diabetes ou formatações de relatórios clínicos estruturados. \n\n*Nota: Configure sua chave GEMINI_API_KEY para habilitar respostas dinâmicas em tempo real com base no histórico médico completo.*`;
      }
      
      if (prompt.toLowerCase().includes("onicocriptose") || prompt.toLowerCase().includes("encravada") || prompt.toLowerCase().includes("diabet") || prompt.toLowerCase().includes("pé diabético") || prompt.toLowerCase().includes("prontuário") || prompt.toLowerCase().includes("sintetizar")) {
        simulatedResponse += `\n\n*Esta é uma sugestão da IA. A decisão final e o diagnóstico cabem exclusivamente à Dra. Fabrícia.*`;
      }
      
      return res.json({ text: simulatedResponse });
    }

    // --- REAL GEMINI PROCESSING ---
    // Use client-provided systemPrompt if available, otherwise use default clinical assistant prompt
    const systemPrompt = clientSystemPrompt || `Você é o Assistente Clínico Inteligente da Dra. Fabrícia, uma podóloga especialista em saúde dos pés. 
Sua missão é auxiliar na gestão da clínica, análise de prontuários e suporte à decisão clínica.

### DIRETRIZES DE ATUAÇÃO:
1. CONHECIMENTO ESPECIALIZADO: Você domina assuntos como: Pé Diabético, Onicocriptose (unhas encravadas), Onicomicose, Calosidades, e biomecânica da pisada.
2. TOM DE VOZ: Profissional, empático, organizado e técnico (mas acessível).
3. PRIVACIDADE: Você nunca compartilha dados de um paciente com outro.
4. PADRÃO DE PRONTUÁRIO: Quando solicitado para criar um resumo de atendimento, utilize o método SOAP (Subjetivo, Objetivo, Avaliação e Plano).

### SUAS FUNÇÕES PRINCIPAIS:
- RESUMO DE CASOS: Analisar o histórico de consultas do paciente e destacar alertas (ex: "Paciente diabético com histórico de úlceras").
- APOIO FINANCEIRO: Ajudar a Dra. Fabrícia a entender o faturamento mensal e fluxos de caixa quando ela perguntar sobre o painel financeiro.
- AGENDA: Sugerir prioridades de agendamento com base na gravidade do caso.
- ALERTAS DIABÉTICOS: Se um paciente for marcado como "Diabético", sempre reforce a necessidade de inspeção minuciosa e orientações de autocuidado.
- GESTÃO DE AGENDAMENTOS (SITE -> WHATSAPP):
  - Sua função é monitorar a coleção 'appointments' (agendamentos) do Firebase.
  - Quando a Dra. Fabrícia perguntar "Quem vem hoje?", você deve listar os nomes, horários e se há alguma observação clínica (ex: 'Paciente novo' ou 'Retorno de Onicocriptose').
  - Se houver conflito de horários ou muitos diabéticos no mesmo dia, sugira uma preparação especial de materiais.
  - Ajude a Dra. a converter as mensagens do WhatsApp em dados: se ela colar um texto do WhatsApp, você deve extrair o nome e o problema e sugerir o cadastro no sistema.

### SEGURANÇA MÉDICA:
- Você é uma ferramenta de apoio. Sempre termine recomendações clínicas complexas com a frase: "Esta é uma sugestão da IA. A decisão final e o diagnóstico cabem exclusivamente à Dra. Fabrícia."

### CONTEXTO DA CLÍNICA EM TEMPO REAL:
Abaixo estão os dados atuais e reais extraídos do banco de dados Firebase/Firestore para você analisar e responder à Dra. Fabrícia:

Pacientes Cadastrados:
${db.patients.map((p: Patient) => `- ID: ${p.id}, Nome: ${p.name}, WhatsApp: ${p.phone}, Diabético: ${p.isDiabetic ? "Sim" : "Não"}, Circulatório: ${p.hasCirculatoryIssues ? "Sim" : "Não"}, Alergias: ${p.hasAllergies}, Tipo de Pisada: ${p.footStrikeType || "Não Informado"}, Notas Clínicas: "${p.observations || "Nenhuma"}", Problemas Ativos: ${JSON.stringify(p.footIssues?.filter((i: any) => i.status === "active").map((i: any) => `${i.condition} no pé ${i.foot === "right" ? "direito" : "esquerdo"} (${i.notes || ""})`) || [])}`).join("\n")}

Agendamentos Totais:
${db.appointments.map((a: any) => `- Paciente: ${a.patientName} (ID: ${a.patientId}), Data: ${a.date}, Hora: ${a.time}, Procedimento: ${a.service}, Preço: R$${a.price}, Status: ${a.status}, Observações: "${a.notes || ""}"`).join("\n")}

Histórico Financeiro do Caixa:
- Faturamento Total: R$${db.finances.filter((f: any) => f.type === "income").reduce((sum: number, f: any) => sum + f.amount, 0)}
- Despesas Totais: R$${db.finances.filter((f: any) => f.type === "expense").reduce((sum: number, f: any) => sum + f.amount, 0)}

### INTEGRAÇÃO COM A INTERFACE WEB (SISTEMA):
- FORMATATAÇÃO: Use sempre Markdown para as respostas (negrito, listas, tabelas) para que o texto fique bonito e legível no site.
- RESPOSTAS CURTAS: No chat lateral do site, prefira respostas objetivas. Se o assunto for complexo, use tópicos.
- STATUS DO FIREBASE: Quando a Dra. Fabrícia mencionar que "atualizou o prontuário" ou "lançou um pagamento", confirme que você (via sistema) levará isso em conta na próxima análise.
- BOTÕES DE AÇÃO: Se você sugerir um exame ou retorno, formate como: "[AÇÃO: Agendar Retorno]", para que o desenvolvedor possa futuramente criar botões automáticos baseados no seu texto.

Por favor, responda sempre em português brasileiro de forma clara e formatada com Markdown.`;

    const contents = patientContext
      ? `Contexto do Paciente Específico Selecionado:\n${JSON.stringify(patientContext, null, 2)}\n\nPergunta do Podólogo:\n${prompt}`
      : prompt;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Erro de conexão com o assistente de IA." });
  }
});

// Server-side Local AI (Ollama) Endpoint — roda 100% offline no seu computador
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b";

function getAvailableOllamaModel(models: { name: string }[]): string | null {
  const order = [DEFAULT_OLLAMA_MODEL, "codestral:latest", "deepseek-coder-v2:latest", "qwen2.5-coder:7b", "llama3:latest"];
  for (const m of order) {
    if (models.some((model) => model.name === m)) return m;
  }
  return models[0]?.name || null;
}

async function fetchOllamaModels(): Promise<{ name: string }[]> {
  return new Promise((resolve, reject) => {
    const req = http.request(`${OLLAMA_HOST}/api/tags`, { method: "GET" }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data).models || []);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(3000, () => req.destroy(new Error("timeout")));
    req.end();
  });
}

async function chatWithOllama(model: string, systemPrompt: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      stream: false,
      options: { temperature: 0.7 },
    });

    const req = http.request(`${OLLAMA_HOST}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error));
          resolve(parsed.message?.content || "");
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

app.post("/api/ollama", verifyFirebaseToken, aiLimiter, async (req: Request, res: Response) => {
  const { prompt, systemPrompt, patientContext } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "O campo 'prompt' é obrigatório." });
  }

  try {
    const models = await fetchOllamaModels();
    const model = getAvailableOllamaModel(models);
    if (!model) {
      return res.status(503).json({ error: "Nenhum modelo encontrado no Ollama. Rode 'ollama pull qwen2.5-coder:7b'." });
    }

    db = isFirebaseEnabled ? (await fetchFromFirestore() || loadClinicData()) : loadClinicData();

    const defaultSystem = `Você é o Assistente Clínico Inteligente da Dra. Fabrícia, uma podóloga especialista em saúde dos pés.
Você é uma ferramenta de apoio. Sempre termine recomendações clínicas complexas com: "Esta é uma sugestão da IA. A decisão final e o diagnóstico cabem exclusivamente à Dra. Fabrícia."
Responda sempre em português brasileiro de forma clara e formatada com Markdown.

### CONTEXTO DA CLÍNICA EM TEMPO REAL:
Pacientes Cadastrados:
${db.patients.map((p: Patient) => `- ID: ${p.id}, Nome: ${p.name}, WhatsApp: ${p.phone}, Diabético: ${p.isDiabetic ? "Sim" : "Não"}, Problemas Ativos: ${JSON.stringify(p.footIssues?.filter((i: any) => i.status === "active").map((i: any) => `${i.condition} no pé ${i.foot === "right" ? "direito" : "esquerdo"}`) || [])}`).join("\n")}

Agendamentos Totais:
${db.appointments.map((a: any) => `- Paciente: ${a.patientName}, Data: ${a.date}, Hora: ${a.time}, Procedimento: ${a.service}, Status: ${a.status}`).join("\n")}`;

    const effectiveSystem = systemPrompt || defaultSystem;
    const contents = patientContext
      ? `Contexto do Paciente Específico Selecionado:\n${JSON.stringify(patientContext, null, 2)}\n\nPergunta do Podólogo:\n${prompt}`
      : prompt;

    const text = await chatWithOllama(model, effectiveSystem, contents);
    res.json({ text, model });
  } catch (error: any) {
    console.error("Ollama API Error:", error);
    res.status(500).json({ error: "Erro ao conectar com o Ollama local. Certifique-se de que 'ollama serve' está rodando." });
  }
});

// Configure Vite middleware or Static files serving
async function startServer() {
  // Bidirectional startup sync with Cloud Firestore
  if (isFirebaseEnabled) {
    try {
      const firestoreData = await fetchFromFirestore();
      if (firestoreData) {
        if (firestoreData.patients.length === 0) {
          console.log("Empty Firestore database found. Seeding from local file...");
          await uploadLocalToFirestore(db);
        } else {
          console.log("Populated Firestore database found. Updating local cached copy...");
          db = firestoreData;
          saveClinicData(db);
        }
      }
    } catch (err) {
      console.error("Error during startup Firebase synchronization:", err);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Podologia Fabrícia App running on http://localhost:${PORT}`);
  });
}

startServer();
