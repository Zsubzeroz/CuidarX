import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, isFirebaseConfigured } from "../services/firebase";
import { collection, doc, setDoc, getDocs, query, where, getDoc } from "firebase/firestore";
import { useResponsive } from "../hooks/useResponsive";
import { sanitizeName, sanitizeNameRaw, sanitizePhone, sanitizeNotes, sanitizeNotesRaw, formatPhoneBR } from "../utils/sanitize";
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
  Star,
  ChevronRight,
  Loader2,
  Building2,
  Stethoscope,
  ArrowLeft,
} from "lucide-react";
// @ts-ignore
import clinicLogo from "../assets/images/clinic_logo_1783686122531.jpg";
// @ts-ignore
import logoFrGreen from "../assets/images/logo-fr-green.png";
import { getClinicBySlug } from "../services/multiTenantFirestore";
import { getClinicWhatsAppLink, buildClientMessage } from "../services/whatsappAutoService";
import AiReceptionistWidget from "./AiReceptionistWidget";
import { setClinicId, getClinicId } from "../services/firestoreService";
import { loadClinicConfig, getCachedClinicConfig } from "../services/clinicConfigService";

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

function isOverlapping(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

function isSunday(dateStr: string): boolean {
  try { return new Date(dateStr + "T00:00:00").getDay() === 0; } catch { return false; }
}

function isSaturday(dateStr: string): boolean {
  try { return new Date(dateStr + "T00:00:00").getDay() === 6; } catch { return false; }
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  try { return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return dateStr; }
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

export default function BookingPortalView() {
  const { clinicSlug } = useParams<{ clinicSlug: string }>();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const [clinicConfig, setClinicConfig] = useState<{
    id: string;
    name: string;
    slug: string;
    doctorName: string;
    doctorSpecialty: string;
    logoPath: string;
    primaryColor: string;
    accentColor: string;
    whatsappDefaultMessage: string;
    clinicUrl: string;
    city: string;
    state: string;
    acceptsInsurance: boolean;
    averageRating: number;
    reviewCount: number;
    priceRange: { min: number; max: number };
    settings?: {
      expedienteStart?: string;
      expedienteEnd?: string;
      allowOnlineBooking: boolean;
      requireConfirmation: boolean;
      bookingWindowDays: number;
      timezone: string;
    };
  } | null>(null);

  const [isLoadingClinic, setIsLoadingClinic] = useState(true);
  const [clinicError, setClinicError] = useState<string | null>(null);

  const [portalTab, setPortalTab] = useState<"portal" | "simulator" | "code">("portal");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<"synced" | "pending" | "error" | "">("");

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

  const isServiceActive = (data: any): boolean =>
    data.isActive === true ||
    data.isActive === "Ativo" ||
    data.status === true ||
    data.status === "Ativo";

  const expedienteStart = clinicConfig?.settings?.expedienteStart || "08:00";
  const expedienteEnd = clinicConfig?.settings?.expedienteEnd || "20:00";
  const blockSaturdays = false;

  const brandColor = clinicConfig?.primaryColor || "#0B4C33";
  const accentColor = clinicConfig?.accentColor || "#CBAA6C";

  useEffect(() => {
    const loadClinic = async () => {
      if (!clinicSlug) {
        setClinicError("Slug da clínica não fornecido");
        setIsLoadingClinic(false);
        return;
      }

      setIsLoadingClinic(true);
      setClinicError(null);

      try {
        const clinic = await getClinicBySlug(clinicSlug);
        if (!clinic) {
          setClinicError("Clínica não encontrada");
          setIsLoadingClinic(false);
          return;
        }

        const fullConfig = await loadClinicConfig(clinic.id);
        if (fullConfig) {
          setClinicConfig({
            id: clinic.id,
            name: clinic.name,
            slug: clinic.slug,
            doctorName: clinic.doctorName,
            doctorSpecialty: clinic.doctorSpecialty,
            logoPath: clinic.logoPath,
            primaryColor: clinic.primaryColor,
            accentColor: clinic.accentColor,
            whatsappDefaultMessage: clinic.whatsappDefaultMessage,
            clinicUrl: clinic.clinicUrl,
            city: clinic.city || "",
            state: clinic.state || "",
            acceptsInsurance: clinic.acceptsInsurance || false,
            averageRating: clinic.averageRating || 0,
            reviewCount: clinic.reviewCount || 0,
            priceRange: clinic.priceRange || { min: 0, max: 0 },
            settings: fullConfig.settings,
          });
          setClinicId(clinic.id);
        }
      } catch (err: any) {
        console.error("Erro ao carregar clínica:", err);
        setClinicError(err.message || "Erro ao carregar clínica");
      } finally {
        setIsLoadingClinic(false);
      }
    };

    loadClinic();
  }, [clinicSlug]);

  useEffect(() => {
    (async () => {
      const fallback = Object.entries(serviceDefaults).map(([name, cfg]) => ({ name, ...cfg }));
      try {
        if (!isFirebaseConfigured || !db) {
          setServicesList(fallback);
          return;
        }
        const clinicId = getClinicId();
        if (!clinicId) {
          setServicesList(fallback);
          return;
        }
        const snap = await getDocs(
          query(collection(db, "clinics", clinicId, "services"), where("isActive", "==", true))
        );
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
        setServicesList(list.length > 0 ? list : fallback);
      } catch {
        setServicesList(fallback);
      }
    })();
  }, []);

  useEffect(() => {
    const found = servicesList.find((s) => s.name === service);
    setSelectedServiceDuration(found?.duration || 45);
  }, [service, servicesList]);

  const loadBlockedSlots = useCallback(async (selectedDate: string): Promise<void> => {
    if (!selectedDate) {
      setBlockedSlots([]);
      return;
    }

    const clinicId = getClinicId();
    if (!clinicId) return;

    const occupied: BlockedSlot[] = [];

    const apptDurationFor = (serviceName: string): number => {
      const srv = servicesList.find((s) => s.name === serviceName);
      if (srv?.duration && srv.duration > 0) return srv.duration;
      return serviceDefaults[serviceName]?.duration || 45;
    };

    try {
      const blocksSnap = await getDocs(
        query(
          collection(db, "clinics", clinicId, "publicScheduleBlocks"),
          where("date", "==", selectedDate)
        )
      );
      blocksSnap.forEach((d) => {
        const data = d.data();
        const startM = timeToMinutes(data.startTime);
        const endM = timeToMinutes(data.endTime);
        if (isNaN(startM) || isNaN(endM)) return;
        occupied.push({ startMinutes: startM, endMinutes: endM, reason: "Bloqueado" });
      });
    } catch {}

    try {
      const apptsSnap = await getDocs(
        query(
          collection(db, "clinics", clinicId, "appointments"),
          where("date", "==", selectedDate)
        )
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
    } catch {}

    setBlockedSlots(occupied);
  }, [servicesList]);

  useEffect(() => {
    if (!date) {
      setBlockedSlots([]);
      setIsLoadingSlots(false);
      setSlotsError(null);
      return;
    }
    let mounted = true;
    setIsLoadingSlots(true);
    setSlotsError(null);
    loadBlockedSlots(date)
      .then(() => { if (mounted) setIsLoadingSlots(false); })
      .catch((err) => {
        console.error("[Portal] Erro ao carregar horários:", err);
        if (mounted) {
          setSlotsError("Erro ao carregar horários. Tente novamente.");
          setIsLoadingSlots(false);
        }
      });
    return () => { mounted = false; };
  }, [date, loadBlockedSlots]);

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
    const startMin = expedienteStartMin;
    const endMin = expedienteEndMin;
    const allSlots = generateSlots(startMin, endMin);
    const dur = selectedServiceDuration;
    const free = allSlots.filter((slot) => {
      const startM = timeToMinutes(slot);
      const endM = startM + dur;
      if (endM > endMin) return false;
      for (const block of blockedSlots) {
        if (isOverlapping(startM, endM, block.startMinutes, block.endMinutes)) return false;
      }
      return true;
    });
    setAvailableSlots(free);
    if (time && !free.includes(time)) setTime("");
  }, [blockedSlots, selectedServiceDuration, time, dateBlocked, expedienteStart, expedienteEnd]);

  const handleDobChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
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

    try {
      if (!isFirebaseConfigured || !db) {
        throw new Error("Firebase não configurado");
      }
      const clinicId = getClinicId();
      if (!clinicId) throw new Error("Clínica não identificada");

      await setDoc(doc(db, "clinics", clinicId, "patients", patientId), {
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

      await setDoc(doc(db, "clinics", clinicId, "appointments", appointmentId), {
        patientId,
        patientName: safeName,
        date,
        time,
        service,
        price,
        status: "scheduled",
        notes: safeNotes || "Solicitado via Portal Online",
        source: "portal",
        googleSync: "pending",
      });

      setIsSubmitted(true);
      setCurrentStep("success");
      setGoogleSyncStatus("pending");
    } catch (e: any) {
      console.error(e);
      alert("Erro detalhado: " + (e.message || JSON.stringify(e)));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName(""); setPhone(""); setDob(""); setIsDiabetic(false);
    setDate(""); setTime(""); setService("Podologia Geral");
    setNotes(""); setIsSubmitted(false); setCurrentStep(1);
    setSelectedProcedure(null); setCalendarMonth(new Date());
    setSlotPeriod("manha"); setSlotsError(null);
  };

  const todayObj = new Date();
  const minBookableDate = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate() + 1);

  const isDayDisabled = (year: number, month: number, day: number): boolean => {
    const d = new Date(year, month, day);
    return d < minBookableDate || d.getDay() === 0;
  };

  const isDayToday = (year: number, month: number, day: number): boolean => {
    return todayObj.getFullYear() === year && todayObj.getMonth() === month && todayObj.getDate() === day;
  };

  const isDaySelected = (year: number, month: number, day: number): boolean => {
    if (!date) return false;
    const [dy, dm, dd] = date.split("-").map(Number);
    return dy === year && dm - 1 === month && dd === day;
  };

  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const calFirstDay = new Date(calYear, calMonth, 1).getDay();
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

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
  const bookedPrice = selectedProcedure?.price || servicesList.find((s) => s.name === service)?.price || 150;
  const bookedDuration = selectedProcedure?.duration || servicesList.find((s) => s.name === service)?.duration || 45;
  const bookedName = selectedProcedure?.name || service;

  if (isLoadingClinic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Carregando clínica...</p>
        </div>
      </div>
    );
  }

  if (clinicError || !clinicConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Clínica não encontrada</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{clinicError || "A clínica solicitada não existe ou não está ativa."}</p>
          <Link
            to="/cliente"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para busca
          </Link>
        </div>
      </div>
    );
  }

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

  return (
    <>
    <div id="booking-portal-view" className="booking-portal-light min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg">
        <div className="w-full flex flex-col items-center justify-center text-center pt-6 pb-2 px-0 mx-0">
          <div className="relative flex justify-center items-center w-full mb-3">
            {clinicConfig.logoPath && clinicConfig.logoPath !== "/logo.png" ? (
              <img
                src={clinicConfig.logoPath}
                alt={clinicConfig.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm mx-auto block border-2 border-white/50"
              />
            ) : (
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto shadow-sm border-2 border-white/50"
                style={{ backgroundColor: brandColor }}
              >
                <Building2 className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight w-full text-center">
            {clinicConfig.doctorName}
          </h1>
          <p className="text-xs text-emerald-700 font-medium w-full text-center mt-1">
            {clinicConfig.doctorSpecialty} • {clinicConfig.city}, {clinicConfig.state}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r text-white text-center p-4 sm:p-5" style={{ background: `linear-gradient(135deg, ${brandColor}, ${adjustColor(brandColor, -20)})` }}>
            <h2 className="text-base font-bold">Agendamento Online</h2>
            <p className="text-[10px] opacity-80 mt-0.5">
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
                        stepDone ? "bg-emerald-600 text-white" : currentStep === step ? "bg-white text-brand" : "bg-slate-200 text-slate-500"
                      }`} style={{ backgroundColor: currentStep === step ? brandColor : undefined }}>
                        {stepDone ? <Check className="w-3.5 h-3.5" /> : step}
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider hidden sm:inline ${
                        currentStep === step ? "text-brand" : "text-slate-400"
                      }`} style={{ color: currentStep === step ? brandColor : undefined }}>
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
                    <input type="text" required placeholder="Ex: Roberto Carlos" value={name} onChange={(e) => setName(sanitizeNameRaw(e.target.value))} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors min-h-[48px]" style={{ borderColor: brandColor }} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-brand uppercase tracking-wider mb-1.5">Celular / WhatsApp</label>
                    <input type="tel" inputMode="tel" enterKeyHint="next" required placeholder="(11) 98888-7777" value={phone} onChange={(e) => { const raw = sanitizePhone(e.target.value); setPhone(formatPhoneBR(raw)); }} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors min-h-[48px]" style={{ borderColor: brandColor }} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-brand uppercase tracking-wider mb-1.5">Data de Nascimento</label>
                    <input type="text" inputMode="numeric" autoComplete="bday" placeholder="DD/MM/AAAA" maxLength={10} value={dobDisplay} required onChange={(e) => handleDobChange(e.target.value)} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors min-h-[48px]" style={{ borderColor: brandColor }} />
                    <p className="text-[11px] text-slate-400 mt-1">Formato: dia/mês/ano</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-brand uppercase tracking-wider mb-1.5">Gênero</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors min-h-[48px] bg-white" style={{ borderColor: brandColor }}>
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

                <button type="button" onClick={() => { if (!canAdvanceStep1) { alert("Preencha nome (mínimo 3 caracteres) e celular (mínimo 8 caracteres) para continuar."); return; } setCurrentStep(2); }} className="w-full text-white font-bold py-3.5 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[50px]" style={{ backgroundColor: brandColor }}>
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
                    <div key={proc.name} onClick={() => { setSelectedProcedure(proc); setService(proc.name); }} className={`border-2 rounded-xl p-4 cursor-pointer transition-all relative ${isSelected ? "border-brand bg-emerald-50/50 shadow-sm" : "border-slate-200 hover:border-gold/50 bg-white"}`} style={{ borderColor: isSelected ? brandColor : undefined }}>
                      <div className={`absolute top-3.5 right-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-brand border-brand" : "border-slate-300 bg-white"}`} style={{ backgroundColor: isSelected ? brandColor : undefined, borderColor: isSelected ? brandColor : undefined }}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <h3 className="font-serif font-semibold text-brand text-[15px] pr-8 mb-1" style={{ color: brandColor }}>{proc.name}</h3>
                      {proc.description && <p className="text-[13px] text-slate-500 mb-3 pr-6">{proc.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-slate-500 font-semibold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {proc.duration} min
                        </span>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">a partir de</span>
                          <span className="text-lg font-extrabold text-brand font-serif" style={{ color: brandColor }}>R$ {proc.price}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setCurrentStep(1)} className="flex-none px-5 py-3 rounded-xl border-2 border-slate-200 text-brand font-bold text-sm hover:border-brand transition-colors cursor-pointer min-h-[50px]" style={{ borderColor: brandColor, color: brandColor }}>
                    ← Voltar
                  </button>
                  <button type="button" onClick={() => setCurrentStep(3)} disabled={!canAdvanceStep2} className="flex-1 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[50px]" style={{ backgroundColor: brandColor }}>
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
                    <p className="font-serif font-semibold text-brand text-[17px]" style={{ color: brandColor }}>{monthNames[calMonth]} {calYear}</p>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))} className="w-8 h-8 rounded-lg border-2 border-slate-200 bg-white flex items-center justify-center text-brand font-bold hover:border-brand transition-colors cursor-pointer text-sm" style={{ borderColor: brandColor, color: brandColor }}>‹</button>
                      <button type="button" onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))} className="w-8 h-8 rounded-lg border-2 border-slate-200 bg-white flex items-center justify-center text-brand font-bold hover:border-brand transition-colors cursor-pointer text-sm" style={{ borderColor: brandColor, color: brandColor }}>›</button>
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
                          disabled ? "text-slate-300 bg-slate-50 cursor-not-allowed" : selected ? "text-white shadow-sm" : "bg-slate-50 text-slate-700 hover:border-brand hover:border-2 cursor-pointer"
                        }`} style={{ backgroundColor: selected ? brandColor : undefined, borderColor: selected ? brandColor : undefined }}>
                          {day}
                          {todayMark && !disabled && <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setSlotPeriod("manha")} className={`flex-1 py-2.5 rounded-xl border-2 text-[13px] font-bold transition-all cursor-pointer ${slotPeriod === "manha" ? "text-white" : "border-slate-200 bg-white text-slate-500 hover:border-brand"}`} style={{ backgroundColor: slotPeriod === "manha" ? brandColor : undefined, borderColor: slotPeriod === "manha" ? brandColor : undefined, color: slotPeriod === "manha" ? "white" : undefined }}>
                      ☀️ Manhã
                    </button>
                    <button type="button" onClick={() => setSlotPeriod("tarde")} className={`flex-1 py-2.5 rounded-xl border-2 text-[13px] font-bold transition-all cursor-pointer ${slotPeriod === "tarde" ? "text-white" : "border-slate-200 bg-white text-slate-500 hover:border-brand"}`} style={{ backgroundColor: slotPeriod === "tarde" ? brandColor : undefined, borderColor: slotPeriod === "tarde" ? brandColor : undefined, color: slotPeriod === "tarde" ? "white" : undefined }}>
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
                          time === slot ? "text-white shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:border-brand"
                        }`} style={{ backgroundColor: time === slot ? brandColor : undefined, borderColor: time === slot ? brandColor : undefined, color: time === slot ? "white" : undefined }}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-brand uppercase tracking-wider mb-1.5" style={{ color: brandColor }}>Observações (opcional)</label>
                  <textarea placeholder="Ex: Sentindo queimação na planta do pé." value={notes} onChange={(e) => setNotes(sanitizeNotesRaw(e.target.value))} onFocus={(e) => e.target.scrollIntoView({ behavior: "smooth", block: "center" })} rows={3} maxLength={500} className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors resize-y min-h-[84px]" style={{ borderColor: brandColor }} />
                </div>

                {canConfirm && (
                  <div className="bg-gradient-to-br from-emerald-50 to-amber-50 border-2 rounded-xl p-4 space-y-2" style={{ borderColor: `${brandColor}4D` }}>
                    <p className="font-serif font-semibold text-brand text-[13px] uppercase tracking-wider" style={{ color: brandColor }}>Resumo do agendamento</p>
                    <div className="flex justify-between text-[14px]"><span className="text-slate-500">Procedimento</span><span className="font-semibold text-slate-800 text-right">{bookedName}</span></div>
                    <div className="flex justify-between text-[14px]"><span className="text-slate-500">Duração</span><span className="font-semibold">{bookedDuration} min</span></div>
                    <div className="flex justify-between text-[14px]"><span className="text-slate-500">Data e horário</span><span className="font-semibold">{summaryDateStr} às {summaryTimeStr}</span></div>
                    <div className="flex justify-between text-[15px] font-bold text-brand pt-2" style={{ borderColor: `${brandColor}33`, color: brandColor }}><span>Valor</span><span className="font-serif text-lg">R$ {bookedPrice.toFixed(2)}</span></div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setCurrentStep(2)} className="flex-none px-5 py-3 rounded-xl border-2 border-slate-200 text-brand font-bold text-sm hover:border-brand transition-colors cursor-pointer min-h-[50px]" style={{ borderColor: brandColor, color: brandColor }}>
                    ← Voltar
                  </button>
                  <button type="button" onClick={handleSimulateBooking} disabled={isLoading || !canConfirm} className="flex-1 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[50px]" style={{ backgroundColor: brandColor }}>
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
                <h2 className="font-serif font-semibold text-brand text-xl mb-2" style={{ color: brandColor }}>Agendamento confirmado!</h2>
                <p className="text-[14px] text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
                  {bookedName} agendado para {summaryDateStr} às {summaryTimeStr}. Você receberá a confirmação pelo WhatsApp em instantes.
                </p>
                <a
                  href={whatsappConfirmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm hover:shadow transition-all text-sm cursor-pointer min-h-[50px] mx-auto"
                >
                  <Send className="w-4 h-4" />
                  Confirmar no WhatsApp
                </a>
                <button type="button" onClick={() => { resetForm(); setCurrentStep(1); setSelectedProcedure(null); setCalendarMonth(new Date()); setSlotPeriod("manha"); }} className="mt-4 w-full text-white font-bold py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2 cursor-pointer min-h-[50px] mx-auto" style={{ backgroundColor: brandColor }}>
                  Fazer novo agendamento
                </button>
              </div>
            )}
          </div>
        </div>

        <Link
          to={`/cliente/${clinicSlug}/consultar`}
          className="group flex items-center gap-3 bg-gradient-to-r from-emerald-100 to-slate-50 hover:from-emerald-200 hover:to-slate-100 border border-emerald-200 hover:border-emerald-300 rounded-2xl px-5 py-4 mt-5 mb-1 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          style={{ borderColor: `${brandColor}4D` }}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors" style={{ backgroundColor: `${brandColor}26` }}>
            <Calendar className="w-5 h-5" style={{ color: brandColor }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-slate-800 leading-tight">
              Já agendou e esqueceu a data?
            </p>
            <p className="text-xs font-semibold mt-0.5 group-hover:underline underline-offset-2" style={{ color: brandColor }}>
              Consultar meu agendamento →
            </p>
          </div>
        </Link>

        <p className="text-[10px] text-slate-400 text-center mt-2">
          © 2026 {clinicConfig.name}. Todos os direitos reservados.
        </p>
      </div>
    </div>

    <AiReceptionistWidget />
    </>
  );
}

function adjustColor(color: string, amount: number): string {
  const usePound = color[0] === "#";
  const col = usePound ? color.slice(1) : color;
  const num = parseInt(col, 16);
  let r = (num >> 16) + amount;
  let g = (num >> 8 & 0x00FF) + amount;
  let b = (num & 0x0000FF) + amount;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return (usePound ? "#" : "") + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}