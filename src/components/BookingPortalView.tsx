import React, { useState, useEffect, useCallback } from "react";
import { db, isFirebaseConfigured } from "../services/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
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
  X,
  AlertCircle,
} from "lucide-react";
// @ts-ignore
import clinicLogo from "../assets/images/clinic_logo_1783686122531.jpg";
import { getClinicWhatsAppLink } from "../services/whatsappAutoService";

const SLOT_INTERVAL = 30;
const BUSINESS_START = 7;
const BUSINESS_END = 19;

const serviceDefaults: Record<string, { price: number; duration: number }> = {
  "Podologia Geral": { price: 150, duration: 45 },
  "Tratamento de Órtese": { price: 120, duration: 60 },
  "Tratamento de Verruga Plantar": { price: 180, duration: 30 },
  "Tratamento de Onicocriptose": { price: 160, duration: 60 },
  "Avaliação de Pé Diabético": { price: 150, duration: 45 },
};

function generateSlots(forClient = false): string[] {
  const slots: string[] = [];
  const start = forClient ? 8 : BUSINESS_START;
  const end = forClient ? 18 : BUSINESS_END;
  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += SLOT_INTERVAL) {
      slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
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
}

export default function BookingPortalView({ clientMode = false, blockSaturdays = false }: BookingPortalViewProps) {
  const [portalTab, setPortalTab] = useState<"portal" | "simulator" | "code">("portal");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<"synced" | "pending" | "error" | "">("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
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

  // Load services from Firestore
  useEffect(() => {
    (async () => {
      try {
        if (!isFirebaseConfigured || !db) return;
        const q = query(collection(db, "services"), where("isActive", "!=", false));
        const snap = await getDocs(q);
        if (snap.empty) {
          const fallback = Object.entries(serviceDefaults).map(([name, cfg]) => ({
            name,
            ...cfg,
          }));
          setServicesList(fallback);
          return;
        }
        const list: ServiceOption[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.name) {
            list.push({
              name: data.name,
              price: data.price || 150,
              duration: data.duration || 45,
              description: data.description,
            });
          }
        });
        if (list.length > 0) {
          setServicesList(list);
        } else {
          const fallback = Object.entries(serviceDefaults).map(([name, cfg]) => ({
            name,
            ...cfg,
          }));
          setServicesList(fallback);
        }
      } catch {
        const fallback = Object.entries(serviceDefaults).map(([name, cfg]) => ({
          name,
          ...cfg,
        }));
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
  const loadBlockedSlots = useCallback(async (selectedDate: string) => {
    if (!selectedDate || !isFirebaseConfigured || !db) {
      setBlockedSlots([]);
      return;
    }

    const occupied: BlockedSlot[] = [];

    try {
      // 1. Fetch schedule blocks for this date
      const blocksSnap = await getDocs(
        query(collection(db, "scheduleBlocks"), where("date", "==", selectedDate))
      );
      blocksSnap.forEach((d) => {
        const data = d.data();
        occupied.push({
          startMinutes: timeToMinutes(data.startTime),
          endMinutes: timeToMinutes(data.endTime),
          reason: data.reason || "Bloqueado",
        });
      });
    } catch {
      // ignore
    }

    try {
      // 2. Fetch appointments for this date
      const apptsSnap = await getDocs(
        query(collection(db, "appointments"), where("date", "==", selectedDate))
      );
      apptsSnap.forEach((d) => {
        const data = d.data();
        if (data.time) {
          const apptDuration = serviceDefaults[data.service]?.duration || 45;
          const startM = timeToMinutes(data.time);
          occupied.push({
            startMinutes: startM,
            endMinutes: startM + apptDuration,
            reason: `Agendamento: ${data.patientName || data.service}`,
          });
        }
      });
    } catch {
      // ignore
    }

    setBlockedSlots(occupied);
  }, []);

  useEffect(() => {
    loadBlockedSlots(date);
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
    const allSlots = generateSlots(clientMode);
    const dur = selectedServiceDuration;
    const businessEnd = clientMode ? 18 : BUSINESS_END;
    const free = allSlots.filter((slot) => {
      const startM = timeToMinutes(slot);
      const endM = startM + dur;
      if (endM > timeToMinutes(`${businessEnd}:00`)) return false;
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
  }, [blockedSlots, selectedServiceDuration, time, clientMode, dateBlocked]);

  const handleSimulateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !service || !name || !phone) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    if (dateBlocked) {
      alert(`A clínica não realiza atendimentos aos ${blockedDayName === "domingo" ? "domingos" : "sábados"}. Por favor, selecione outro dia da semana.`);
      return;
    }
    setIsLoading(true);

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
        name,
        phone,
        dob,
        gender,
        isDiabetic,
        footStrikeType: footStrike,
        hasCirculatoryIssues: isDiabetic,
        isSmoker: false,
        hasAllergies: "Nenhuma",
        observations: `Paciente pré-agendado online. Notas: "${notes || "Sem notas adicionais"}"`,
        footIssues: [],
        evolutions: [],
        createdAt: new Date().toISOString(),
      });

      // 1b. Try to create the Google Calendar event in the same operation (if token available)
      try {
        const {
          createGoogleCalendarEvent: fsCreateGoogleEvent,
          isGoogleCalendarConnected: gcalConnected,
        } = await import("../services/googleCalendar");
        if (gcalConnected()) {
          const dtStart = `${date}T${time}:00-03:00`;
          const endDate = new Date(
            new Date(`${date}T${time}:00`).getTime() + durationMin * 60000
          );
          const dtEnd = endDate.toISOString().slice(0, 19) + "-03:00";
          const summary = `${service} - ${name}`;
          const description =
            `Agendamento Online - Portal do Cliente\n` +
            `Paciente: ${name}\n` +
            `Telefone: ${phone}\n` +
            `Serviço: ${service}\n` +
            `Data: ${formatDateBR(date)} às ${time}\n` +
            `Valor: R$ ${price}\n` +
            (notes ? `Observações: ${notes}` : "");
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
        patientName: name,
        date,
        time,
        service,
        price,
        status: "scheduled",
        notes: notes || "Solicitado via Portal Online",
        source: "portal",
        ...(calendarEventId ? { calendarEventId } : {}),
        ...(googleResult === "created"
          ? { googleSync: "synced" }
          : { googleSync: "pending" }),
      });

      setIsSubmitted(true);
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
    const minDateStr = tomorrow.toISOString().split("T")[0];
    const isToday = date === new Date().toISOString().split("T")[0];

    return (
      <div id="booking-portal-view" className="booking-portal-light min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <img
              src={clinicLogo}
              alt="Dra. Fabrícia Rodrigues"
              className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-brand mx-auto mb-3"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-xl font-bold text-brand tracking-tight">Dra. Fabrícia Rodrigues</h1>
            <p className="text-xs text-emerald-700 mt-1">Agende sua consulta online</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-brand p-5 text-white text-center">
              <h2 className="text-base font-bold">Agendamento Online</h2>
              <p className="text-gold/80 text-xs mt-0.5">Preencha seus dados para agendar</p>
            </div>

            <div className="p-5">
              {!isSubmitted ? (
                <form onSubmit={handleSimulateBooking} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome Completo</label>
                      <input type="text" required placeholder="Ex: Roberto Carlos" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Celular / WhatsApp</label>
                      <input type="tel" required placeholder="(11) 98888-7777" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data Nascimento</label>
                      <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Gênero</label>
                      <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand bg-white">
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-between">
                    <div className="flex gap-2 items-center">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-100" />
                      <p className="text-xs font-bold text-rose-900">Paciente possui Diabetes?</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isDiabetic} onChange={(e) => setIsDiabetic(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Procedimento</label>
                    <select value={service} onChange={(e) => setService(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand bg-white">
                      {servicesList.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name} (R$ {s.price}) — {s.duration} min
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Data e Horário</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data Pretendida</label>
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          min={minDateStr}
                          className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand"
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

                      {/* Info sobre agendamento no mesmo dia */}
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs space-y-2">
                        <p className="text-amber-900 font-semibold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" /> Agendamento com 24h de antecedência
                        </p>
                        <p className="text-amber-700 leading-relaxed">
                          Para agendamentos no mesmo dia, entre em contato diretamente pelo WhatsApp.
                        </p>
                        <a
                          href={getClinicWhatsAppLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-lg text-[11px] transition-all shadow-sm"
                        >
                          Fale Conosco no WhatsApp
                        </a>
                      </div>

                      {date && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Horários Disponíveis ({availableSlots.length} vagas)
                          </label>
                          {availableSlots.length === 0 ? (
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-xs text-amber-800">
                              Nenhum horário disponível nesta data. Tente outra data.
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                              {availableSlots.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setTime(slot)}
                                  className={`text-center py-2.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    time === slot
                                      ? "bg-brand text-white border-brand shadow-sm"
                                      : "bg-white text-slate-700 border-slate-200 hover:border-gold/50 hover:bg-gold/5"
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
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
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Observações (Opcional)</label>
                    <input type="text" placeholder="Ex: Sentindo queimação na planta do pé." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand" />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !time}
                    className="w-full bg-brand hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-sm hover:shadow transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Activity className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                    {isLoading ? "Agendando..." : "Confirmar Agendamento"}
                  </button>
                </form>
              ) : (
                <div className="p-6 text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-100 text-gold rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-brand">Agendamento Realizado!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Seu agendamento foi registrado com sucesso.
                    </p>
                  </div>
                  <button onClick={resetForm} className="w-full bg-white hover:bg-slate-50 text-brand border border-emerald-200 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer">
                    Agendar Outro
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-6">
            Dra. Fabrícia Rodrigues — Podologia & Saúde dos Pés
          </p>
        </div>
      </div>
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
                      <input type="text" required placeholder="Ex: Roberto Carlos" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Celular / WhatsApp</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input type="tel" required placeholder="(11) 98888-7777" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold" />
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
                          min={new Date().toISOString().split("T")[0]}
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
                                  className={`text-center py-2.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-brand text-white border-brand shadow-sm"
                                      : "bg-white text-slate-700 border-slate-200 hover:border-gold/50 hover:bg-gold/5"
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
                  <input type="text" placeholder="Ex: Sentindo queimação na planta do pé." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold" />
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
    </div>
  );
}
