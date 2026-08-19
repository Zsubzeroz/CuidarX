import React, { useState, useEffect, useRef, useMemo } from "react";
import { Patient, Appointment, ClinicService, ScheduleBlock } from "../types";
import {
  GoogleCalendarEvent,
  buildEventTimeRange,
  buildBlockEventSummary,
  BLOCK_COLOR_ID,
  getEventLocalDate,
} from "../services/googleCalendar";
import { normalizeReason } from "../utils/normalizeReason";
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  User,
  AlertCircle,
  MessageCircle,
  Trash2,
  Pencil,
  Link2,
  Unlink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Bell,
  Send,
  ExternalLink,
  Lock,
  Ban,
  Utensils,
  Stethoscope,
  Plane,
  PartyPopper,
  Layers,
} from "lucide-react";
import { syncPublicScheduleBlocks } from "../services/firestoreService";

interface CalendarViewProps {
  patients: Patient[];
  appointments: Appointment[];
  services?: ClinicService[];
  scheduleBlocks?: ScheduleBlock[];
  onAddAppointment: (appointment: Omit<Appointment, "id">) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onUpdateAppointmentStatus: (id: string, status: Appointment["status"]) => void;
  onDeleteAppointment: (id: string) => void;
  onAddPatient?: (patient: Omit<Patient, "id">) => Promise<string>;
  onAddScheduleBlock?: (block: Omit<ScheduleBlock, "id" | "createdAt">) => void;
  onUpdateScheduleBlock?: (block: ScheduleBlock) => void;
  onDeleteScheduleBlock?: (id: string) => void;
  scheduleFormRequest?: number;
  googleEvents: GoogleCalendarEvent[];
  isGoogleConnected: boolean;
  isGoogleConfigured: boolean;
  isSyncingGoogle?: boolean;
  isConnectingGoogle?: boolean;
  googlePermissionError?: boolean;
  onConnectGoogle: () => void;
  onGoogleLoginBrowser?: () => void;
  onDisconnectGoogle: () => void;
  onSyncGoogleEvents: (date: string) => void;
  onCreateGoogleEvent: (summary: string, description: string, startTime: string, endTime: string, colorId?: string) => Promise<string | null>;
  onUpdateGoogleEvent: (eventId: string, summary: string, description: string, startTime: string, endTime: string) => Promise<boolean>;
  onDeleteGoogleEvent: (eventId: string) => Promise<void>;
  expedienteStart?: string;
  expedienteEnd?: string;
}

interface ScheduleFormProps {
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  editingAppt: Appointment | null;
  patients: Patient[];
  services: ClinicService[];
  servicePrices: Record<string, number>;
  dayHours: string[];
  showNewPatient: boolean;
  newPatientName: string;
  newPatientPhone: string;
  patientId: string;
  date: string;
  time: string;
  price: number;
  quantity: number;
  service: string;
  notes: string;
  onToggleNewPatient: (v: boolean) => void;
  onNewPatientName: (v: string) => void;
  onNewPatientPhone: (v: string) => void;
  onPatientId: (v: string) => void;
  onDate: (v: string) => void;
  onTime: (v: string) => void;
  onPrice: (v: number) => void;
  onQuantity: (v: number) => void;
  onServiceChange: (v: string) => void;
  onNotes: (v: string) => void;
}

// Returns "YYYY-MM-DD" in America/Sao_Paulo timezone (no UTC drift)
const toDateStrBR = (d: Date): string => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(d);
  const y = parts.find(p => p.type === "year")?.value || "0";
  const m = parts.find(p => p.type === "month")?.value || "0";
  const dd = parts.find(p => p.type === "day")?.value || "0";
  return `${y}-${m}-${dd}`;
};
const getTodayBR = () => toDateStrBR(new Date());

// Convert "HH:MM" -> minutes since midnight (NaN if invalid)
const timeToMinutes = (t: string): number => {
  if (!t) return NaN;
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
};

// ── Week view helpers ──
const HOUR_HEIGHT = 64; // px per hour
const DAY_NAMES = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const getWeekDates = (dateStr: string): string[] => {
  const d = new Date(dateStr + "T12:00:00-03:00");
  const day = d.getDay();
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt.toISOString().slice(0, 10);
  });
};

const getWeekLabel = (dates: string[]): string => {
  const start = new Date(dates[0] + "T12:00:00-03:00");
  const end = new Date(dates[6] + "T12:00:00-03:00");
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
};

function getEventPosition(
  startStr: string,
  endStr: string,
  dayStartStr: string = "07:00",
  hourHeight: number = 64
): { top: number; height: number } {
  const toMin = (t: string) => {
    if (!t) return 420;
    let timePart = t;
    if (t.includes("T")) {
      timePart = formatTimeStr(t);
    }
    const [h, m] = timePart.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return 420;
    return h * 60 + m;
  };

  const startMin = toMin(startStr);
  const endMin = toMin(endStr);

  const durationMin = Math.max(30, (isNaN(endMin) || endMin <= startMin) ? startMin + 30 : endMin - startMin);
  const top = Math.max(0, ((startMin - 420) / 60) * hourHeight);
  const height = Math.max(30, (durationMin / 60) * hourHeight);

  return { top, height };
}

const layoutOverlaps = <T extends { start: string; end: string }>(events: T[]): (T & { left: string; width: string })[] => {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const groups = new Map<number, T[]>();
  for (const evt of sorted) {
    const s = timeToMinutes(evt.start);
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s)!.push(evt);
  }
  const result: (T & { left: string; width: string })[] = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      result.push({ ...group[0], left: "0%", width: "100%" });
    } else {
      const total = group.length;
      group.forEach((evt, idx) => {
        result.push({
          ...evt,
          left: `${(idx / total) * 100}%`,
          width: `${(1 / total) * 100 - 1}%`,
        });
      });
    }
  }
  return result;
};

const formatTimeStr = (isoString: string): string => {
  if (!isoString) return "00:00";
  try {
    if (/^\d{2}:\d{2}$/.test(isoString)) return isoString;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.slice(11, 16) || "00:00";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(d);
    let hour = "", minute = "";
    for (const part of parts) {
      if (part.type === "hour") hour = part.value.padStart(2, "0");
      if (part.type === "minute") minute = part.value.padStart(2, "0");
    }
    if (hour && minute) {
      if (hour === "24") hour = "00";
      return `${hour}:${minute}`;
    }
    return isoString.slice(11, 16) || "00:00";
  } catch {
    return isoString.slice(11, 16) || "00:00";
  }
};

const addMinutes = (timeHHMM: string, minutes: number): string => {
  const [h, m] = timeHHMM.split(":").map(Number);
  const total = h * 60 + (m || 0) + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
};

const getEventColors = (
  evt: { status?: string; source?: string; colorId?: string },
  type: "appointment" | "block" | "google",
  view?: "day" | "week"
): { bg: string; border: string; text: string } => {
  if (view === "week") {
    if (type === "block") {
      return { bg: "bg-rose-100", border: "border-l-4 border-rose-600", text: "text-rose-900" };
    }
    if (type === "google") {
      const summary = ((evt as any).summary || "").toLowerCase();
      const isRoutine = /estágio|estagio|almoco|almoço|pilates|bloqueio|feriado|férias|ferias|médico|medico/i.test(summary);
      if (isRoutine) {
        return { bg: "bg-rose-100", border: "border-l-4 border-rose-600", text: "text-rose-900" };
      }
      return { bg: "bg-teal-100", border: "border-l-4 border-teal-600", text: "text-teal-900" };
    }
    if (type === "appointment") {
      return { bg: "bg-teal-100", border: "border-l-4 border-teal-600", text: "text-teal-900" };
    }
  }
  if (type === "block") {
    return { bg: "bg-rose-100", border: "border-l-4 border-rose-500", text: "text-rose-800" };
  }
  if (type === "appointment") {
    switch (evt.status) {
      case "confirmed":
        return { bg: "bg-blue-50", border: "border-l-4 border-blue-500", text: "text-blue-800" };
      case "completed":
        return { bg: "bg-slate-50", border: "border-l-4 border-slate-400", text: "text-slate-500" };
      case "canceled":
        return { bg: "bg-slate-50", border: "border-l-4 border-slate-300", text: "text-slate-400 line-through" };
      default:
        return { bg: "bg-emerald-50", border: "border-l-4 border-emerald-500", text: "text-emerald-800" };
    }
  }
  return { bg: "bg-amber-50", border: "border-l-4 border-amber-400", text: "text-amber-800" };
};

const formatTimeRange = (start: string, end: string): string => {
  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso.slice(11, 16);
    }
  };
  return `${fmt(start)} – ${fmt(end)}`;
};

// Hoisted to module scope: defined OUTSIDE the CalendarView component so its
// type is stable across renders. A nested component would be recreated on every
// render, forcing React to unmount/remount the form and lose input focus.
const ScheduleForm = ({
  onSubmit,
  editingAppt,
  patients,
  services,
  servicePrices,
  dayHours,
  showNewPatient,
  newPatientName,
  newPatientPhone,
  patientId,
  date,
  time,
  price,
  quantity,
  service,
  notes,
  onToggleNewPatient,
  onNewPatientName,
  onNewPatientPhone,
  onPatientId,
  onDate,
  onTime,
  onPrice,
  onQuantity,
  onServiceChange,
  onNotes,
}: ScheduleFormProps) => (
  <form onSubmit={onSubmit} className="space-y-3">
    {editingAppt && (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-[10px] font-bold text-blue-700 flex items-center gap-1.5">
        <Pencil className="w-3 h-3" /> Editando agendamento de {editingAppt.patientName}
      </div>
    )}

    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Paciente:</label>
      {showNewPatient ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newPatientName}
            onChange={(e) => onNewPatientName(e.target.value)}
            placeholder="Nome completo do novo paciente"
            className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
            autoFocus
          />
          <input
            type="tel"
            value={newPatientPhone}
            onChange={(e) => onNewPatientPhone(e.target.value)}
            placeholder="WhatsApp (opcional)"
            className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <button
            type="button"
            onClick={() => onToggleNewPatient(false)}
            className="text-[9px] font-bold text-slate-500 hover:text-slate-700 underline cursor-pointer"
          >
            Selecionar paciente existente
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={patientId}
            onChange={(e) => onPatientId(e.target.value)}
            className="flex-1 text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.isDiabetic ? " (Diabético)" : ""}
              </option>
            ))}
            {editingAppt && !patients.some((p) => p.id === editingAppt.patientId) && (
              <option value={editingAppt.patientId}>{editingAppt.patientName}</option>
            )}
          </select>
          <button
            type="button"
            onClick={() => { onToggleNewPatient(true); onNewPatientName(""); onNewPatientPhone(""); }}
            className="shrink-0 text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-100 transition-all cursor-pointer"
            title="Cadastrar novo paciente"
          >
            + Novo
          </button>
        </div>
      )}
    </div>

    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data:</label>
      <input
        type="date"
        value={date}
        onChange={(e) => onDate(e.target.value)}
        className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </div>

    <div className="grid grid-cols-3 gap-2">
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horário:</label>
        <select
          value={time}
          onChange={(e) => onTime(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
        >
          {dayHours.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor (R$):</label>
        <input
          type="number"
          value={price}
          onChange={(e) => onPrice(Number(e.target.value))}
          className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sessões:</label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onQuantity(Math.max(1, (quantity || 1) - 1))}
            className="w-7 h-8 shrink-0 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold cursor-pointer"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={quantity || 1}
            onChange={(e) => onQuantity(Math.max(1, Number(e.target.value)))}
            className="w-full min-w-0 text-xs bg-slate-50 border border-slate-200 py-2 px-1 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold text-center"
          />
          <button
            type="button"
            onClick={() => onQuantity((quantity || 1) + 1)}
            className="w-7 h-8 shrink-0 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold cursor-pointer"
          >
            +
          </button>
        </div>
      </div>
    </div>

    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serviço / Procedimento:</label>
      <select
        value={service}
        onChange={(e) => onServiceChange(e.target.value)}
        className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
      >
        {services.length > 0 ? (
          services.map((s) => (
            <option key={s.id} value={s.name}>{s.name} (R$ {s.price})</option>
          ))
        ) : (
          Object.keys(servicePrices).map((srv) => (
            <option key={srv} value={srv}>{srv}</option>
          ))
        )}
      </select>
    </div>

    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Observações:</label>
      <textarea
        value={notes}
        onChange={(e) => onNotes(e.target.value)}
        placeholder="Ex: Primeira consulta de espiculotomia..."
        rows={2}
        className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
      />
    </div>

    <button
      type="submit"
      className="w-full text-center text-xs font-bold text-white bg-brand hover:bg-brand-700 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
    >
      {editingAppt ? "Atualizar Agendamento" : "Confirmar Agendamento"}
    </button>
  </form>
);

// ── Current Time Line ──
const CurrentTimeLine: React.FC<{ dayStart: string; hourHeight: number }> = ({ dayStart, hourHeight }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dayStartMin = toMin(dayStart);
  const top = ((nowMin - dayStartMin) / 60) * hourHeight;
  const totalHeight = 13 * hourHeight;
  const visible = top >= 0 && top <= totalHeight;

  if (!visible) return null;
  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1" />
      <div className="h-[2px] bg-red-500 ml-1.5" />
    </div>
  );
};

