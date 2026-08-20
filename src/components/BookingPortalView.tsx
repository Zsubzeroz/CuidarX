import React, { useState, useEffect, useCallback } from "react";
import { db, isFirebaseConfigured } from "../services/firebase";
import { useResponsive } from "../hooks/useResponsive";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { sanitizeName, sanitizePhone, sanitizeNotes, formatPhoneBR } from "../utils/sanitize";
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
  X,
  AlertCircle,
  MapPin,
} from "lucide-react";
// @ts-ignore
import clinicLogo from "../assets/images/clinic_logo_1783686122531.jpg";
// @ts-ignore
import logoFrGreen from "../assets/images/logo-fr-green.png";
import { getClinicWhatsAppLink, buildClientMessage } from "../services/whatsappAutoService";
import AiReceptionistWidget from "./AiReceptionistWidget";
import {
  fetchGoogleCalendarEvents,
  isGoogleCalendarConnected,
} from "../services/googleCalendar";

const SLOT_INTERVAL = 30;
const BUSINESS_START = 7;
const BUSINESS_END = 20;

const serviceDefaults: Record<string, { price: number; duration: number }> = {
  "Podologia Geral": { price: 150, duration: 45 },
  "Tratamento de Órtese": { price: 120, duration: 60 },
  "Tratamento de Verruga Plantar": { price: 180, duration: 30 },
  "Tratamento de Onicocriptose": { price: 160, duration: 60 },
  "Avaliação de Pé Diabético": { price: 150, duration: 45 },
};