// ── Day Column (for Week Grid) ──
interface DayColumnProps {
  date: string;
  isToday: boolean;
  hours: string[];
  dayStart: string;
  dayEnd: string;
  hourHeight: number;
  view?: "day" | "week";
  appointments: Appointment[];
  googleEvents: GoogleCalendarEvent[];
  blocks: ScheduleBlock[];
  services: ClinicService[];
  patients: Patient[];
  onSlotClick: (time: string) => void;
  onEditAppointment: (appt: Appointment) => void;
  onDeleteAppointment: (appt: Appointment) => void;
  onStatusChange: (appt: Appointment, status: Appointment["status"]) => void;
  onEditBlock: (block: ScheduleBlock) => void;
  onDeleteBlock: (block: ScheduleBlock) => void;
  onEditGoogleEvent: (ge: GoogleCalendarEvent) => void;
  onDeleteGoogleEvent: (ge: GoogleCalendarEvent) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  date, isToday, hours, dayStart, dayEnd, hourHeight, view,
  appointments, googleEvents, blocks, services, patients,
  onSlotClick, onEditAppointment, onDeleteAppointment, onStatusChange,
  onEditBlock, onDeleteBlock, onEditGoogleEvent, onDeleteGoogleEvent,
}) => {
  const [selectedEvt, setSelectedEvt] = useState<{ type: string; data: any } | null>(null);

  // Filter events for this day
  const dayAppts = appointments.filter((a) => a.date === date);
  const dayGoogle = googleEvents.filter((ge) => getEventLocalDate(ge.start) === date);
  const dayBlocks = blocks.filter((b) => {
    if (b.date === date) return true;
    if (b.recurrence && b.recurrence.frequency !== "none") {
      const d = new Date(date + "T12:00:00-03:00");
      const dow = d.getDay();
      if (b.recurrence.frequency === "diaria") return true;
      if (b.recurrence.frequency === "dias_uteis") return dow >= 1 && dow <= 5;
      if (b.recurrence.daysOfWeek?.includes(dow)) return true;
    }
    return false;
  });

  // ── Deduplication: keep local card, remove Google duplicate ──
  const localCalendarEventIds = new Set<string>();
  dayBlocks.forEach((b) => { if (b.calendarEventId) localCalendarEventIds.add(b.calendarEventId); });
  dayAppts.forEach((a) => { if (a.calendarEventId) localCalendarEventIds.add(a.calendarEventId); });

  const dedupedGoogle = dayGoogle.filter((ge) => {
    if (localCalendarEventIds.has(ge.id)) return false;
    const matchingBlock = dayBlocks.find(
      (b) =>
        !b.calendarEventId &&
        formatTimeStr(ge.start) === b.startTime &&
        formatTimeStr(ge.end) === b.endTime &&
        normalizeReason(ge.summary).includes(normalizeReason(b.reason))
    );
    if (matchingBlock) return false;
    return true;
  });

  // Merge all events for overlap layout
  const allEvents = [
    ...dayBlocks.map((b) => ({
      id: b.id, type: "block" as const, label: b.reason,
      start: b.startTime, end: b.endTime, data: b,
    })),
    ...dedupedGoogle.map((ge) => ({
      id: ge.id, type: "google" as const, label: ge.summary,
      start: formatTimeStr(ge.start), end: formatTimeStr(ge.end), data: ge,
    })),
    ...dayAppts.map((a) => ({
      id: a.id, type: "appointment" as const, label: a.patientName,
      start: a.time, end: addMinutes(a.time, 60), data: a,
    })),
  ];

  // Blocks always full-width background strips; only non-block events share columns
  const blockEvts = allEvents.filter((e) => e.type === "block");
  const nonBlockEvts = allEvents.filter((e) => e.type !== "block");
  const positioned = [
    ...blockEvts.map((e) => ({ ...e, left: "0%", width: "100%" })),
    ...layoutOverlaps(nonBlockEvts),
  ];

  const totalHeight = hours.length * hourHeight;

  return (
    <div className="flex-1 relative border-l border-slate-100 min-w-0">
      {/* Grid lines */}
      {hours.map((hour) => (
        <div
          key={hour}
          className="border-b border-gray-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
          style={{ height: hourHeight / 2 }}
          onClick={() => onSlotClick(hour)}
        />
      ))}

      {/* Events */}
      {positioned.map((evt) => {
        const { top, height } = getEventPosition(evt.start, evt.end, dayStart, hourHeight);
        const colors = getEventColors(evt.data, evt.type, view);
        return (
          <div
            key={`${evt.type}-${evt.id}`}
            className={`absolute z-10 overflow-hidden text-ellipsis whitespace-nowrap p-2 rounded-lg ${colors.bg} ${colors.border} ${colors.text} cursor-pointer hover:shadow-md transition-shadow`}
            style={{ top, height, left: evt.left, width: evt.width, minHeight: 18 }}
            onClick={() => setSelectedEvt({ type: evt.type, data: evt.data })}
          >
            <div className="truncate font-bold">{evt.label}</div>
            {height > 28 && (
              <div className="truncate opacity-70 text-[9px]">
                {evt.start} – {evt.end}
              </div>
            )}
          </div>
        );
      })}

      {/* Current time line */}
      {isToday && <CurrentTimeLine dayStart={dayStart} hourHeight={hourHeight} />}

      {/* Event detail popover */}
      {selectedEvt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvt(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 truncate">{selectedEvt.data.patientName || selectedEvt.data.reason || selectedEvt.data.summary}</h4>
              <button onClick={() => setSelectedEvt(null)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                <XCircle className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            {selectedEvt.type === "appointment" && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600">{selectedEvt.data.service} — R$ {selectedEvt.data.price}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedEvt.data.status !== "confirmed" && (
                    <button onClick={() => { onStatusChange(selectedEvt.data, "confirmed"); setSelectedEvt(null); }} className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer">
                      <CheckCircle2 className="w-3 h-3 inline" /> Confirmar
                    </button>
                  )}
                  {selectedEvt.data.status !== "completed" && (
                    <button onClick={() => { onStatusChange(selectedEvt.data, "completed"); setSelectedEvt(null); }} className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer">
                      <Check className="w-3 h-3 inline" /> Concluir
                    </button>
                  )}
                  <button onClick={() => { onEditAppointment(selectedEvt.data); setSelectedEvt(null); }} className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer">
                    <Pencil className="w-3 h-3 inline" /> Editar
                  </button>
                  <button onClick={() => { onDeleteAppointment(selectedEvt.data); setSelectedEvt(null); }} className="text-[10px] font-bold px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer">
                    <Trash2 className="w-3 h-3 inline" /> Excluir
                  </button>
                </div>
              </div>
            )}
            {selectedEvt.type === "block" && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600">{selectedEvt.data.startTime} – {selectedEvt.data.endTime}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => { onEditBlock(selectedEvt.data); setSelectedEvt(null); }} className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer">
                    <Pencil className="w-3 h-3 inline" /> Editar
                  </button>
                  <button onClick={() => { onDeleteBlock(selectedEvt.data); setSelectedEvt(null); }} className="text-[10px] font-bold px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer">
                    <Trash2 className="w-3 h-3 inline" /> Excluir
                  </button>
                </div>
              </div>
            )}
            {selectedEvt.type === "google" && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-600">{formatTimeRange(selectedEvt.data.start, selectedEvt.data.end)}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => { onEditGoogleEvent(selectedEvt.data); setSelectedEvt(null); }} className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer">
                    <Pencil className="w-3 h-3 inline" /> Editar
                  </button>
                  <button onClick={() => { onDeleteGoogleEvent(selectedEvt.data); setSelectedEvt(null); }} className="text-[10px] font-bold px-2 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer">
                    <Trash2 className="w-3 h-3 inline" /> Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Mobile Month Calendar (iOS-style) ──
interface MobileMonthCalendarProps {
  selectedDate: string;
  todayStr: string;
  onSelectDate: (date: string) => void;
  appointments: Appointment[];
  googleEvents: GoogleCalendarEvent[];
  scheduleBlocks: ScheduleBlock[];
  patients: Patient[];
  onEditAppointment: (appt: Appointment) => void;
  onDeleteAppointment: (appt: Appointment) => void;
  onStatusChange: (appt: Appointment, status: Appointment["status"]) => void;
  onEditGoogleEvent: (ge: GoogleCalendarEvent) => void;
  onDeleteGoogleEvent: (ge: GoogleCalendarEvent) => void;
  onNewAppointment: (date: string) => void;
}

const MONTH_NAMES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEK_DAY_ABBR = ["D","S","T","Q","Q","S","S"];

function getMonthDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Expande bloqueios recorrentes para uma data específica
const expandBlocksForDate = (blocks: ScheduleBlock[], date: string): ScheduleBlock[] => {
  const dateObj = new Date(date + "T12:00:00-03:00");
  const dayOfWeek = dateObj.getDay();

  return blocks.filter((b) => {
    if (b.date === date) return true;
    if (b.recurrence && b.recurrence.frequency !== "none") {
      const { frequency, daysOfWeek } = b.recurrence;
      if (frequency === "diaria") return true;
      if (frequency === "dias_uteis") return dayOfWeek >= 1 && dayOfWeek <= 5;
      if ((frequency === "semanal" || frequency === "personalizada") && daysOfWeek?.length > 0) {
        return daysOfWeek.includes(dayOfWeek);
      }
    }
    return false;
  });
};

const MobileMonthCalendar: React.FC<MobileMonthCalendarProps> = ({
  selectedDate, todayStr, onSelectDate,
  appointments, googleEvents, scheduleBlocks, patients,
  onEditAppointment, onDeleteAppointment, onStatusChange,
  onEditGoogleEvent, onDeleteGoogleEvent, onNewAppointment,
}) => {
  const [viewYear, setViewYear] = useState(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return d.getMonth();
  });

  const cells = useMemo(() => getMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  // Navigate to selected date's month when selectedDate changes
  useEffect(() => {
    const d = new Date(selectedDate + "T12:00:00");
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, []);

  const hasEvents = (dateStr: string): { hasAppt: boolean; hasGoogle: boolean; hasBlock: boolean } => {
    const hasAppt = appointments.some((a) => a.date === dateStr && a.status !== "canceled");
    const dayBlksRaw = expandBlocksForDate(scheduleBlocks, dateStr);
    const seenCalIds = new Set<string>();
    const seenReasons = new Set<string>();
    const dayBlks = dayBlksRaw.filter((b) => {
      if (b.calendarEventId) {
        if (seenCalIds.has(b.calendarEventId)) return false;
        seenCalIds.add(b.calendarEventId);
      }
      const key = normalizeReason(b.reason);
      if (seenReasons.has(key)) return false;
      seenReasons.add(key);
      return true;
    });
    const blockCalIds = new Set<string>();
    dayBlks.forEach((b) => { if (b.calendarEventId) blockCalIds.add(b.calendarEventId); });
    const hasBlock = dayBlks.length > 0;
    const hasGoogle = googleEvents.some((ge) => {
      if (getEventLocalDate(ge.start) !== dateStr) return false;
      if (blockCalIds.has(ge.id)) return false;
      return !dayBlks.some(
        (b) => !b.calendarEventId &&
          normalizeReason(ge.summary).includes(normalizeReason(b.reason))
      );
    });
    return { hasAppt, hasGoogle, hasBlock };
  };

  // Day events list
  const dayAppointments = appointments
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const dayGoogleEvents = googleEvents
    .filter((ge) => getEventLocalDate(ge.start) === selectedDate)
    .sort((a, b) => (a.start || "").localeCompare(b.start || ""));

  const dayBlocksRaw = expandBlocksForDate(scheduleBlocks, selectedDate);

  // Defensive dedup: remove duplicate blocks (same calendarEventId or same date+reason)
  const seenCalIds = new Set<string>();
  const seenKeys = new Set<string>();
  const dayBlocks = dayBlocksRaw.filter((b) => {
    if (b.calendarEventId) {
      if (seenCalIds.has(b.calendarEventId)) return false;
      seenCalIds.add(b.calendarEventId);
    }
    const key = `${selectedDate}-${normalizeReason(b.reason)}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  // Dedup: remove Google events that already exist as Firestore scheduleBlocks or appointments
  const localCalendarEventIds = new Set<string>();
  dayBlocks.forEach((b) => { if (b.calendarEventId) localCalendarEventIds.add(b.calendarEventId); });
  dayAppointments.forEach((a) => { if (a.calendarEventId) localCalendarEventIds.add(a.calendarEventId); });
  const dedupedGoogleEvents = dayGoogleEvents.filter((ge) => {
    if (localCalendarEventIds.has(ge.id)) return false;
    const matchingBlock = dayBlocks.find(
      (b) =>
        !b.calendarEventId &&
        normalizeReason(ge.summary).includes(normalizeReason(b.reason))
    );
    if (matchingBlock) return false;
    return true;
  });

  const selectedDateFormatted = (() => {
    const d = new Date(selectedDate + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  })();

  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
      {/* Month header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => changeMonth(-1)}
          className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-bold text-slate-800">
          {MONTH_NAMES_PT[viewMonth]} {viewYear}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Week day labels */}
      <div className="grid grid-cols-7 px-2 pb-1">
        {WEEK_DAY_ABBR.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 px-2 pb-3 gap-y-1">
        {cells.map((dateStr, idx) => {
          if (!dateStr) return <div key={idx} />;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const dayNum = parseInt(dateStr.slice(8));
          const { hasAppt, hasGoogle, hasBlock } = hasEvents(dateStr);
          const hasAny = hasAppt || hasGoogle || hasBlock;
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`relative flex flex-col items-center py-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? "bg-brand text-white"
                  : isToday
                  ? "bg-brand/10 text-brand"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className={`text-xs font-bold ${isSelected ? "text-white" : isToday ? "text-brand" : "text-slate-800"}`}>
                {dayNum}
              </span>
              {/* Event dots */}
              <div className="flex gap-0.5 mt-0.5 h-1">
                {hasAppt && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-brand"}`} />
                )}
                {hasGoogle && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-gold/80" : "bg-gold"}`} />
                )}
                {hasBlock && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white/60" : "bg-rose-400"}`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 mx-4" />

      {/* Selected day events */}
      <div className="px-4 py-3 space-y-2 max-h-[40vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider capitalize">
            {selectedDateFormatted}
          </h4>
          <button
            onClick={() => onNewAppointment(selectedDate)}
            className="flex items-center gap-1 text-[10px] font-bold text-brand bg-brand/5 hover:bg-brand hover:text-white px-2.5 py-1.5 rounded-lg border border-brand/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3 h-3" />
            Agendar
          </button>
        </div>

        {dayBlocks.map((b) => (
          <div key={b.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-100">
            <div className="w-1 self-stretch rounded-full bg-rose-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-rose-700">{b.reason}</p>
              <p className="text-[10px] text-rose-500">{b.startTime} – {b.endTime}</p>
            </div>
            <span className="text-[9px] font-bold text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded uppercase">Bloqueio</span>
          </div>
        ))}

        {dedupedGoogleEvents.map((ge) => (
          <div key={ge.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
            <div className="w-1 self-stretch rounded-full bg-gold shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-amber-800 truncate">{ge.summary}</p>
              <p className="text-[10px] text-amber-600">
                {formatTimeStr(ge.start)} – {formatTimeStr(ge.end)}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEditGoogleEvent(ge)} className="p-1 rounded-lg bg-white border border-amber-200 text-amber-600 cursor-pointer">
                <Pencil className="w-3 h-3" />
              </button>
              <button onClick={() => onDeleteGoogleEvent(ge)} className="p-1 rounded-lg bg-white border border-rose-200 text-rose-500 cursor-pointer">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {dayAppointments.map((appt) => {
          const p = patients.find((pt) => pt.id === appt.patientId);
          const statusColors: Record<string, string> = {
            confirmed: "bg-blue-50 border-blue-100",
            completed: "bg-slate-50 border-slate-100",
            canceled: "bg-slate-50 border-slate-100 opacity-60",
            scheduled: "bg-emerald-50 border-emerald-100",
          };
          const barColors: Record<string, string> = {
            confirmed: "bg-blue-400",
            completed: "bg-slate-300",
            canceled: "bg-slate-300",
            scheduled: "bg-brand",
          };
          const colorClass = statusColors[appt.status] || statusColors.scheduled;
          const barColor = barColors[appt.status] || barColors.scheduled;
          return (
            <div key={appt.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${colorClass}`}>
              <div className={`w-1 self-stretch rounded-full ${barColor} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[11px] font-bold text-slate-800 truncate">{appt.patientName}</p>
                  {p?.isDiabetic && (
                    <span className="bg-amber-100 text-amber-700 text-[7px] px-1 rounded font-bold uppercase">Diab.</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">{appt.time} · {appt.service}</p>
                <p className="text-[10px] font-bold text-slate-600">R$ {appt.price}</p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {appt.status !== "completed" && appt.status !== "canceled" && (
                  <button
                    onClick={() => onStatusChange(appt, "completed")}
                    className="p-1 rounded-lg bg-white border border-emerald-200 text-emerald-600 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => onEditAppointment(appt)}
                  className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 cursor-pointer active:scale-95"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDeleteAppointment(appt)}
                  className="p-1 rounded-lg bg-white border border-rose-200 text-rose-500 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {dayAppointments.length === 0 && dayGoogleEvents.length === 0 && dayBlocks.length === 0 && (
          <div className="text-center py-6 text-slate-300">
            <Calendar className="w-8 h-8 mx-auto mb-1.5" />
            <p className="text-xs font-medium">Nenhum evento neste dia</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Week Grid ──
interface WeekGridProps {
  weekDates: string[];
  selectedDate: string;
  todayStr: string;
  onSelectDate: (date: string) => void;
  appointments: Appointment[];
  googleEvents: GoogleCalendarEvent[];
  scheduleBlocks: ScheduleBlock[];
  services: ClinicService[];
  patients: Patient[];
  dayHours: string[];
  expedienteStart: string;
  expedienteEnd: string;
  onEditAppointment: (appt: Appointment) => void;
  onDeleteAppointment: (appt: Appointment) => void;
  onStatusChange: (appt: Appointment, status: Appointment["status"]) => void;
  onCreateBlock: (date: string, startTime: string) => void;
  onEditBlock: (block: ScheduleBlock) => void;
  onDeleteBlock: (block: ScheduleBlock) => void;
  onEditGoogleEvent: (ge: GoogleCalendarEvent) => void;
  onDeleteGoogleEvent: (ge: GoogleCalendarEvent) => void;
  onCreateAppointment: (date: string, time: string) => void;
  view?: "day" | "week";
}

const WeekGrid: React.FC<WeekGridProps> = ({
  weekDates, selectedDate, todayStr, onSelectDate,
  appointments, googleEvents, scheduleBlocks, services, patients,
  dayHours, expedienteStart, expedienteEnd,
  onEditAppointment, onDeleteAppointment, onStatusChange,
  onCreateBlock, onEditBlock, onDeleteBlock,
  onEditGoogleEvent, onDeleteGoogleEvent, onCreateAppointment, view,
}) => {
  const hours = dayHours;
  const totalHeight = hours.length * HOUR_HEIGHT;

  return (
    <div className="flex flex-col border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Header — day names */}
      <div className="flex overflow-x-auto border-b border-slate-200 sticky top-0 bg-white z-10 custom-scrollbar">
        <div className="flex min-w-[640px] md:min-w-0 flex-1">
          <div className="w-12 shrink-0 border-r border-slate-100 bg-slate-50/50" />
          {weekDates.map((date, i) => {
            const isToday = date === todayStr;
            const isSelected = date === selectedDate;
            const d = new Date(date + "T12:00:00-03:00");
            return (
              <div
                key={date}
                onClick={() => onSelectDate(date)}
                className={`flex-1 text-center py-2.5 cursor-pointer border-l border-slate-100 transition-all hover:bg-slate-50 ${
                  isSelected ? "bg-brand/5 border-b-2 border-b-brand" : ""
                }`}
              >
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {DAY_NAMES[i]}
                </div>
                <div
                  className={`text-xs md:text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full transition-transform active:scale-95 ${
                    isToday ? "bg-brand text-white shadow-sm" : isSelected ? "bg-slate-200 text-slate-900" : "text-slate-700"
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body — scrollable */}
      <div className="flex overflow-x-auto overflow-y-auto flex-1 custom-scrollbar" style={{ maxHeight: "calc(100vh - 240px)" }}>
        <div className="flex min-w-[640px] md:min-w-0 flex-1">
          {/* Time gutter */}
          <div className="w-12 shrink-0 relative border-r border-slate-100 bg-slate-50/30">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative flex items-start justify-end pr-2"
                style={{ height: HOUR_HEIGHT / 2 }}
              >
                <span className="text-[10px] text-slate-400 font-semibold -mt-2">{hour}</span>
              </div>
            ))}
          </div>

          {/* 7 day columns */}
          {weekDates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              isToday={date === todayStr}
              hours={hours}
              dayStart={expedienteStart}
              dayEnd={expedienteEnd}
              hourHeight={HOUR_HEIGHT}
              view={view || "week"}
              appointments={appointments}
              googleEvents={googleEvents}
              blocks={scheduleBlocks}
              services={services}
              patients={patients}
              onSlotClick={(time) => onCreateAppointment(date, time)}
              onEditAppointment={onEditAppointment}
              onDeleteAppointment={onDeleteAppointment}
              onStatusChange={onStatusChange}
              onEditBlock={onEditBlock}
              onDeleteBlock={onDeleteBlock}
              onEditGoogleEvent={onEditGoogleEvent}
              onDeleteGoogleEvent={onDeleteGoogleEvent}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function CalendarView({
  patients,
  appointments,
  services = [],
  scheduleBlocks = [],
  onAddAppointment,
  onUpdateAppointment,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onAddPatient,
  onAddScheduleBlock,
  onUpdateScheduleBlock,
  onDeleteScheduleBlock,
  scheduleFormRequest = 0,
  googleEvents,
  isGoogleConnected,
  isGoogleConfigured,
  isSyncingGoogle = false,
  isConnectingGoogle = false,
  googlePermissionError = false,
  onConnectGoogle,
  onGoogleLoginBrowser,
  onDisconnectGoogle,
  onSyncGoogleEvents,
  onCreateGoogleEvent,
  onUpdateGoogleEvent,
  onDeleteGoogleEvent,
  expedienteStart = "07:00",
  expedienteEnd = "20:00",
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(getTodayBR());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  const [patientId, setPatientId] = useState(patients[0]?.id || "");
  const [formDate, setFormDate] = useState(getTodayBR());
  const [time, setTime] = useState("09:00");
  const [service, setService] = useState("");
  const [price, setPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [editingGoogleEvent, setEditingGoogleEvent] = useState<GoogleCalendarEvent | null>(null);
  const [geEditSummary, setGeEditSummary] = useState("");
  const [geEditDescription, setGeEditDescription] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [showTomorrowReminders, setShowTomorrowReminders] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [blockDate, setBlockDate] = useState(getTodayBR());
  const [blockStart, setBlockStart] = useState("12:00");
  const [blockEnd, setBlockEnd] = useState("13:30");
  const [blockReason, setBlockReason] = useState("Almoço");
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"diaria" | "semanal" | "dias_uteis" | "personalizada">("diaria");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [calendarView, setCalendarView] = useState<"day" | "week">("week");
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<Appointment | null>(null);
  const [confirmDeleteBlockTarget, setConfirmDeleteBlockTarget] = useState<ScheduleBlock | null>(null);
  const [confirmDeleteGoogleTarget, setConfirmDeleteGoogleTarget] = useState<GoogleCalendarEvent | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const editFormRef = useRef<HTMLDivElement>(null);

  const scrollFormIntoView = () => {
    if (window.innerWidth < 768) return;
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  // Auto-open the schedule form on mobile when requested (Dashboard "Novo Agendamento")
  useEffect(() => {
    if (scheduleFormRequest > 0) {
      resetForm();
      setShowAddForm(true);
      scrollFormIntoView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleFormRequest]);

  // Open block modal with selected date when requested
  useEffect(() => {
    if (showBlockModal) {
      setBlockDate(selectedDate);
    }
  }, [showBlockModal, selectedDate]);

  // Ao trocar de dia (ou atualizar eventos Google), reposiciona o horário do
  // formulário para o primeiro slot realmente livre — nunca deixa um horário
  // bloqueado selecionado como padrão em um novo agendamento.
  useEffect(() => {
    if (editingAppt) return;
    const hours = editingAppt
      ? dayHours
      : dayHours.filter((h) => !getFormBlockForHour(h, getServiceDuration()) && !getGoogleEventForHour(h));
    const first = hours[0];
    if (first && !hours.includes(time)) {
      setTime(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, formDate, googleEvents, scheduleBlocks, service]);

  // Local safety timeout for Google connect spinner (3s max)
  const [localConnecting, setLocalConnecting] = useState(false);
  const connectingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const effectiveConnecting = isConnectingGoogle || localConnecting;

  const handleConnectClick = () => {
    setLocalConnecting(true);
    clearTimeout(connectingTimerRef.current);
    connectingTimerRef.current = setTimeout(() => setLocalConnecting(false), 3000);
    onConnectGoogle();
  };

  useEffect(() => {
    return () => clearTimeout(connectingTimerRef.current);
  }, []);

  const defaultServicePrices: Record<string, number> = {
    "Podopatia Preventiva Geral": 150,
    "Espiculotomia (Unha Encravada)": 180,
    "Órtese FMM / Fibra de Vidro": 120,
    "Laserterapia Terapêutica (660nm)": 100,
    "Tratamento Químico de Verruga": 110,
    "Debridamento de Calosidade": 140,
  };

  const servicePrices = services.length > 0
    ? services.reduce<Record<string, number>>((acc, s) => { acc[s.name] = s.price; return acc; }, {})
    : defaultServicePrices;

  useEffect(() => {
    if (services.length > 0) {
      const activeSrvs = services.filter((s) => s.isActive);
      const firstSrv = activeSrvs[0] || services[0];
      setService(firstSrv.name);
      setPrice(firstSrv.price);
    } else {
      setService("Podopatia Preventiva Geral");
      setPrice(150);
    }
  }, [services]);

  useEffect(() => {
    if (isGoogleConnected) {
      onSyncGoogleEvents(selectedDate);
    }
  }, [selectedDate, isGoogleConnected]);

  // Sync all 7 days of the week when week view is active
  useEffect(() => {
    if (isGoogleConnected && calendarView === "week") {
      const weekDates = getWeekDates(selectedDate);
      weekDates.forEach((d) => onSyncGoogleEvents(d));
    }
  }, [selectedDate, isGoogleConnected, calendarView]);

  const handleServiceChange = (srv: string) => {
    setService(srv);
    if (servicePrices[srv] !== undefined) {
      setPrice(servicePrices[srv]);
    }
  };

  const resetForm = () => {
    setPatientId(patients[0]?.id || "");
    setFormDate(selectedDate);
    setTime("09:00");
    setNotes("");
    setQuantity(1);
    setEditingAppt(null);
    setShowNewPatient(false);
    setNewPatientName("");
    setNewPatientPhone("");
    if (services.length > 0) {
      const activeSrvs = services.filter((s) => s.isActive);
      const firstSrv = activeSrvs[0] || services[0];
      setService(firstSrv.name);
      setPrice(firstSrv.price);
    }
  };

  const getServiceDuration = (): number => {
    const srv = services.find((s) => s.name === service);
    if (srv?.duration && srv.duration > 0) return srv.duration;
    return price > 150 ? 60 : 45;
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) { alert("Selecione uma data."); return; }
    if (!time) { alert("Selecione um horário."); return; }
    if (!service) { alert("Selecione um serviço."); return; }

    // BLOQUEIO RÍGIDO: nenhum agendamento pode cair sobre evento do Google Agenda ou bloqueio.
    const [sh, sm] = time.split(":").map(Number);
    const apptStartMin = sh * 60 + sm;
    const apptEndMin = apptStartMin + getServiceDuration();

    const dayGoogleEvents = googleEvents.filter((ge) => getEventLocalDate(ge.start) === formDate);
    const conflictingGoogleEvent = dayGoogleEvents.find((ge) => {
      if (editingAppt && editingAppt.calendarEventId === ge.id) return false;
      const geStart = timeToMinutes(formatGoogleTime(ge.start));
      const geEnd = timeToMinutes(formatGoogleTime(ge.end));
      if (isNaN(geStart) || geEnd <= geStart) return false;
      return apptStartMin < geEnd && apptEndMin > geStart;
    });
    if (conflictingGoogleEvent) {
      alert(`Este horário coincide com o evento do Google Agenda "${conflictingGoogleEvent.summary}" (${formatGoogleTime(conflictingGoogleEvent.start)} - ${formatGoogleTime(conflictingGoogleEvent.end)}). Escolha outro horário.`);
      return;
    }

    const formDayBlocks = expandBlocksForDate(scheduleBlocks, formDate);
    const conflictingBlock = formDayBlocks.find((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      if (isNaN(bStart)) return false;
      return apptStartMin < bEnd && apptEndMin > bStart;
    });
    if (conflictingBlock) {
      alert(`Este horário está dentro do bloqueio "${conflictingBlock.reason}" (${conflictingBlock.startTime} - ${conflictingBlock.endTime}).`);
      return;
    }

    let resolvedPatientId = patientId;
    let resolvedPatientName = "";

    if (showNewPatient) {
      if (!newPatientName.trim()) { alert("Informe o nome do novo paciente."); return; }
      const patientData: Omit<Patient, "id"> = {
        name: newPatientName.trim(),
        phone: newPatientPhone.trim(),
        dob: "",
        gender: "Feminino",
        isDiabetic: false,
        hasCirculatoryIssues: false,
        isSmoker: false,
        hasAllergies: "Nenhuma",
        observations: "Paciente cadastrado durante agendamento.",
        footIssues: [],
        evolutions: [],
        createdAt: new Date().toISOString(),
      };
      if (onAddPatient) {
        // O hook gera e persiste o id real do paciente; usá-lo no agendamento
        resolvedPatientId = await onAddPatient(patientData);
      } else {
        resolvedPatientId = `pat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      }
      resolvedPatientName = newPatientName.trim();
    } else {
      const patientObj = patients.find((p) => p.id === patientId);
      if (patientObj) {
        resolvedPatientName = patientObj.name;
      } else if (editingAppt) {
        resolvedPatientId = editingAppt.patientId;
        resolvedPatientName = editingAppt.patientName;
      } else {
        return;
      }
    }

    if (editingAppt) {
      const updatedAppt: Appointment = {
        ...editingAppt,
        patientId: resolvedPatientId,
        patientName: resolvedPatientName,
        date: formDate,
        time,
        service,
        price,
        notes,
        quantity,
      };
      await onUpdateAppointment(updatedAppt);

      if (editingAppt.calendarEventId && isGoogleConnected) {
        const { start: dtStart, end: dtEnd } = buildEventTimeRange(formDate, time, getServiceDuration());
        await onUpdateGoogleEvent(editingAppt.calendarEventId, `${service} - ${resolvedPatientName}`, notes || "", dtStart, dtEnd);
        onSyncGoogleEvents(formDate);
      }
    } else {
      const { start: dtStart, end: dtEnd } = buildEventTimeRange(formDate, time, getServiceDuration());

      let calendarEventId: string | undefined = undefined;
      if (isGoogleConnected) {
        const result = await onCreateGoogleEvent(
          `${service} - ${resolvedPatientName}`,
          notes || `Agendamento via Podologia Fabrícia - ${resolvedPatientName}`,
          dtStart,
          dtEnd
        );
        if (result) calendarEventId = result;
      }

      await onAddAppointment({
        patientId: resolvedPatientId,
        patientName: resolvedPatientName,
        date: formDate,
        time,
        service,
        price,
        status: "scheduled",
        notes,
        quantity,
        calendarEventId,
      });
    }

    resetForm();
    setShowAddForm(false);
  };

  const handleEditAppointment = (appt: Appointment) => {
    setEditingAppt(appt);
    setPatientId(appt.patientId);
    setFormDate(appt.date);
    setTime(appt.time);
    setService(appt.service);
    setPrice(appt.price);
    setNotes(appt.notes || "");
    setQuantity(appt.quantity || 1);
    setShowNewPatient(false);
    setShowAddForm(true);
    scrollFormIntoView();
  };

  const handleDelete = async (appt: Appointment) => {
    setConfirmDeleteTarget(appt);
  };

  const confirmDeleteAppointment = async () => {
    const appt = confirmDeleteTarget;
    if (!appt) return;
    setConfirmDeleteTarget(null);
    try {
      await onDeleteAppointment(appt.id);
      setFeedback({ type: "success", message: `Agendamento de ${appt.patientName} excluído` });
    } catch (err) {
      console.error("Erro ao excluir agendamento do Firestore:", err);
      setFeedback({ type: "error", message: "Erro ao excluir agendamento" });
    }
    if (appt.calendarEventId) {
      try {
        await onDeleteGoogleEvent(appt.calendarEventId);
      } catch (err) {
        console.error("Erro ao excluir evento do Google Calendar:", err);
      }
    }
  };

  const handleDeleteGoogleEventFn = async (ge: GoogleCalendarEvent) => {
    setConfirmDeleteGoogleTarget(ge);
  };

  const confirmDeleteGoogleEvent = async () => {
    const ge = confirmDeleteGoogleTarget;
    if (!ge) return;
    setConfirmDeleteGoogleTarget(null);
    await onDeleteGoogleEvent(ge.id);
    onSyncGoogleEvents(selectedDate);
  };

  const handleStartEditGoogleEvent = (ge: GoogleCalendarEvent) => {
    setEditingGoogleEvent(ge);
    setGeEditSummary(ge.summary);
    setGeEditDescription(ge.description || "");
  };

  const handleSaveGoogleEvent = async () => {
    if (!editingGoogleEvent) return;
    await onUpdateGoogleEvent(
      editingGoogleEvent.id,
      geEditSummary,
      geEditDescription,
      editingGoogleEvent.startTimeRaw,
      editingGoogleEvent.endTimeRaw
    );
    setEditingGoogleEvent(null);
    onSyncGoogleEvents(selectedDate);
  };

  const handleCancelEditGoogleEvent = () => {
    setEditingGoogleEvent(null);
  };

  const STATUS_LABELS: Record<Appointment["status"], string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    completed: "Concluído",
    canceled: "Cancelado",
  };

  const STATUS_ICONS: Record<Appointment["status"], string> = {
    scheduled: "🕐",
    confirmed: "✅",
    completed: "✔️",
    canceled: "✖️",
  };

  const stripStatusPrefix = (summary: string) => {
    return summary.replace(/^(✅|✔️|✖️|🕐)\s*/, "").trim();
  };

  const handleStatusChange = async (appt: Appointment, newStatus: Appointment["status"]) => {
    try {
      await onUpdateAppointmentStatus(appt.id, newStatus);

      if (appt.calendarEventId && isGoogleConnected) {
        const existingGe = googleEvents.find((ge) => ge.id === appt.calendarEventId);
        const baseSummary = stripStatusPrefix(
          existingGe?.summary || `${appt.service} - ${appt.patientName}`
        );
        const baseDescription = (existingGe?.description || appt.notes || "")
          .replace(/^Status: .*\n?/, "")
          .trim();

        const { start, end } =
          existingGe?.startTimeRaw && existingGe?.endTimeRaw
            ? { start: existingGe.startTimeRaw, end: existingGe.endTimeRaw }
            : buildEventTimeRange(appt.date, appt.time, appt.price > 150 ? 60 : 45);

        const newSummary = `${STATUS_ICONS[newStatus]} ${baseSummary}`;
        const statusLine = `Status: ${STATUS_LABELS[newStatus]}`;
        const newDescription = baseDescription ? `${statusLine}\n${baseDescription}` : statusLine;

        await onUpdateGoogleEvent(appt.calendarEventId, newSummary, newDescription, start, end);
        onSyncGoogleEvents(selectedDate);
      }

      setFeedback({ type: "success", message: `${appt.patientName}: ${STATUS_LABELS[newStatus]}` });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      setFeedback({ type: "error", message: "Erro ao atualizar o status" });
    }
  };

  const getBlockDurationMinutes = (): number => {
    const startT = blockAllDay ? "00:00" : blockStart;
    const endT = blockAllDay ? "23:59" : blockEnd;
    const [sh, sm] = startT.split(":").map(Number);
    const [eh, em] = endT.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddScheduleBlock && !onUpdateScheduleBlock) return;
    if (!blockDate) { alert("Selecione a data do bloqueio."); return; }

    const startTime = blockAllDay ? "00:00" : blockStart;
    const endTime = blockAllDay ? "23:59" : blockEnd;
    const durationMin = getBlockDurationMinutes();
    if (durationMin <= 0) { alert("O horário final deve ser depois do inicial."); return; }

    const reason = blockReason.trim() || "Bloqueio";
    const { start: dtStart, end: dtEnd } = buildEventTimeRange(blockDate, startTime, durationMin);

    try {
      if (editingBlock) {
        let calendarEventId = editingBlock.calendarEventId;
        if (isGoogleConnected) {
          if (calendarEventId) {
            try {
              await onUpdateGoogleEvent(calendarEventId, buildBlockEventSummary(reason), `Bloqueio criado no app · ${reason}`, dtStart, dtEnd);
            } catch (err) {
              console.error("Erro ao atualizar bloqueio no Google Calendar:", err);
            }
          } else {
            const newId = await onCreateGoogleEvent(
              buildBlockEventSummary(reason),
              `Bloqueio criado no app · ${reason}`,
              dtStart,
              dtEnd,
              BLOCK_COLOR_ID
            );
            if (newId) calendarEventId = newId;
          }
        }
        await onUpdateScheduleBlock?.({
          ...editingBlock,
          date: blockDate,
          startTime,
          endTime,
          reason,
          calendarEventId,
          recurrence: isRecurring ? { frequency, daysOfWeek: frequency === 'dias_uteis' ? [1,2,3,4,5] : selectedDays } : { frequency: 'none' as const, daysOfWeek: [] },
        });
        setFeedback({ type: "success", message: `Bloqueio atualizado: ${reason}` });
      } else {
        let calendarEventId: string | undefined = undefined;
        if (isGoogleConnected) {
          const result = await onCreateGoogleEvent(
            buildBlockEventSummary(reason),
            `Bloqueio criado no app · ${reason}`,
            dtStart,
            dtEnd,
            BLOCK_COLOR_ID
          );
          if (result) calendarEventId = result;
        }
        await onAddScheduleBlock?.({
          date: blockDate,
          startTime,
          endTime,
          reason,
          calendarEventId,
          recurrence: isRecurring ? { frequency, daysOfWeek: frequency === 'dias_uteis' ? [1,2,3,4,5] : selectedDays } : { frequency: 'none' as const, daysOfWeek: [] },
        });
        setFeedback({ type: "success", message: `Horário bloqueado: ${reason}` });
      }
    } catch (err) {
      console.error("Erro ao salvar bloqueio:", err);
      setFeedback({ type: "error", message: "Erro ao salvar bloqueio" });
    }

    setShowBlockModal(false);
    setEditingBlock(null);
    setBlockAllDay(false);
    setIsRecurring(false);
    setFrequency("diaria");
    setSelectedDays([]);
  };

  const handleEditBlock = (block: ScheduleBlock) => {
    setEditingBlock(block);
    setBlockDate(block.date);
    setBlockStart(block.startTime === "00:00" ? "12:00" : block.startTime);
    setBlockEnd(block.endTime === "23:59" ? "13:30" : block.endTime);
    setBlockReason(block.reason);
    setBlockAllDay(block.startTime === "00:00" && block.endTime === "23:59");
    if (block.recurrence && block.recurrence.frequency !== "none") {
      setIsRecurring(true);
      setFrequency(block.recurrence.frequency as any);
      setSelectedDays(block.recurrence.daysOfWeek || []);
    } else {
      setIsRecurring(false);
      setFrequency("diaria");
      setSelectedDays([]);
    }
    setShowBlockModal(true);
  };

  const handleDeleteBlock = async (block: ScheduleBlock) => {
    setConfirmDeleteBlockTarget(block);
  };

  const confirmDeleteBlock = async () => {
    const block = confirmDeleteBlockTarget;
    if (!block) return;
    setConfirmDeleteBlockTarget(null);
    try {
      if (block.calendarEventId && isGoogleConnected) {
        try {
          await onDeleteGoogleEvent(block.calendarEventId);
        } catch (err) {
          console.error("Erro ao excluir bloqueio do Google Calendar:", err);
        }
      }
      await onDeleteScheduleBlock?.(block.id);
      setFeedback({ type: "success", message: "Bloqueio removido" });
    } catch (err) {
      console.error("Erro ao excluir bloqueio:", err);
      setFeedback({ type: "error", message: "Erro ao excluir bloqueio" });
    }
  };

  const dayBlocks = expandBlocksForDate(scheduleBlocks, selectedDate);
  const formDayBlocks = expandBlocksForDate(scheduleBlocks, formDate);

  const getBlockForHour = (hour: string) => {
    const [sh, sm] = hour.split(":").map(Number);
    const slotMin = sh * 60 + sm;
    return dayBlocks.find((b) => {
      const [bh, bm] = b.startTime.split(":").map(Number);
      const [eh, em] = b.endTime.split(":").map(Number);
      const bStart = bh * 60 + bm;
      const bEnd = eh * 60 + em;
      return slotMin >= bStart && slotMin < bEnd;
    });
  };

  const getFormBlockForHour = (hour: string, durationMin: number = 30) => {
    const [sh, sm] = hour.split(":").map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = slotStart + durationMin;
    return formDayBlocks.find((b) => {
      const [bh, bm] = b.startTime.split(":").map(Number);
      const [eh, em] = b.endTime.split(":").map(Number);
      const bStart = bh * 60 + bm;
      const bEnd = eh * 60 + em;
      return slotStart < bEnd && slotEnd > bStart;
    });
  };

  const formatGoogleTime = (isoString: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString.slice(11, 16);
    }
  };

  const dayHours = useMemo(() => {
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return (isNaN(h) ? 7 : h) * 60 + (isNaN(m) ? 0 : m);
    };
    const startMin = toMinutes(expedienteStart || "07:00");
    const endMin = toMinutes(expedienteEnd || "20:00");
    const hours: string[] = [];
    for (let min = startMin; min < endMin; min += 30) {
      const hh = String(Math.floor(min / 60)).padStart(2, "0");
      const mm = String(min % 60).padStart(2, "0");
      hours.push(`${hh}:${mm}`);
    }
    return hours;
  }, [expedienteStart, expedienteEnd]);

  const dailyAppointments = appointments.filter((a) => a.date === selectedDate);

  const changeDate = (days: number) => {
    const current = new Date(selectedDate + "T12:00:00-03:00");
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const formatDateBR = (dateStr: string) => {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR");
    } catch { return dateStr; }
  };

  // Official Google Calendar embed (100% fidelity with Google Agenda web)
  const formatPhoneForWa = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("55")) return digits;
    return `55${digits}`;
  };

  const buildWhatsAppConfirmUrl = (name: string, phone: string, date: string, time: string) => {
    const msg = `Olá ${name}! Confirmando sua consulta de Podologia com a Dra. Fabrícia Rodrigues amanhã, ${formatDateBR(date)} às ${time}. Podemos confirmar? Responda com SIM.`;
    return `https://wa.me/${formatPhoneForWa(phone)}?text=${encodeURIComponent(msg)}`;
  };

  const buildWhatsAppDetailsUrl = (name: string, phone: string, date: string, time: string, service: string, price: number) => {
    const msg = `*Clínica Dra. Fabrícia Rodrigues* 🐾\n\nOlá *${name}*! Aqui estão os detalhes da sua consulta:\n\n📅 *Data:* ${formatDateBR(date)}\n🕒 *Horário:* ${time}\n📍 *Procedimento:* ${service}\n💰 *Valor:* R$ ${price}\n\n_Qualquer dúvida, estamos à disposição!_ 😊`;
    return `https://wa.me/${formatPhoneForWa(phone)}?text=${encodeURIComponent(msg)}`;
  };

  const getTomorrowDateStr = () => {
    const d = new Date(getTodayBR() + "T12:00:00-03:00");
    d.setDate(d.getDate() + 1);
    return toDateStrBR(d);
  };

  const tomorrowAppointments = appointments.filter((a) => a.date === getTomorrowDateStr() && a.status !== "canceled");
  
  const getApptPhone = (appt: Appointment): string | undefined => {
    const p = patients.find((pt) => pt.id === appt.patientId);
    if (p?.phone) return p.phone;
    if ((appt as any).patientPhone) return (appt as any).patientPhone;
    if ((appt as any).phone) return (appt as any).phone;
    return undefined;
  };
  
  const tomorrowPatientsWithPhone = tomorrowAppointments.filter((a) => {
    return !!getApptPhone(a);
  });

  const getApptForHour = (hour: string) => {
    const [sh, sm] = hour.split(":").map(Number);
    const slotMinutes = sh * 60 + sm;
    return dailyAppointments.find((a) => {
      if (!a.time) return false;
      const [ah, am] = a.time.split(":").map(Number);
      const apptMinutes = ah * 60 + am;
      return apptMinutes >= slotMinutes && apptMinutes < slotMinutes + 30;
    });
  };

  const getGoogleEventForHour = (hour: string) => {
    if (!isGoogleConnected) return undefined;
    const [sh, sm] = hour.split(":").map(Number);
    const slotStart = sh * 60 + sm;
    const slotEnd = slotStart + 30;
    const dayGoogleEvents = googleEvents.filter((ge) => getEventLocalDate(ge.start) === formDate);
    // Bloqueio RÍGIDO: o evento ocupa QUALQUER slot com sobreposição real de intervalo
    // (ex.: "Estágio 07:00–12:00" bloqueia 07:00, 07:30, ..., 11:30 — não apenas o início).
    return dayGoogleEvents.find((ge) => {
      const geStart = timeToMinutes(formatGoogleTime(ge.start));
      const geEnd = timeToMinutes(formatGoogleTime(ge.end));
      if (isNaN(geStart)) return false;
      if (geEnd <= geStart) return false; // all-day ou horário inválido não ocupa slot
      return slotStart < geEnd && slotEnd > geStart;
    });
  };

  // True quando o horário de início do evento Google cai DENTRO deste slot
  // (usado para diferenciar o slot inicial — que mostra o card completo — dos
  // slots de continuação, que são exibidos como horário bloqueado).
  const googleEventStartsInSlot = (googleEvt: GoogleCalendarEvent | undefined, hour: string): boolean => {
    if (!googleEvt) return false;
    const [sh, sm] = hour.split(":").map(Number);
    const slotStart = sh * 60 + sm;
    const geStart = timeToMinutes(formatGoogleTime(googleEvt.start));
    if (isNaN(geStart)) return false;
    return geStart >= slotStart && geStart < slotStart + 30;
  };

  // True quando o horário de início do BLOQUEIO cai DENTRO deste slot
  const blockStartsInSlot = (block: ScheduleBlock | undefined, hour: string): boolean => {
    if (!block) return false;
    const [sh, sm] = hour.split(":").map(Number);
    const slotStart = sh * 60 + sm;
    const [bh, bm] = block.startTime.split(":").map(Number);
    const blockStart = bh * 60 + bm;
    return blockStart >= slotStart && blockStart < slotStart + 30;
  };

  // Calcula altura mínima do card baseada na duração em minutos (30min = 80px)
  const getSlotHeight = (durationMin: number): string => {
    const units = Math.max(1, Math.round(durationMin / 30));
    return `${units * 80}px`;
  };

  const matchedApptIds = new Set<string>();
  dailyAppointments.forEach((a) => {
    if (!a.time) return;
    const [ah, am] = a.time.split(":").map(Number);
    const apptMinutes = ah * 60 + am;
    const matched = dayHours.some((h) => {
      const [sh, sm] = h.split(":").map(Number);
      const slotMin = sh * 60 + sm;
      return apptMinutes >= slotMin && apptMinutes < slotMin + 30;
    });
    if (matched) matchedApptIds.add(a.id);
  });
  const overflowAppointments = dailyAppointments.filter((a) => !matchedApptIds.has(a.id));

  const dayGoogleEventCount = googleEvents.filter((ge) => getEventLocalDate(ge.start) === selectedDate).length;
  const dayGoogleIds = useMemo(
    () => googleEvents.filter((ge) => getEventLocalDate(ge.start) === selectedDate).map((ge) => ge.id),
    [googleEvents, selectedDate]
  );
  const unlinkedAppts = dailyAppointments.filter((a) => !a.calendarEventId || !dayGoogleIds.length);

  // Horários realmente livres para novos agendamentos (sem eventos Google nem bloqueios).
  // Ao editar, mantém todos para preservar o horário atual do agendamento.
  const availableHours = editingAppt
    ? dayHours
    : dayHours.filter((h) => !getFormBlockForHour(h, getServiceDuration()) && !getGoogleEventForHour(h));
  const formDayHours = availableHours.length >= 1 ? availableHours : dayHours;

  const ScheduleFormElement = (
    <ScheduleForm
      onSubmit={handleScheduleSubmit}
      editingAppt={editingAppt}
      patients={patients}
      services={services}
      servicePrices={servicePrices}
      dayHours={formDayHours}
      showNewPatient={showNewPatient}
      newPatientName={newPatientName}
      newPatientPhone={newPatientPhone}
      patientId={patientId}
      date={formDate}
      time={time}
      price={price}
      quantity={quantity}
      service={service}
      notes={notes}
      onToggleNewPatient={setShowNewPatient}
      onNewPatientName={setNewPatientName}
      onNewPatientPhone={setNewPatientPhone}
      onPatientId={setPatientId}
      onDate={setFormDate}
      onTime={setTime}
      onPrice={setPrice}
      onQuantity={setQuantity}
      onServiceChange={handleServiceChange}
      onNotes={setNotes}
    />
  );

  return (
    <>
      <div id="calendar-tab" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
      {/* Status feedback toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white page-enter ${feedback.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {feedback.message}
        </div>
      )}

      {/* Confirm Delete Appointment Modal */}
      {confirmDeleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmDeleteTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteTarget(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-xl">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Excluir Agendamento</h3>
                  <p className="text-[10px] text-slate-500">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Tem certeza que deseja excluir o agendamento de <strong>{confirmDeleteTarget.patientName}</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteTarget(null)}
                  className="flex-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteAppointment}
                  className="flex-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirm Delete Block Modal */}
      {confirmDeleteBlockTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmDeleteBlockTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteBlockTarget(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-xl">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Excluir Bloqueio</h3>
                  <p className="text-[10px] text-slate-500">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Tem certeza que deseja excluir o bloqueio <strong>"{confirmDeleteBlockTarget.reason}"</strong>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteBlockTarget(null)}
                  className="flex-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteBlock}
                  className="flex-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {confirmDeleteGoogleTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmDeleteGoogleTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteGoogleTarget(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-xl">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Excluir Evento Google</h3>
                  <p className="text-[10px] text-slate-500">Esta ação não pode ser desfeita.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Tem certeza que deseja excluir o evento <strong>"{confirmDeleteGoogleTarget.summary}"</strong> do Google Agenda?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDeleteGoogleTarget(null)}
                  className="flex-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteGoogleEvent}
                  className="flex-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* LEFT: Google status + Schedule form (desktop & tablet) */}
        <div className="hidden md:block md:col-span-5 lg:col-span-4 space-y-6 order-2 lg:order-1">
          {/* Google Calendar Status — simplified */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gold" />
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Google Agenda</span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${isGoogleConnected ? "bg-emerald-500" : "bg-slate-300"}`} />
              <span className="text-[11px] text-slate-600">
                {isGoogleConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>

            {isGoogleConfigured ? (
              isGoogleConnected ? (
                googlePermissionError ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-amber-600">Permissão negada. Verifique a conta Google.</p>
                    <button
                      onClick={onGoogleLoginBrowser}
                      className="w-full text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 py-2 rounded-xl border border-amber-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Alternar Conta
                    </button>
                    <button
                      onClick={onDisconnectGoogle}
                      className="w-full text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 py-2 rounded-xl border border-rose-100 cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      <Unlink className="w-3 h-3" /> Desconectar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onDisconnectGoogle}
                    className="w-full text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 py-2 rounded-xl border border-rose-100 cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <Unlink className="w-3 h-3" /> Desconectar
                  </button>
                )
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleConnectClick}
                    disabled={effectiveConnecting}
                    className="w-full text-[10px] font-bold text-white bg-brand hover:bg-brand-700 py-2 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {effectiveConnecting ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Conectando...</>
                    ) : (
                      <><Link2 className="w-3.5 h-3.5" /> Conectar Google Agenda</>
                    )}
                  </button>
                  {onGoogleLoginBrowser && (
                    <button
                      onClick={onGoogleLoginBrowser}
                      className="w-full text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 py-2 rounded-xl border border-slate-100 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Login via Navegador
                    </button>
                  )}
                </div>
              )
            ) : (
              <p className="text-[10px] text-slate-400 text-center">
                Configure VITE_GOOGLE_CALENDAR_CLIENT_ID no .env
              </p>
            )}
          </div>

        <div ref={editFormRef} className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all duration-300 scroll-mt-24 ${
          editingAppt
            ? "border-blue-400 ring-2 ring-blue-400/50 shadow-lg"
            : "border-slate-100 dark:border-slate-800 shadow-sm"
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gold" />
              {editingAppt ? "Editar Agendamento" : "Novo Agendamento"}
            </h3>
            {patients.length === 0 && (
              <span className="text-[9px] text-rose-500 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                Sem pacientes
              </span>
            )}
          </div>

          {patients.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 p-4 rounded-xl text-center text-xs text-slate-400">
              <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              Cadastre ao menos um paciente para agendar.
            </div>
          ) : (
            ScheduleFormElement
          )}
        </div>
      </div>

      {/* RIGHT: Hourly agenda */}
      <div className="md:col-span-7 lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left order-1 lg:order-2">
        {/* View toggle + Today button + Date navigation (desktop only) */}
        <div className="hidden md:flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-800 min-w-[140px] text-center">
              {calendarView === "week"
                ? getWeekLabel(getWeekDates(selectedDate))
                : formatDateBR(selectedDate)}
            </h3>
            <button
              onClick={() => changeDate(1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(getTodayBR())}
              className="ml-2 px-3 py-1 text-[11px] font-bold text-brand border border-brand/20 rounded-lg hover:bg-brand/5 cursor-pointer"
            >
              Hoje
            </button>
          </div>
          <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setCalendarView("day")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition cursor-pointer ${
                calendarView === "day"
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setCalendarView("week")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition cursor-pointer ${
                calendarView === "week"
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Semana
            </button>
          </div>
        </div>

        {/* Mobile Google status bar */}
        <div className="md:hidden mb-4">
          {isGoogleConnected && googlePermissionError ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Conta sem permissão. Use <strong>fabriciapodologa@gmail.com</strong>.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onGoogleLoginBrowser}
                  className="flex-1 text-[9px] font-bold text-white bg-amber-600 hover:bg-amber-700 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Alternar Conta
                </button>
                <button
                  onClick={onDisconnectGoogle}
                  className="text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded-lg border border-rose-100 cursor-pointer transition-all"
                >
                  Desconectar
                </button>
              </div>
            </div>
          ) : isGoogleConnected ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700">Google Agenda Conectado</span>
              </div>
              <button
                onClick={() => onSyncGoogleEvents(selectedDate)}
                disabled={isSyncingGoogle}
                className="text-[9px] font-bold text-gold bg-white px-2 py-1 rounded-lg border border-emerald-200 cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingGoogle ? "animate-spin" : ""}`} />
                Sync
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl p-2.5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-amber-700">Google Desconectado</span>
                <button
                  onClick={onGoogleLoginBrowser}
                  className="text-[8px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 w-fit"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> Login via Chrome
                </button>
              </div>
              <button
                onClick={handleConnectClick}
                disabled={effectiveConnecting}
                className="text-[9px] font-bold text-white bg-blue-600 px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1 disabled:opacity-60"
              >
                {effectiveConnecting ? (
                  <><RefreshCw className="w-3 h-3 animate-spin" /> ...</>
                ) : (
                  <><Link2 className="w-3 h-3" /> Conectar</>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Agenda do Dia
          </h3>
          <div className="flex items-center gap-2">
            {isGoogleConnected && dayGoogleEventCount > 0 && (
              <span className="text-[9px] text-gold bg-gold-subtle px-2 py-0.5 rounded-full font-bold border border-gold/20">
                {dayGoogleEventCount} Google
              </span>
            )}
            <span className="text-xs text-gold bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              {dailyAppointments.length} local(is)
            </span>
          </div>
        </div>

        {/* Lembretes de Amanhã */}
        <div className="mb-4 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => { setEditingBlock(null); setShowBlockModal(true); }}
              className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold text-xs py-3 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Lock className="w-4 h-4 text-rose-500" />
              Bloquear Horário
            </button>
            <button
              onClick={async () => {
                try {
                  const result = await syncPublicScheduleBlocks();
                  alert(`Sincronização concluída!\n${result.written} horários sincronizados.\n${result.deleted} registros obsoletos removidos.`);
                } catch (err: any) {
                  alert(`Falha na sincronização: ${err.message}`);
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 font-bold text-xs py-3 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-500" />
              Sincronizar Portal
            </button>
            <button
              onClick={() => setShowTomorrowReminders(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0F3B2E]/5 to-[#0A2B21]/5 hover:from-[#0F3B2E] hover:to-[#0A2B21] text-emerald-800 hover:text-white font-bold text-xs py-3 rounded-xl border border-[#C8A45A]/20 hover:border-[#C8A45A]/50 transition-all shadow-sm hover:shadow-md cursor-pointer group"
            >
              <Bell className="w-4 h-4 text-[#C8A45A] group-hover:text-[#C8A45A]" />
              Lembretes de Amanhã ({tomorrowAppointments.length})
            </button>
          </div>
        </div>

        {/* Bloquear Horário Modal */}
        {showBlockModal && (
          <>
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowBlockModal(false); setEditingBlock(null); }} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowBlockModal(false); setEditingBlock(null); }}>
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="bg-brand text-white p-5 rounded-t-3xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-5 h-5 text-gold" />
                    <div>
                      <h3 className="text-sm font-bold">{editingBlock ? "Editar Bloqueio" : "Bloquear Horário"}</h3>
                      <p className="text-[10px] text-gold/70">{new Date(blockDate + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowBlockModal(false); setEditingBlock(null); }} className="text-white/70 hover:text-white p-1 cursor-pointer">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateBlock} className="p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Motivo do Bloqueio</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Almoço", icon: Utensils, reason: "Almoço" },
                        { label: "Médico", icon: Stethoscope, reason: "Médico" },
                        { label: "Férias", icon: Plane, reason: "Férias" },
                        { label: "Feriado", icon: PartyPopper, reason: "Feriado" },
                      ].map((preset) => {
                        const PresetIcon = preset.icon;
                        return (
                          <button
                            key={preset.reason}
                            type="button"
                            onClick={() => setBlockReason(preset.reason)}
                            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              blockReason === preset.reason
                                ? "bg-brand text-white border-brand shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:border-gold/40"
                            }`}
                          >
                            <PresetIcon className="w-3.5 h-3.5" /> {preset.label}
                          </button>
                        );
                      })}
                      <input
                        type="text"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Outro motivo..."
                        className="col-span-2 text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Data</label>
                    <input
                      type="date"
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={blockAllDay}
                      onChange={(e) => setBlockAllDay(e.target.checked)}
                      className="accent-gold w-4 h-4 rounded"
                    />
                    Dia inteiro (sem horários)
                  </label>

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="accent-gold w-4 h-4 rounded"
                      />
                      Repetir este bloqueio (Recorrente)
                    </label>

                    {isRecurring && (
                      <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frequência</label>
                          <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as any)}
                            className="w-full text-xs border border-slate-200 rounded-xl p-2 bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                          >
                            <option value="diaria">Diariamente</option>
                            <option value="semanal">Semanalmente (mesmo dia)</option>
                            <option value="dias_uteis">Dias úteis (Segunda a Sexta)</option>
                            <option value="personalizada">Dias específicos da semana</option>
                          </select>
                        </div>

                        {(frequency === "semanal" || frequency === "personalizada") && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Dias da Semana</label>
                            <div className="flex justify-between gap-1">
                              {[
                                { l: "D", v: 0 }, { l: "S", v: 1 }, { l: "T", v: 2 },
                                { l: "Q", v: 3 }, { l: "Q", v: 4 }, { l: "S", v: 5 }, { l: "S", v: 6 }
                              ].map((day) => {
                                const isSelected = selectedDays.includes(day.v);
                                return (
                                  <button
                                    key={day.v}
                                    type="button"
                                    onClick={() => setSelectedDays(prev =>
                                      prev.includes(day.v) ? prev.filter(d => d !== day.v) : [...prev, day.v]
                                    )}
                                    className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? "bg-brand text-white shadow-sm"
                                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    {day.l}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!blockAllDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Início</label>
                        <input
                          type="time"
                          value={blockStart}
                          onChange={(e) => setBlockStart(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Fim</label>
                        <input
                          type="time"
                          value={blockEnd}
                          onChange={(e) => setBlockEnd(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold"
                        />
                      </div>
                    </div>
                  )}

                  <button type="submit" className="w-full bg-brand hover:bg-brand-700 text-white font-bold py-3 rounded-xl text-xs shadow-sm transition-all cursor-pointer">
                    {editingBlock ? "Atualizar Bloqueio" : "Confirmar Bloqueio"}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Tomorrow Reminders Modal */}
        {showTomorrowReminders && (
          <>
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowTomorrowReminders(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTomorrowReminders(false)}>
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="bg-brand text-white p-5 rounded-t-3xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-5 h-5 text-gold" />
                    <div>
                      <h3 className="text-sm font-bold">Lembretes de Amanhã</h3>
                      <p className="text-[10px] text-gold/70">{formatDateBR(getTomorrowDateStr())}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowTomorrowReminders(false)} className="text-white/70 hover:text-white p-1 cursor-pointer">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  {tomorrowAppointments.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <MessageCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold">Nenhum agendamento para amanhã</p>
                      <p className="text-[10px] mt-1">Agendamentos aparecerão aqui quando cadastrados.</p>
                    </div>
                  ) : (
                    tomorrowAppointments.map((appt) => {
                      const phone = getApptPhone(appt);
                      return (
                        <div key={appt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{appt.patientName}</p>
                            <p className="text-[10px] text-slate-500">{appt.time} — {appt.service}</p>
                          </div>
                          <div className="flex gap-1.5 shrink-0 ml-3">
                            {phone ? (
                              <>
                                <a
                                  href={buildWhatsAppConfirmUrl(appt.patientName, phone, appt.date, appt.time)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] font-bold text-white bg-brand hover:bg-brand-700 px-3 py-2 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <Send className="w-3 h-3" /> Confirmar
                                </a>
                                <a
                                  href={buildWhatsAppDetailsUrl(appt.patientName, phone, appt.date, appt.time, appt.service, appt.price)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] font-bold text-slate-600 bg-white hover:bg-slate-50 px-2 py-2 rounded-lg border border-slate-200 transition-all flex items-center gap-1"
                                >
                                  <MessageCircle className="w-3 h-3" /> Detalhes
                                </a>
                              </>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-lg">
                                Sem WhatsApp
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <p className="text-[9px] text-slate-400 text-center pt-2">
                    Os links abrem o WhatsApp com a mensagem pré-preenchida. Envie um por um.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile: iOS-style monthly calendar */}
        <div className="md:hidden">
          <MobileMonthCalendar
            selectedDate={selectedDate}
            todayStr={getTodayBR()}
            onSelectDate={setSelectedDate}
            appointments={appointments}
            googleEvents={googleEvents}
            scheduleBlocks={scheduleBlocks}
            patients={patients}
            onEditAppointment={handleEditAppointment}
            onDeleteAppointment={handleDelete}
            onStatusChange={handleStatusChange}
            onEditGoogleEvent={handleStartEditGoogleEvent}
            onDeleteGoogleEvent={handleDeleteGoogleEventFn}
            onNewAppointment={(date) => {
              setFormDate(date);
              setEditingAppt(null);
              setShowAddForm(true);
            }}
          />
        </div>

        {/* Desktop: day / week grid */}
        <div className="hidden md:block">
        {calendarView === "day" ? (
        <div className="space-y-3">
          {/* Empty state message */}
          {dailyAppointments.length === 0 && !isGoogleConnected && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-amber-700 mb-1">Nenhum agendamento para este dia</p>
              <p className="text-[9px] text-amber-600">
                Conecte o Google Agenda para importar seus compromissos, ou clique em "Nova Consulta" para agendar.
              </p>
            </div>
          )}

          {(() => {
            // Pre-group long events: only render the start slot with full height.
            // Build a map of eventId -> { startMin, endMin, durationMin } so we can
            // detect continuation slots and skip them.
            const longEventGroups = new Map<string, { startMin: number; endMin: number; durationMin: number }>();

            // Google events
            googleEvents
              .filter((ge) => getEventLocalDate(ge.start) === selectedDate)
              .forEach((ge) => {
                const gStart = timeToMinutes(formatGoogleTime(ge.start));
                const gEnd = timeToMinutes(formatGoogleTime(ge.end));
                if (isNaN(gStart) || isNaN(gEnd) || gEnd <= gStart) return;
                const duration = gEnd - gStart;
                if (!longEventGroups.has(ge.id)) {
                  longEventGroups.set(ge.id, { startMin: gStart, endMin: gEnd, durationMin: duration });
                }
              });

            // Local appointments
            dailyAppointments.forEach((appt) => {
              if (!appt.time) return;
              const [ah, am] = appt.time.split(":").map(Number);
              const apptStart = ah * 60 + am;
              const apptEnd = apptStart + getServiceDuration();
              const duration = apptEnd - apptStart;
              if (!longEventGroups.has(appt.id)) {
                longEventGroups.set(appt.id, { startMin: apptStart, endMin: apptEnd, durationMin: duration });
              }
            });

            // Track which blocks/events have been rendered to avoid duplicates
            const renderedBlockIds = new Set<string>();
            const renderedGoogleIds = new Set<string>();
            const renderedApptIds = new Set<string>();

            return dayHours.map((hour) => {
              const [sh, sm] = hour.split(":").map(Number);
              const slotStart = sh * 60 + sm;
              const slotEnd = slotStart + 30;

              const googleEvt = getGoogleEventForHour(hour);
              const appt = getApptForHour(hour);
              const patientObj = appt ? patients.find((p) => p.id === appt.patientId) : null;
              const isDuplicate = appt?.calendarEventId && googleEvt;
              const blocked = getBlockForHour(hour);
              const googleEvtStartsHere = googleEventStartsInSlot(googleEvt, hour);

              // --- Long event handling ---
              // If we already rendered this Google event at its start slot, skip continuation slots.
              if (googleEvt && renderedGoogleIds.has(googleEvt.id)) {
                return null;
              }

              // If we already rendered this appointment at its start slot, skip continuation slots.
              if (appt && !googleEvt && renderedApptIds.has(appt.id)) {
                return null;
              }

              // --- Bloqueios: renderiza apenas no slot de início, com altura proporcional ---
              if (blocked && !renderedBlockIds.has(blocked.id)) {
                renderedBlockIds.add(blocked.id);
                const [bh, bm] = blocked.startTime.split(":").map(Number);
                const [eh, em] = blocked.endTime.split(":").map(Number);
                const durationMin = (eh * 60 + em) - (bh * 60 + bm);
                const slotHeight = getSlotHeight(durationMin);
                return (
                  <div key={hour} style={{ minHeight: slotHeight }} className="flex gap-3 items-start p-3 rounded-xl border border-rose-100 bg-rose-50/70">
                    <div className="flex items-center gap-1.5 w-14 shrink-0 text-rose-400 font-bold text-[11px] pt-1">
                      <Clock className="w-3 h-3" />
                      <span>{hour}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-white border border-rose-100 px-2 py-1 rounded-lg">
                          <Ban className="w-3 h-3 text-rose-500" />
                          {blocked.reason}
                        </span>
                        <span className="text-[9px] text-rose-400 font-medium">
                          {blocked.startTime} – {blocked.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              // Slot de continuação de bloqueio — pula (já renderizado acima)
              if (blocked && renderedBlockIds.has(blocked.id)) {
                return null;
              }

              // --- Eventos Google (não duplicados): renderiza apenas no slot de início ---
              if (googleEvt && !appt && !renderedGoogleIds.has(googleEvt.id)) {
                if (googleEvtStartsHere) {
                  renderedGoogleIds.add(googleEvt.id);
                  const geStartMin = timeToMinutes(formatGoogleTime(googleEvt.start));
                  const geEndMin = timeToMinutes(formatGoogleTime(googleEvt.end));
                  const durationMin = (!isNaN(geStartMin) && !isNaN(geEndMin)) ? geEndMin - geStartMin : 30;
                  const slotHeight = getSlotHeight(durationMin);
                  return (
                    <div key={hour} style={{ minHeight: slotHeight }} className="flex gap-3 items-start p-3 rounded-xl border border-gold/30 bg-gold/5">
                      <div className="flex items-center gap-1.5 w-14 shrink-0 text-gold font-bold text-[11px] pt-1">
                        <Clock className="w-3 h-3" />
                        <span>{hour}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-white border border-gold/30 px-2 py-1 rounded-lg">
                            <Ban className="w-3 h-3 text-amber-500" />
                            {googleEvt.summary}
                          </span>
                          <span className="text-[9px] text-slate-500 font-medium">
                            {formatGoogleTime(googleEvt.start)} – {formatGoogleTime(googleEvt.end)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                // Google event overlaps but doesn't start here — skip continuation
                return null;
              }

              // --- Duplicate case: both Google event AND local appointment ---
              // Mark as rendered at the start slot, then render the full card.
              if (isDuplicate && googleEvt && appt) {
                if (!renderedGoogleIds.has(googleEvt.id)) {
                  renderedGoogleIds.add(googleEvt.id);
                  renderedApptIds.add(appt.id);
                }
                // For long duplicate events: skip continuation slots
                const group = longEventGroups.get(googleEvt.id);
                if (group && group.durationMin > 30 && slotStart !== group.startMin) {
                  return null;
                }
              }

              // --- Local-only appointment: mark as rendered and set dynamic height ---
              if (appt && !googleEvt && !renderedApptIds.has(appt.id)) {
                renderedApptIds.add(appt.id);
              }

              // Calculate dynamic min-height for the start slot of a long event
              let dynamicMinHeightStyle: React.CSSProperties = {};
              if (googleEvt && isDuplicate && appt) {
                const group = longEventGroups.get(googleEvt.id);
                if (group && group.durationMin > 30) {
                  dynamicMinHeightStyle = { minHeight: getSlotHeight(group.durationMin) };
                }
              } else if (appt && !googleEvt) {
                const group = longEventGroups.get(appt.id);
                if (group && group.durationMin > 30) {
                  dynamicMinHeightStyle = { minHeight: getSlotHeight(group.durationMin) };
                }
              }

              return (
                <div
                  key={hour}
                  style={dynamicMinHeightStyle}
                  className={`flex flex-col gap-3 items-start p-3 rounded-xl border transition-all ${
                    googleEvt
                      ? isDuplicate
                        ? "bg-emerald-50/10 border-emerald-100/70"
                      : "bg-gold/5 border-gold/20"
                      : appt
                      ? appt.source === "google"
                        ? "bg-gold/5 border-gold/20"
                        : appt.status === "completed"
                        ? "bg-emerald-50/10 border-emerald-100/70"
                        : appt.status === "confirmed"
                        ? "bg-emerald-50/10 border-emerald-100/70"
                      : appt.status === "canceled"
                      ? "bg-slate-50 border-slate-100 opacity-60"
                      : "bg-[#0F3B2E]/5 border-[#0F3B2E]/15"
                      : "border-slate-50 bg-slate-50/20"
                  }`}
                >
                  <div className="flex items-center gap-1.5 w-14 shrink-0 text-slate-500 font-bold text-[11px] pt-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{hour}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {googleEvt ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[8px] font-bold text-gold bg-gold-subtle px-1.5 py-0.5 rounded uppercase border border-gold/10">
                                Google
                              </span>
                              <span className="font-bold text-slate-800 truncate">{googleEvt.summary}</span>
                            </div>
                            <p className="text-[9px] text-gold/70 mt-0.5">
                              {formatGoogleTime(googleEvt.start)} - {formatGoogleTime(googleEvt.end)}
                            </p>
                            {googleEvt.description && (
                              <p className="text-[9px] text-slate-500 italic mt-0.5">{googleEvt.description}</p>
                            )}
                          </div>

                          {isDuplicate ? (
                            <span className="text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                              Sincronizado
                            </span>
                          ) : (
                            <span className="text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border shrink-0 bg-gold-subtle text-gold border-gold/30">
                              Google
                            </span>
                          )}
                        </div>

                        {!isDuplicate && editingGoogleEvent?.id === googleEvt.id && (
                          <div className="mt-2 p-2.5 bg-white rounded-xl border border-gold/20 space-y-2 shadow-sm">
                            <input
                              type="text"
                              value={geEditSummary}
                              onChange={(e) => setGeEditSummary(e.target.value)}
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
                              placeholder="Título do evento"
                            />
                            <textarea
                              value={geEditDescription}
                              onChange={(e) => setGeEditDescription(e.target.value)}
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                              rows={2}
                              placeholder="Descrição..."
                            />
                            <div className="flex gap-1.5">
                              <button
                                onClick={handleSaveGoogleEvent}
                                className="flex-1 text-[9px] font-bold text-white bg-brand hover:bg-brand-700 px-2 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3 h-3" /> Salvar
                              </button>
                              <button
                                onClick={handleCancelEditGoogleEvent}
                                className="flex-1 text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {!isDuplicate && editingGoogleEvent?.id !== googleEvt.id && (
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-gold/10">
                            <button
                              onClick={() => handleStartEditGoogleEvent(googleEvt)}
                              className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3 inline" /> Editar
                            </button>
                            <button
                              onClick={() => handleDeleteGoogleEventFn(googleEvt)}
                              className="text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white px-2 py-1 rounded transition-colors ml-auto cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 inline" /> Excluir
                            </button>
                          </div>
                        )}

                        {isDuplicate && patientObj && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[9px] text-slate-500 bg-white border border-slate-100 px-1.5 py-0.5 rounded font-medium">
                              {appt.service}
                            </span>
                            <span className="text-[9px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              R$ {appt.price}
                            </span>
                            {patientObj.isDiabetic && (
                              <span className="bg-amber-100 text-amber-800 text-[7px] px-1 rounded font-bold uppercase">
                                Diabético(a)
                              </span>
                            )}
                          </div>
                        )}

                        {isDuplicate && appt && (
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100/40">
                            {patientObj?.phone && (
                              <>
                                <a
                                  href={buildWhatsAppConfirmUrl(appt.patientName, patientObj.phone, appt.date, appt.time)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-brand hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-0.5"
                                >
                                  <Send className="w-3 h-3" /> WhatsApp Confirmar
                                </a>
                                <a
                                  href={buildWhatsAppDetailsUrl(appt.patientName, patientObj.phone, appt.date, appt.time, appt.service, appt.price)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded transition-colors flex items-center gap-0.5"
                                >
                                  <MessageCircle className="w-3 h-3" /> Detalhes
                                </a>
                              </>
                            )}
                            {appt.status !== "completed" && appt.status !== "canceled" && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(appt, "confirmed")}
                                  className="text-[9px] font-bold text-emerald-700 bg-emerald-50/50 hover:bg-brand hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => handleStatusChange(appt, "completed")}
                                  className="text-[9px] font-bold text-emerald-700 bg-emerald-50/50 hover:bg-brand hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Concluir
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleEditAppointment(appt)}
                              className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3 inline" /> Editar
                            </button>
                            <button
                              onClick={() => handleDelete(appt)}
                              className="text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white px-2 py-1 rounded transition-colors ml-auto cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3 inline" /> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    ) : appt ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                appt.source === "google"
                                  ? "text-gold bg-gold-subtle border border-gold/10"
                                  : "text-brand bg-brand-50 border border-brand-100"
                              }`}>
                                {appt.source === "google" ? "Google" : "Local"}
                              </span>
                              <span className="font-bold text-slate-800 truncate">{appt.patientName}</span>
                              {patientObj?.isDiabetic && (
                                <span className="bg-amber-100 text-amber-800 text-[7px] px-1 rounded font-bold uppercase shrink-0">
                                  Diabético(a)
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 items-center">
                              <span className="text-[9px] text-slate-500 bg-white border border-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {appt.service}
                              </span>
                              <span className="text-[9px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                R$ {appt.price}
                              </span>
                              {(appt.quantity && appt.quantity > 1) && (
                                <span className="text-[9px] font-bold text-gold bg-gold-subtle px-1.5 py-0.5 rounded border border-gold/30 flex items-center gap-0.5">
                                  <Layers className="w-3 h-3" /> {appt.quantity} sessões
                                </span>
                              )}
                            </div>
                            {patientObj?.phone && (
                              <p className="text-[9px] text-slate-400 mt-0.5">{patientObj.phone}</p>
                            )}
                          </div>

                          <span
                            className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border shrink-0 ${
                              appt.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : appt.status === "confirmed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : appt.status === "canceled"
                                ? "bg-slate-100 text-slate-500 border-slate-200"
                                : "bg-[#0F3B2E]/10 text-[#0F3B2E] border-[#0F3B2E]/20"
                            }`}
                          >
                            {appt.status === "completed"
                              ? "Concluído"
                              : appt.status === "confirmed"
                              ? "Confirmado"
                              : appt.status === "canceled"
                              ? "Cancelado"
                              : "Agendado"}
                          </span>
                        </div>

                        {appt.notes && (
                          <p className="text-[9px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-100">
                            {appt.notes}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100/40">
                          {patientObj?.phone && (
                            <>
                              <a
                                href={buildWhatsAppConfirmUrl(appt.patientName, patientObj.phone, appt.date, appt.time)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-brand hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-0.5"
                              >
                                <Send className="w-3 h-3" /> WhatsApp Confirmar
                              </a>
                              <a
                                href={buildWhatsAppDetailsUrl(appt.patientName, patientObj.phone, appt.date, appt.time, appt.service, appt.price)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded transition-colors flex items-center gap-0.5"
                              >
                                <MessageCircle className="w-3 h-3" /> Detalhes
                              </a>
                            </>
                          )}
                          {appt.status !== "completed" && appt.status !== "canceled" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(appt, "confirmed")}
                                className="text-[9px] font-bold text-emerald-700 bg-emerald-50/50 hover:bg-brand hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => handleStatusChange(appt, "completed")}
                                className="text-[9px] font-bold text-emerald-700 bg-emerald-50/50 hover:bg-brand hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Concluir
                              </button>
                            </>
                          )}
                          {appt.status !== "canceled" && (
                            <button
                              onClick={() => handleStatusChange(appt, "canceled")}
                              className="text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                          )}
                          <button
                            onClick={() => handleEditAppointment(appt)}
                            className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 inline" /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(appt)}
                            className="text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white px-2 py-1 rounded transition-colors ml-auto cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 inline" /> Excluir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-2 text-slate-300 text-[11px] font-medium border-2 border-dashed border-slate-50/40 rounded-xl bg-slate-50/5">
                        Horário disponível
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}

          {/* Google Calendar events outside grid hours */}
          {(() => {
    const dayGoogleEvents = googleEvents.filter((ge) => getEventLocalDate(ge.start) === formDate);
            const matchedGoogleIds = new Set<string>();
            dayGoogleEvents.forEach((ge) => {
              const geTime = formatGoogleTime(ge.start);
              if (!geTime) return;
              const [geh, gem] = geTime.split(":").map(Number);
              const geMin = geh * 60 + gem;
              const inSlot = dayHours.some((h) => {
                const [sh, sm] = h.split(":").map(Number);
                const slotMin = sh * 60 + sm;
                return geMin >= slotMin && geMin < slotMin + 30;
              });
              if (inSlot) matchedGoogleIds.add(ge.id);
            });
            const overflowGoogle = dayGoogleEvents.filter((ge) => !matchedGoogleIds.has(ge.id));
            return overflowGoogle.length > 0 ? (
              <div className="mt-4 pt-4 border-t border-gold/20 space-y-3">
                <h4 className="text-[10px] font-bold text-gold uppercase tracking-wider">Google Agenda - Fora do Horário</h4>
                {overflowGoogle.map((ge) => (
                  <div key={ge.id} className="flex gap-3 items-start p-3 rounded-xl border bg-gold/5 border-gold/20">
                    <div className="flex items-center gap-1.5 w-14 shrink-0 text-gold font-bold text-[11px] pt-1">
                      <Clock className="w-3 h-3 text-gold" />
                      <span>{formatGoogleTime(ge.start)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-bold text-gold bg-gold-subtle px-1.5 py-0.5 rounded uppercase border border-gold/10">Google</span>
                          <span className="font-bold text-slate-800 text-xs">{ge.summary}</span>
                        </div>
                        <p className="text-[9px] text-gold/70">
                          {formatGoogleTime(ge.start)} - {formatGoogleTime(ge.end)}
                        </p>
                        {ge.description && (
                          <p className="text-[9px] text-slate-500 italic">{ge.description}</p>
                        )}
                        {editingGoogleEvent?.id === ge.id ? (
                          <div className="mt-2 p-2 bg-white rounded-lg border border-gold/20 space-y-1.5 shadow-sm">
                            <input type="text" value={geEditSummary} onChange={(e) => setGeEditSummary(e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold" placeholder="Título" />
                            <textarea value={geEditDescription} onChange={(e) => setGeEditDescription(e.target.value)} className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none" rows={1} placeholder="Descrição..." />
                            <div className="flex gap-1">
                              <button onClick={handleSaveGoogleEvent} className="flex-1 text-[8px] font-bold text-white bg-brand hover:bg-brand-700 px-2 py-1 rounded-lg transition-colors flex items-center justify-center gap-0.5 cursor-pointer"><Save className="w-2.5 h-2.5" /> Salvar</button>
                              <button onClick={handleCancelEditGoogleEvent} className="flex-1 text-[8px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-1 pt-1">
                            <button onClick={() => handleStartEditGoogleEvent(ge)} className="text-[8px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-500 hover:text-white px-1.5 py-0.5 rounded transition-colors cursor-pointer"><Pencil className="w-2.5 h-2.5 inline" /> Editar</button>
                            <button onClick={() => handleDeleteGoogleEventFn(ge)} className="text-[8px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white px-1.5 py-0.5 rounded transition-colors ml-auto cursor-pointer"><Trash2 className="w-2.5 h-2.5 inline" /> Excluir</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null;
          })()}

          {/* Local-only overflow appointments (outside grid hours) */}
          {overflowAppointments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outros Horários do Dia</h4>
              {overflowAppointments.map((appt) => {
                const patientObj = patients.find((p) => p.id === appt.patientId);
                return (
                  <div key={appt.id} className="flex gap-3 items-start p-3 rounded-xl border bg-[#0F3B2E]/5 border-[#0F3B2E]/15">
                    <div className="flex items-center gap-1.5 w-14 shrink-0 text-slate-500 font-bold text-[11px] pt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{appt.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                appt.source === "google"
                                  ? "text-gold bg-gold-subtle border border-gold/10"
                                  : "text-brand bg-brand-50 border border-brand-100"
                              }`}>
                                {appt.source === "google" ? "Google" : "Local"}
                              </span>
                              <span className="font-bold text-slate-800 truncate">{appt.patientName}</span>
                              {patientObj?.isDiabetic && (
                                <span className="bg-amber-100 text-amber-800 text-[7px] px-1 rounded font-bold uppercase shrink-0">
                                  Diabético(a)
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 items-center">
                              <span className="text-[9px] text-slate-500 bg-white border border-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {appt.service}
                              </span>
                              <span className="text-[9px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                R$ {appt.price}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border shrink-0 ${
                            appt.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : appt.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : appt.status === "canceled"
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : "bg-[#0F3B2E]/10 text-[#0F3B2E] border-[#0F3B2E]/20"
                          }`}>
                            {appt.status === "completed" ? "Concluído" : appt.status === "confirmed" ? "Confirmado" : appt.status === "canceled" ? "Cancelado" : "Agendado"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100/40">
                          <button onClick={() => handleEditAppointment(appt)} className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer">
                            <Pencil className="w-3 h-3 inline" /> Editar
                          </button>
                           <button onClick={() => handleDelete(appt)} className="text-[9px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white px-2 py-1 rounded transition-colors ml-auto cursor-pointer">
                            <Trash2 className="w-3 h-3 inline" /> Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        ) : (
          /* ── Week Grid View ── */
          <WeekGrid
            weekDates={getWeekDates(selectedDate)}
            selectedDate={selectedDate}
            todayStr={getTodayBR()}
            onSelectDate={setSelectedDate}
            appointments={appointments}
            googleEvents={googleEvents}
            scheduleBlocks={scheduleBlocks}
            services={services}
            patients={patients}
            dayHours={dayHours}
            expedienteStart={expedienteStart}
            expedienteEnd={expedienteEnd}
            view="week"
            onEditAppointment={handleEditAppointment}
            onDeleteAppointment={handleDelete}
            onStatusChange={handleStatusChange}
            onCreateBlock={(date, startTime) => {
              setBlockDate(date);
              setBlockStart(startTime);
              setBlockEnd(startTime);
              setEditingBlock(null);
              setShowBlockModal(true);
            }}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteBlock}
            onEditGoogleEvent={handleStartEditGoogleEvent}
            onDeleteGoogleEvent={handleDeleteGoogleEventFn}
            onCreateAppointment={(date, time) => {
              setFormDate(date);
              setTime(time);
              setEditingAppt(null);
              if (window.innerWidth < 768) {
                setShowAddForm(true);
              } else {
                scrollFormIntoView();
              }
            }}
          />
        )}
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => { resetForm(); setShowAddForm(true); }}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-brand text-white px-4 py-3 shadow-xl hover:bg-brand-700 transition-all md:hidden cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs font-bold">Nova Consulta</span>
      </button>

      {/* Mobile bottom sheet form */}
      {showAddForm && (
        <div className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] md:hidden" onClick={() => { setShowAddForm(false); resetForm(); }}>
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingAppt ? "Editar Consulta" : "Agendar Consulta"}
              </h3>
              <button onClick={() => { setShowAddForm(false); resetForm(); }} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500 cursor-pointer">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            {ScheduleFormElement}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