function generateSlots(startMin: number, endMin: number): string[] {
  const slots: string[] = [];
  for (let min = startMin; min < endMin; min += SLOT_INTERVAL) {
    slots.push(`${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`);
  }
  return slots;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function isOverlapping(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

function isSunday(dateStr: string): boolean {
  try {
    return new Date(dateStr + "T00:00:00").getDay() === 0;
  } catch {
    return false;
  }
}

function isSaturday(dateStr: string): boolean {
  try {
    return new Date(dateStr + "T00:00:00").getDay() === 6;
  } catch {
    return false;
  }
}

function formatTimeBR(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

interface ServiceOption {
  name: string;
  price: number;
  duration: number;
  description?: string;
}

interface BlockedSlot {
  startMinutes: number;
  endMinutes: number;
  reason: string;
}

interface BookingPortalViewProps {
  clientMode?: boolean;
  blockSaturdays?: boolean;
  expedienteStart?: string;
  expedienteEnd?: string;
}

export default function BookingPortalView({
  clientMode = false,
  blockSaturdays = false,
  expedienteStart = "08:00",
  expedienteEnd = "20:00",
}: BookingPortalViewProps) {
  const [portalTab, setPortalTab] = useState<"portal" | "simulator" | "code">("portal");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<"synced" | "pending" | "error" | "">("");

  const { isMobile } = useResponsive();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | "success">(1);
  const [selectedProcedure, setSelectedProcedure] = useState<ServiceOption | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [slotPeriod, setSlotPeriod] = useState<"manha" | "tarde">("manha");
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [dobDisplay, setDobDisplay] = useState("");
  const [gender, setGender] = useState("Feminino");
  const [isDiabetic, setIsDiabetic] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [service, setService] = useState("Podologia Geral");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [footStrike, setFootStrike] = useState("Não sei");

  const [servicesList, setServicesList] = useState<ServiceOption[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedServiceDuration, setSelectedServiceDuration] = useState(45);

  // Load services from Firestore — PORTAL DO CLIENTE:
  // exibe APENAS servicos com status "Ativo".
  const isServiceActive = (data: any): boolean =>
    data.isActive === true ||
    data.isActive === "Ativo" ||
    data.status === true ||
    data.status === "Ativo";

  useEffect(() => {
    (async () => {
      const fallback = Object.entries(serviceDefaults).map(([name, cfg]) => ({
        name,
        ...cfg,
      }));
      try {
        if (!isFirebaseConfigured || !db) {
          setServicesList(fallback);
          return;
        }
        const snap = await getDocs(collection(db, "services"));
        const list: ServiceOption[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.name && isServiceActive(data)) {
            list.push({
              name: data.name,
              price: data.price || 150,
              duration: data.duration || 45,
              description: data.description,
            });
          }
        });
        setServicesList(list);
      } catch {
        setServicesList(fallback);
      }
    })();
  }, []);

  // Update duration when service changes
  useEffect(() => {
    const found = servicesList.find((s) => s.name === service);
    setSelectedServiceDuration(found?.duration || 45);
  }, [service, servicesList]);

  // Load blocked slots when date or service changes
  const loadBlockedSlots = useCallback(async (selectedDate: string): Promise<void> => {
    if (!selectedDate) {
      setBlockedSlots([]);
      return;
    }

    const occupied: BlockedSlot[] = [];

    const apptDurationFor = (serviceName: string): number => {
      const srv = servicesList.find((s) => s.name === serviceName);
      if (srv?.duration && srv.duration > 0) return srv.duration;
      return serviceDefaults[serviceName]?.duration || 45;
    };

    // 1. Google Calendar — opcional, não bloqueia
    try {
      if (isGoogleCalendarConnected()) {
        const timeMin = `${selectedDate}T00:00:00-03:00`;
        const timeMax = `${selectedDate}T23:59:59-03:00`;
        const events = await fetchGoogleCalendarEvents(timeMin, timeMax);
        events.forEach((ge) => {
          const isAllDay = !(ge.start && ge.start.includes("T"));
          const startM = isAllDay ? 0 : timeToMinutes(ge.start?.slice(11, 16) || "");
          const endM = isAllDay ? 24 * 60 : timeToMinutes(ge.end?.slice(11, 16) || "");
          if (isNaN(startM) || isNaN(endM)) return;
          occupied.push({
            startMinutes: startM,
            endMinutes: endM,
            reason: `Google: ${ge.summary || "Compromisso"}`,
          });
        });
      }
    } catch (err) {
      console.warn("[Portal] Falha ao consultar Google Agenda:", err);
    }

    // 2. Fetch schedule blocks for this date (from public mirror — no sensitive fields)
    const blocksSnap = await getDocs(
      query(collection(db, "publicScheduleBlocks"), where("date", "==", selectedDate))
    );
    blocksSnap.forEach((d) => {
      const data = d.data();
      const startM = timeToMinutes(data.startTime);
      const endM = timeToMinutes(data.endTime);
      if (isNaN(startM) || isNaN(endM)) return;
      occupied.push({
        startMinutes: startM,
        endMinutes: endM,
        reason: "Bloqueado",
      });
    });

    // 3. Fetch appointments for this date
    const apptsSnap = await getDocs(
      query(collection(db, "appointments"), where("date", "==", selectedDate))
    );
    apptsSnap.forEach((d) => {
      const data = d.data();
      if (data.time) {
        const apptDuration = apptDurationFor(data.service);
        const startM = timeToMinutes(data.time);
        occupied.push({
          startMinutes: startM,
          endMinutes: startM + apptDuration,
          reason: `Agendamento: ${data.patientName || data.service}`,
        });
      }
    });

    setBlockedSlots(occupied);
  }, [servicesList]);

  useEffect(() => {
    if (!date) {
      setBlockedSlots([]);
      setIsLoadingSlots(false);
      setSlotsError(null);
      return;
    }
    setIsLoadingSlots(true);
    setSlotsError(null);
    loadBlockedSlots(date)
      .then(() => setIsLoadingSlots(false))
      .catch((err) => {
        console.error("[Portal] Erro ao carregar horários:", err);
        setSlotsError("Erro ao carregar horários. Tente novamente.");
        setIsLoadingSlots(false);
      });
  }, [date, loadBlockedSlots]);

  // Compute available slots whenever blockedSlots or selectedServiceDuration changes
  const dateBlocked = !!date && (isSunday(date) || (blockSaturdays && isSaturday(date)));
  const blockedDayName = dateBlocked && isSunday(date) ? "domingo" : "sábado";

  useEffect(() => {
    if (dateBlocked) {
      setAvailableSlots([]);
      setTime("");
      return;
    }
    const expedienteStartMin = timeToMinutes(expedienteStart);
    const expedienteEndMin = timeToMinutes(expedienteEnd);
    const startMin = clientMode ? expedienteStartMin : BUSINESS_START * 60;
    const endMin = clientMode ? expedienteEndMin : BUSINESS_END * 60;
    const allSlots = generateSlots(startMin, endMin);
    const dur = selectedServiceDuration;
    const free = allSlots.filter((slot) => {
      const startM = timeToMinutes(slot);
      const endM = startM + dur;
      if (endM > endMin) return false;
      for (const block of blockedSlots) {
        if (isOverlapping(startM, endM, block.startMinutes, block.endMinutes)) {
          return false;
        }
      }
      return true;
    });
    setAvailableSlots(free);
    // Clear selected time if no longer available
    if (time && !free.includes(time)) {
      setTime("");
    }
  }, [blockedSlots, selectedServiceDuration, time, clientMode, dateBlocked, expedienteStart, expedienteEnd]);

  const handleDobChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setDobDisplay(formatted);
    setDob(digits.length === 8 ? `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}` : "");
  };

  const handleSimulateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !service || !name || !phone) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    if (name.trim().length < 2) {
      alert("Nome deve ter pelo menos 2 caracteres.");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      alert("Telefone inválido. Use DDD + número (10 ou 11 dígitos).");
      return;
    }
    if (notes.length > 500) {
      alert("Observações devem ter no máximo 500 caracteres.");
      return;
    }
    if (dateBlocked) {
      alert(`A clínica não realiza atendimentos aos ${blockedDayName === "domingo" ? "domingos" : "sábados"}. Por favor, selecione outro dia da semana.`);
      return;
    }
    setIsLoading(true);

    const safeName = sanitizeName(name);
    const safeNotes = sanitizeNotes(notes);
    const found = servicesList.find((s) => s.name === service);
    const price = found?.price || 150;
    const durationMin = found?.duration || selectedServiceDuration || 45;
    const patientId = `pat-web-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const appointmentId = `app-web-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    let calendarEventId: string | undefined = undefined;
    let googleResult = "skipped";
    setGoogleSyncStatus("");

    try {
      // 1. Save patient to Firestore
      if (!isFirebaseConfigured || !db) {
        throw new Error("Firebase não configurado");
      }
      await setDoc(doc(db, "patients", patientId), {
        name: safeName,
        phone,
        phoneNormalized: phone.replace(/\D/g, ""),
        dob,
        gender,
        isDiabetic,
        footStrikeType: footStrike,
        hasCirculatoryIssues: isDiabetic,
        isSmoker: false,
        hasAllergies: "Nenhuma",
        observations: `Paciente pré-agendado online. Notas: "${safeNotes || "Sem notas adicionais"}"`,
        footIssues: [],
        evolutions: [],
        createdAt: new Date().toISOString(),
      });

      // 1b. Try to create the Google Calendar event in the same operation (if token available)
      try {
        const {
          createGoogleCalendarEvent: fsCreateGoogleEvent,
          isGoogleCalendarConnected: gcalConnected,
          buildEventTimeRange,
        } = await import("../services/googleCalendar");
        if (gcalConnected()) {
          const { start: dtStart, end: dtEnd } = buildEventTimeRange(date, time, durationMin);
          const summary = `${service} - ${safeName}`;
          const description =
            `Agendamento Online - Portal do Cliente\n` +
            `Paciente: ${safeName}\n` +
            `Telefone: ${phone}\n` +
            `Serviço: ${service}\n` +
            `Data: ${formatDateBR(date)} às ${time}\n` +
            `Valor: R$ ${price}\n` +
            (safeNotes ? `Observações: ${safeNotes}` : "");
          const evtId = await fsCreateGoogleEvent(summary, description, dtStart, dtEnd);
          if (evtId) {
            calendarEventId = evtId;
            googleResult = "created";
          } else {
            googleResult = "error";
          }
        } else {
          googleResult = "no-token";
        }
      } catch (err) {
        console.error("[Portal] Falha ao criar evento no Google Calendar:", err);
        googleResult = "error";
      }

      // 2. Save appointment to Firestore (with calendarEventId if Google event was created)
      await setDoc(doc(db, "appointments", appointmentId), {
        patientId,
        patientName: safeName,
        date,
        time,
        service,
        price,
        status: "scheduled",
        notes: safeNotes || "Solicitado via Portal Online",
        source: "portal",
        ...(calendarEventId ? { calendarEventId } : {}),
        ...(googleResult === "created"
          ? { googleSync: "synced" }
          : { googleSync: "pending" }),
      });

      setIsSubmitted(true);
      setCurrentStep("success");
      setGoogleSyncStatus(googleResult === "created" ? "synced" : googleResult === "no-token" ? "pending" : "error");
    } catch (e: any) {
      console.error(e);
      alert("Erro detalhado: " + (e.message || JSON.stringify(e)));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setDob("");
    setIsDiabetic(false);
    setDate("");
    setTime("");
    setService("Podologia Geral");
    setNotes("");
    setIsSubmitted(false);
    setCurrentStep(1);
    setSelectedProcedure(null);
    setCalendarMonth(new Date());
    setSlotPeriod("manha");
    setSlotsError(null);
  };

  const standaloneHTMLCode = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agendamento Online - Dra. Fabrícia Rodrigues</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style> body { font-family: 'Inter', sans-serif; } </style>
</head>
<body class="bg-slate-50 min-h-screen text-slate-800 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
    <div class="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-white text-center relative">
      <div class="absolute inset-0 bg-black opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
      <h2 class="text-xl font-bold tracking-tight relative z-10">Dra. Fabrícia Rodrigues</h2>
      <p class="text-amber-200 text-xs mt-1 relative z-10">Saúde & Bem-Estar para seus Pés</p>
      <div class="mt-4 bg-amber-500/20 text-amber-300 text-[10px] px-3 py-1 rounded-full inline-block font-semibold border border-emerald-500/30">Agendamento 100% Online</div>
    </div>
    <form id="booking-form" class="p-6 space-y-4">
      <div>
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome Completo</label>
        <input type="text" id="patient-name" required placeholder="Ex: Maria das Graças Silva" class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">WhatsApp</label>
          <input type="tel" id="patient-phone" required placeholder="(11) 99999-9999" class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nascimento</label>
          <input type="date" id="patient-dob" required class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gênero</label>
          <select id="patient-gender" class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white">
            <option value="Feminino">Feminino</option>
            <option value="Masculino">Masculino</option>
            <option value="Outro">Outro</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Pisada</label>
          <select id="patient-footstrike" class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white">
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
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data do Agendamento</label>
          <input type="date" id="appointment-date" required class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500">
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Horário</label>
          <input type="time" id="appointment-time" required class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500">
        </div>
      </div>
      <div>
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Procedimento / Motivo</label>
        <select id="appointment-service" class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white">
          <option value="Podologia Geral">Podologia Geral (R$ 150)</option>
          <option value="Tratamento de Órtese">Aplicação / Ajuste de Órtese (R$ 120)</option>
          <option value="Tratamento de Verruga Plantar">Verruga Plantar / Olho de Peixe (R$ 180)</option>
          <option value="Tratamento de Onicocriptose">Unha Encravada (R$ 160)</option>
          <option value="Avaliação de Pé Diabético">Avaliação Preventiva de Pé Diabético (R$ 150)</option>
        </select>
      </div>
      <div>
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Observações ou Queixas (Opcional)</label>
        <textarea id="appointment-notes" rows="2" placeholder="Ex: Sinto dores ao caminhar com calçado fechado." class="w-full text-sm border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"></textarea>
      </div>
      <button type="submit" id="submit-btn" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2">Agendar Consulta</button>
    </form>
  </div>
</body>
</html>`;

  if (clientMode) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(tomorrow);

    const bookedPrice = selectedProcedure?.price || servicesList.find((s) => s.name === service)?.price || 150;
    const bookedDuration = selectedProcedure?.duration || servicesList.find((s) => s.name === service)?.duration || 45;
    const bookedName = selectedProcedure?.name || service;

    const confirmMessage = buildClientMessage({
      nome: name,
      data: formatDateBR(date),
      horario: time,
      procedimento: bookedName,
      valor: `R$ ${bookedPrice.toFixed(2)}`,
    });
    const whatsappConfirmUrl = `${getClinicWhatsAppLink()}?text=${encodeURIComponent(confirmMessage)}`;

    const canAdvanceStep1 = name.trim().length >= 3 && phone.trim().length >= 8;
    const canAdvanceStep2 = selectedProcedure !== null;
    const canConfirm = date && time && selectedProcedure;

    const stepSubtitles: Record<number, string> = {
      1: "Passo 1 de 3 — Seus dados",
      2: "Passo 2 de 3 — Escolha o procedimento",
      3: "Passo 3 de 3 — Data e horário",
    };

    const todayObj = new Date();
    const minBookableDate = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate() + 1);

    const isDayDisabled = (year: number, month: number, day: number): boolean => {
      const d = new Date(year, month, day);
      return d < minBookableDate || d.getDay() === 0;
    };

    const calYear = calendarMonth.getFullYear();
    const calMonth = calendarMonth.getMonth();
    const calFirstDay = new Date(calYear, calMonth, 1).getDay();
    const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

    const isDayToday = (year: number, month: number, day: number): boolean => {
      return todayObj.getFullYear() === year && todayObj.getMonth() === month && todayObj.getDate() === day;
    };

    const isDaySelected = (year: number, month: number, day: number): boolean => {
      if (!date) return false;
      const [dy, dm, dd] = date.split("-").map(Number);
      return dy === year && dm - 1 === month && dd === day;
    };

    const morningSlots = availableSlots.filter((s) => {
      const h = parseInt(s.split(":")[0]);
      return h >= 7 && h < 12;
    });
    const afternoonSlots = availableSlots.filter((s) => {
      const h = parseInt(s.split(":")[0]);
      return h >= 12 && h < 20;
    });
    const currentSlots = slotPeriod === "manha" ? morningSlots : afternoonSlots;

    const summaryDateStr = date ? formatDateBR(date) : "Selecione acima";
    const summaryTimeStr = time || "Selecione acima";

    return (
      <>
      <div id="booking-portal-view" className="booking-portal-light min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-lg">
          <div className="w-full flex flex-col items-center justify-center text-center pt-6 pb-2 px-0 mx-0">
            <div className="relative flex justify-center items-center w-full mb-3">
              <img
                src={logoFrGreen}
                alt="Dra. Fabrícia Rodrigues"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm mx-auto block border-2 border-[#C9A227]/30 transform translate-x-1"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight w-full text-center">
              Dra. Fabrícia Rodrigues
            </h1>
            <p className="text-xs text-emerald-700 font-medium w-full text-center mt-1">
              Agende sua consulta online
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-brand p-4 sm:p-5 text-white text-center">
              <h2 className="text-base font-bold">Agendamento Online</h2>
              <p className="text-gold/80 text-xs mt-0.5">
                {currentStep === "success" ? "Agendamento confirmado!" : stepSubtitles[currentStep as number] || ""}
              </p>
            </div>

            {currentStep !== "success" && (
              <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-slate-100">
                {([1, 2, 3] as const).map((step, i) => {
                  const stepNum = currentStep as number;
                  const stepDone = stepNum >= step + 1;
                  const lineDone = stepNum >= step + 2;
                  return (
                    <React.Fragment key={step}>
                      <div className={`flex items-center gap-1.5 ${i < 2 ? "flex-1" : ""}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                          stepDone ? "bg-emerald-600 text-white" : currentStep === step ? "bg-brand text-white" : "bg-slate-200 text-slate-500"
                        }`}>
                          {stepDone ? <Check className="w-3.5 h-3.5" /> : step}
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-wider hidden sm:inline ${
                          currentStep === step ? "text-brand" : "text-slate-400"
                        }`}>
                          {step === 1 ? "Dados" : step === 2 ? "Procedimento" : "Data"}
                        </span>
                      </div>
                      {i < 2 && (
                        <div className={`h-0.5 flex-1 rounded-full ${lineDone ? "bg-emerald-600" : "bg-slate-200"}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <div className="p-4 sm:p-5">
              {/* STEP 1 — Dados do paciente */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-brand uppercase tracking-wider mb-1.5">Nome Completo</label>
                      <input type="text" required placeholder="Ex: Roberto Carlos" value={name} onChange={(e) => setName(sanitizeName(e.target.value))} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors min-h-[48px]" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-brand uppercase tracking-wider mb-1.5">Celular / WhatsApp</label>
                      <input type="tel" inputMode="tel" enterKeyHint="next" required placeholder="(11) 98888-7777" value={phone} onChange={(e) => { const raw = sanitizePhone(e.target.value); setPhone(formatPhoneBR(raw)); }} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors min-h-[48px]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-brand uppercase tracking-wider mb-1.5">Data de Nascimento</label>
                      <input type="text" inputMode="numeric" autoComplete="bday" placeholder="DD/MM/AAAA" maxLength={10} value={dobDisplay} required onChange={(e) => handleDobChange(e.target.value)} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors min-h-[48px]" />
                      <p className="text-[11px] text-slate-400 mt-1">Formato: dia/mês/ano</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-brand uppercase tracking-wider mb-1.5">Gênero</label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors min-h-[48px] bg-white">
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Prefiro não informar">Prefiro não informar</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-100 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-rose-800">Paciente possui Diabetes?</p>
                        <p className="text-[11px] text-rose-600/80">Essa informação ajuda a preparar o atendimento com segurança.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                      <input type="checkbox" checked={isDiabetic} onChange={(e) => setIsDiabetic(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                    </label>
                  </div>

                  <button type="button" onClick={() => { if (!canAdvanceStep1) { alert("Preencha nome (mínimo 3 caracteres) e celular (mínimo 8 caracteres) para continuar."); return; } setCurrentStep(2); }} className="w-full bg-brand hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[50px]">
                    Continuar <span className="text-lg leading-none">→</span>
                  </button>
                </div>
              )}

              {/* STEP 2 — Procedimento */}
              {currentStep === 2 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {servicesList.map((proc) => {
                    const isSelected = selectedProcedure?.name === proc.name || (!selectedProcedure && service === proc.name);
                    return (
                      <div key={proc.name} onClick={() => { setSelectedProcedure(proc); setService(proc.name); }} className={`border-2 rounded-xl p-4 cursor-pointer transition-all relative ${isSelected ? "border-brand bg-emerald-50/50 shadow-sm" : "border-slate-200 hover:border-gold/50 bg-white"}`}>
                        <div className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-brand border-brand" : "border-slate-300 bg-white"}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <h3 className="font-serif font-semibold text-brand text-[15px] pr-8 mb-1">{proc.name}</h3>
                        {proc.description && <p className="text-[13px] text-slate-500 mb-3 pr-6">{proc.description}</p>}
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] text-slate-500 font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {proc.duration} min
                          </span>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">a partir de</span>
                            <span className="text-lg font-extrabold text-brand font-serif">R$ {proc.price}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setCurrentStep(1)} className="flex-none px-5 py-3 rounded-xl border-2 border-slate-200 text-brand font-bold text-sm hover:border-brand transition-colors cursor-pointer min-h-[50px]">
                      ← Voltar
                    </button>
                    <button type="button" onClick={() => setCurrentStep(3)} disabled={!canAdvanceStep2} className="flex-1 bg-brand hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[50px]">
                      Continuar <span className="text-lg leading-none">→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 — Data e Horário */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[13px] flex gap-3">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800 mb-0.5">Agendamento com 24h de antecedência</p>
                      <p className="text-amber-700">Para agendamentos no mesmo dia, entre em contato diretamente pelo WhatsApp.</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-serif font-semibold text-brand text-[17px]">{monthNames[calMonth]} {calYear}</p>
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))} className="w-8 h-8 rounded-lg border-2 border-slate-200 bg-white flex items-center justify-center text-brand font-bold hover:border-brand transition-colors cursor-pointer text-sm">‹</button>
                        <button type="button" onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))} className="w-8 h-8 rounded-lg border-2 border-slate-200 bg-white flex items-center justify-center text-brand font-bold hover:border-brand transition-colors cursor-pointer text-sm">›</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 text-center text-[11px] font-extrabold text-slate-400 uppercase mb-1.5">
                      <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: calFirstDay }).map((_, i) => <div key={`blank-${i}`} />)}
                      {Array.from({ length: calDaysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const disabled = isDayDisabled(calYear, calMonth, day);
                        const todayMark = isDayToday(calYear, calMonth, day);
                        const selected = isDaySelected(calYear, calMonth, day);
                        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        return (
                          <button key={day} type="button" disabled={disabled} onClick={() => { setDate(dateStr); setTime(""); }} className={`aspect-square rounded-lg text-[13px] font-semibold flex items-center justify-center relative transition-all ${
                            disabled ? "text-slate-300 bg-slate-50 cursor-not-allowed" : selected ? "bg-brand text-white shadow-sm" : "bg-slate-50 text-slate-700 hover:border-brand hover:border-2 cursor-pointer"
                          }`}>
                            {day}
                            {todayMark && !disabled && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-gold" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex gap-2 mb-3">
                      <button type="button" onClick={() => setSlotPeriod("manha")} className={`flex-1 py-2.5 rounded-xl border-2 text-[13px] font-bold transition-all cursor-pointer ${slotPeriod === "manha" ? "bg-brand border-brand text-white" : "border-slate-200 bg-white text-slate-500 hover:border-brand"}`}>
                        ☀️ Manhã
                      </button>
                      <button type="button" onClick={() => setSlotPeriod("tarde")} className={`flex-1 py-2.5 rounded-xl border-2 text-[13px] font-bold transition-all cursor-pointer ${slotPeriod === "tarde" ? "bg-brand border-brand text-white" : "border-slate-200 bg-white text-slate-500 hover:border-brand"}`}>
                        🌤️ Tarde
                      </button>
                    </div>

                    {!date && (
                      <div className="text-center py-6 bg-slate-50 rounded-xl text-[13px] text-slate-400">
                        Selecione uma data no calendário para ver os horários.
                      </div>
                    )}

                    {date && isLoadingSlots && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
                        ))}
                      </div>
                    )}

                    {date && slotsError && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-[13px] text-rose-700 text-center">
                        {slotsError}
                      </div>
                    )}

                    {date && !isLoadingSlots && !slotsError && currentSlots.length === 0 && (
                      <div className="text-center py-6 bg-slate-50 rounded-xl text-[13px] text-slate-500">
                        Nenhum horário disponível neste período. Tente {slotPeriod === "manha" ? "a tarde" : "a manhã"}.
                      </div>
                    )}

                    {date && !isLoadingSlots && !slotsError && currentSlots.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {currentSlots.map((slot) => (
                          <button key={slot} type="button" onClick={() => setTime(slot)} className={`min-h-[44px] py-2 rounded-lg border-2 text-[13px] font-bold transition-all cursor-pointer active:scale-95 ${
                            time === slot ? "bg-brand border-brand text-white shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:border-brand"
                          }`}>
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-brand uppercase tracking-wider mb-1.5">Observações (opcional)</label>
                    <textarea placeholder="Ex: Sentindo queimação na planta do pé." value={notes} onChange={(e) => setNotes(sanitizeNotes(e.target.value))} onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })} rows={3} maxLength={500} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors resize-y min-h-[84px]" />
                  </div>

                  {canConfirm && (
                    <div className="bg-gradient-to-br from-emerald-50 to-amber-50 border-2 border-brand/30 rounded-xl p-4 space-y-2">
                      <p className="font-serif font-semibold text-brand text-[13px] uppercase tracking-wider">Resumo do agendamento</p>
                      <div className="flex justify-between text-[14px]"><span className="text-slate-500">Procedimento</span><span className="font-semibold text-slate-800 text-right">{bookedName}</span></div>
                      <div className="flex justify-between text-[14px]"><span className="text-slate-500">Duração</span><span className="font-semibold">{bookedDuration} min</span></div>
                      <div className="flex justify-between text-[14px]"><span className="text-slate-500">Data e horário</span><span className="font-semibold">{summaryDateStr} às {summaryTimeStr}</span></div>
                      <div className="flex justify-between text-[15px] font-bold text-brand pt-2 border-t border-brand/20"><span>Valor</span><span className="font-serif text-lg">R$ {bookedPrice.toFixed(2)}</span></div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setCurrentStep(2)} className="flex-none px-5 py-3 rounded-xl border-2 border-slate-200 text-brand font-bold text-sm hover:border-brand transition-colors cursor-pointer min-h-[50px]">
                      ← Voltar
                    </button>
                    <button type="button" onClick={handleSimulateBooking} disabled={isLoading || !canConfirm} className="flex-1 bg-brand hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[50px]">
                      {isLoading ? <><Activity className="w-4 h-4 animate-spin" /> Agendando...</> : <>✓ Confirmar agendamento</>}
                    </button>
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {currentStep === "success" && (
                <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <CheckCircle className="w-9 h-9 stroke-[2.5]" />
                  </div>
                  <h2 className="font-serif font-semibold text-brand text-xl mb-2">Agendamento confirmado!</h2>
                  <p className="text-[14px] text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
                    {bookedName} agendado para {summaryDateStr} às {summaryTimeStr}. Você receberá a confirmação pelo WhatsApp em instantes.
                  </p>
                  <button type="button" onClick={() => { resetForm(); setCurrentStep(1); setSelectedProcedure(null); setCalendarMonth(new Date()); setSlotPeriod("manha"); }} className="bg-brand hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm hover:shadow transition-all text-sm cursor-pointer min-h-[50px] mx-auto">
                    Fazer novo agendamento
                  </button>
                </div>
              )}
            </div>
          </div>

          <a
            href="/cliente/consultar"
            className="block text-center text-[13px] text-brand/60 hover:text-brand transition-colors mt-5 mb-1"
          >
            Já agendou e esqueceu a data? <span className="underline underline-offset-2">Consultar meu agendamento</span>
          </a>

          <p className="text-[10px] text-slate-400 text-center mt-2">
            © 2026 Clínica Dra. Fabrícia Rodrigues. Todos os direitos reservados. • Desenvolvido por Luan Estifer Rodrigues Pereira (Software Engineer).
          </p>
        </div>
      </div>

      <AiReceptionistWidget />
      </>
    );
  }

  return (
    <div id="booking-portal-view" className="space-y-6 text-left">
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-gold animate-pulse" /> Site de Agendamento Online
          </h2>
          <p className="text-gold/80 text-xs">
            Seu portal público de agendamentos está ativo e totalmente integrado ao Firebase!
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setPortalTab("portal")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              portalTab === "portal"
                ? "bg-brand text-white shadow-sm"
                : "bg-emerald-950 text-gold/60 border border-emerald-800 hover:bg-emerald-900"
            }`}
          >
            <Globe className="w-4 h-4" /> Portal Oficial Ativo
          </button>
          <button
            onClick={() => setPortalTab("simulator")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              portalTab === "simulator"
                ? "bg-brand text-white shadow-sm"
                : "bg-emerald-950 text-gold/60 border border-emerald-800 hover:bg-emerald-900"
            }`}
          >
            <Smartphone className="w-4 h-4" /> Simulador de Teste
          </button>
          <button
            onClick={() => setPortalTab("code")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              portalTab === "code"
                ? "bg-brand text-white shadow-sm"
                : "bg-emerald-950 text-gold/60 border border-emerald-800 hover:bg-emerald-900"
            }`}
          >
            <FileCode className="w-4 h-4" /> Código de Backup
          </button>
        </div>
      </div>

      {portalTab === "portal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gold animate-ping"></span>
                  Site Ativo e Online
                </span>
                <h3 className="text-base font-bold text-slate-800 tracking-tight mt-2">
                  Portal de Agendamento da Dra. Fabrícia
                </h3>
              </div>
              <Globe className="w-8 h-8 text-gold opacity-20" />
            </div>

            <div className="bg-gradient-to-br from-emerald-950 to-emerald-950 rounded-2xl p-6 text-white text-center relative overflow-hidden shadow-sm border border-emerald-900">
              <div className="absolute inset-0 bg-black opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20">
                  <Globe className="w-8 h-8 text-gold/60" />
                </div>
                <div>
                  <p className="text-xs text-gold/80 font-semibold tracking-wider uppercase">Endereço Oficial do Portal</p>
                  <p className="text-lg font-mono font-bold text-emerald-100 mt-1 selection:bg-gold">
                    podologa-fabricia.web.app/cliente
                  </p>
                </div>

                <p className="text-xs text-gold/60 max-w-sm mx-auto leading-relaxed">
                  Seus clientes selecionam serviços, informam o tipo de pisada e realizam o pré-agendamento com verificação de disponibilidade em tempo real.
                </p>

                <div className="pt-2">
                  <a
                    href="https://podologa-fabricia.web.app/cliente"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-brand hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-xl text-xs tracking-wide transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <Globe className="w-4 h-4" /> Acessar Portal do Cliente
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Como funciona a Integração em Tempo Real:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-xs font-bold text-slate-800">1. Duração do Serviço</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Cada serviço possui uma duração específica (ex: 45min para Podologia Geral, 60min para Onicocriptose). O sistema calcula automaticamente o horário de término.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-xs font-bold text-slate-800">2. Prevenção de Conflitos</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Antes de exibir os horários, o sistema consulta o Google Agenda e o Firestore, bloqueando automaticamente horários já ocupados ou reservados (Almoço, Faxina, etc.).
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-xs font-bold text-slate-800">3. Gravação no Google Agenda</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Ao confirmar o agendamento, o evento é criado diretamente no Google Agenda ('primary') com o horário de início e término exatos.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-xs font-bold text-slate-800">4. Cadastro no Firestore</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    O paciente é registrado na coleção <code className="bg-white px-1 py-0.5 border border-slate-100 rounded font-mono font-bold text-emerald-700">patients</code> e o agendamento em <code className="bg-white px-1 py-0.5 border border-slate-100 rounded font-mono font-bold text-emerald-700">appointments</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-gold" /> Integração com WhatsApp
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Configure esta mensagem automática no WhatsApp Business:
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-3 relative">
                <p className="font-bold text-emerald-800 text-[11px]">Mensagem Recomendada:</p>
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
                  <Copy className="w-3.5 h-3.5" /> Copiar Mensagem
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-gold" /> Status de Sincronização
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold"></span> Conexão Firebase
                  </div>
                  <span className="font-bold font-mono text-[11px]">CONECTADO</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold"></span> Google Agenda
                  </div>
                  <span className="font-bold font-mono text-[11px]">N/A</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold"></span> Prevenção de Conflitos
                  </div>
                  <span className="font-bold font-mono text-[11px]">ATIVO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {portalTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Simulador do Portal de Agendamento
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Preencha os dados abaixo para simular um agendamento. O sistema verifica disponibilidade no Google Agenda e Firestore, calcula a duração do serviço e registra em tempo real.
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSimulateBooking} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input type="text" required placeholder="Ex: Roberto Carlos" value={name} onChange={(e) => setName(sanitizeName(e.target.value))} className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Celular / WhatsApp</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input type="tel" required placeholder="(11) 98888-7777" value={phone} onChange={(e) => { const raw = sanitizePhone(e.target.value); setPhone(formatPhoneBR(raw)); }} className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data Nascimento</label>
                    <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gênero</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold bg-white">
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Pisada</label>
                    <select value={footStrike} onChange={(e) => setFootStrike(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold bg-white">
                      <option value="Não sei">Não sei</option>
                      <option value="Neutra">Neutra</option>
                      <option value="Pronada">Pronada</option>
                      <option value="Supinada">Supinada</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-between">
                  <div className="flex gap-2.5 items-center">
                    <Heart className="w-5 h-5 text-rose-600 fill-rose-100" />
                    <div>
                      <p className="text-xs font-bold text-rose-900">Paciente possui Diabetes?</p>
                      <p className="text-[10px] text-rose-600 mt-0.5">Ativa alertas preventivos de pé diabético no painel.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isDiabetic} onChange={(e) => setIsDiabetic(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {/* Service selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Procedimento / Especialidade</label>
                  <select value={service} onChange={(e) => setService(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold bg-white">
                    {servicesList.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} (R$ {s.price}) — {s.duration} min
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Duração: <strong className="text-emerald-700">{selectedServiceDuration} minutos</strong>
                  </p>
                </div>

                {/* Date + time slots */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Escolha de Data e Horário</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data Pretendida</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())}
                          className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                      </div>

                      {dateBlocked && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-amber-800 leading-relaxed">
                            A clínica não realiza atendimentos aos {blockedDayName === "domingo" ? "domingos" : "sábados"}. Por favor, selecione outro dia da semana.
                          </p>
                        </div>
                      )}
                    </div>

                    {date && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Horários Disponíveis ({availableSlots.length} vagas)
                        </label>
                        {availableSlots.length === 0 ? (
                          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-xs text-amber-800">
                            Nenhum horário disponível nesta data para o serviço selecionado. Tente outra data.
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                            {availableSlots.map((slot) => {
                              const isSelected = time === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setTime(slot)}
                                  className={`text-center py-2.5 px-2 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                                    time === slot
                                      ? "bg-brand text-white border-brand shadow-sm"
                                      : "bg-white text-slate-700 border-slate-200 hover:border-brand hover:bg-brand/5 active:bg-brand/10"
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {!date && (
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-500 text-center">
                        Selecione uma data para ver os horários disponíveis.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sintomas ou Notas Extras (Opcional)</label>
                    <input type="text" placeholder="Ex: Sentindo queimação na planta do pé." value={notes} onChange={(e) => setNotes(sanitizeNotes(e.target.value))} maxLength={500} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold" />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !time}
                  className="w-full bg-brand hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-sm hover:shadow transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Activity className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Agendando..." : "Confirmar Agendamento de Teste"}
                </button>
              </form>
            ) : (
              <div className="p-8 text-center bg-emerald-50/25 rounded-2xl border border-emerald-100/50 space-y-5 animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-100 text-gold rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Agendamento Realizado com Sucesso!</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Registrado no Firestore (pacientes + agendamentos) e sincronizado com o app da Dra. Fabrícia.
                  </p>
                </div>

                {googleSyncStatus && (
                  <div className={`border p-3 rounded-xl text-left text-xs max-w-md mx-auto ${
                    googleSyncStatus === "synced"
                      ? "bg-emerald-50 border-emerald-100"
                      : googleSyncStatus === "pending"
                      ? "bg-amber-50 border-amber-100"
                      : "bg-rose-50 border-rose-100"
                  }`}>
                    {googleSyncStatus === "synced" ? (
                      <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Evento criado no Google Agenda com sucesso.
                      </p>
                    ) : googleSyncStatus === "pending" ? (
                      <p className="font-bold text-amber-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Google Agenda: aguardando conexão.
                        <span className="font-medium text-amber-700">O app da Dra. Fabrícia sincronizará automaticamente ao abrir a agenda.</span>
                      </p>
                    ) : (
                      <p className="font-bold text-rose-800 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Não foi possível criar o evento no Google Agenda agora.
                        <span className="font-medium text-rose-700">Ele será sincronizado automaticamente quando o app abrir.</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-left text-xs space-y-2 max-w-md mx-auto">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-gold" /> Notificação de Automação do WhatsApp (Simulada)
                  </p>
                  <div className="bg-white p-3 rounded-lg border border-emerald-100/50 text-slate-600 font-mono text-[10px] whitespace-pre-line leading-relaxed">
                    {`*Clínica Dra. Fabrícia Rodrigues* 🐾
Olá, *${name}*! Confirmamos seu agendamento online:

📅 *Data:* ${formatDateBR(date)}
🕒 *Horário:* ${time}h
⏱ *Duração:* ${selectedServiceDuration} min
📍 *Procedimento:* ${service}

_Por favor, se você for diabético, lembre-se de trazer os exames mais recentes._`}
                  </div>
                </div>

                <div className="flex gap-2 justify-center max-w-xs mx-auto">
                  <button onClick={resetForm} className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer">
                    Agendar Outro
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-gold" /> Como Funciona
              </h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                  <p className="text-slate-600">Selecione o <strong>procedimento</strong> — a duração é carregada automaticamente do Firestore.</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                  <p className="text-slate-600">Escolha a <strong>data</strong> — o sistema consulta Google Agenda + Firestore para bloquear conflitos.</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                  <p className="text-slate-600">Veja apenas os <strong>horários realmente disponíveis</strong> — horários ocupados ou bloqueados não aparecem.</p>
                </div>
                <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                  <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                  <p className="text-slate-600">Confirme — o evento é criado no Google Agenda e salvo no Firestore simultaneamente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {portalTab === "code" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Código-Fonte HTML/JS para Emergências (Backup)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Código autônomo totalmente configurado para hospedar um espelho do portal.
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
              {isCopied ? <Check className="w-4 h-4 text-gold" /> : <Copy className="w-4 h-4" />}
              {isCopied ? "Copiado!" : "Copiar Código"}
            </button>

            <pre className="text-[10px] leading-relaxed font-mono bg-slate-900 text-gold p-5 rounded-2xl overflow-x-auto max-h-[400px] text-left">
              {standaloneHTMLCode}
            </pre>
          </div>
        </div>
      )}

      {/* Widget flutuante da Recepcionista Virtual — visível para clientes no portal */}
      <AiReceptionistWidget />
    </div>
  );
}
