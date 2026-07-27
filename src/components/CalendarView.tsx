import React, { useState, useEffect } from "react";
import { Patient, Appointment, ClinicService, ScheduleBlock } from "../types";
import { GoogleCalendarEvent } from "../services/googleCalendar";
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
} from "lucide-react";

interface CalendarViewProps {
  patients: Patient[];
  appointments: Appointment[];
  services?: ClinicService[];
  onAddAppointment: (appointment: Omit<Appointment, "id">) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onUpdateAppointmentStatus: (id: string, status: Appointment["status"]) => void;
  onDeleteAppointment: (id: string) => void;
  googleEvents: GoogleCalendarEvent[];
  isGoogleConnected: boolean;
  isGoogleConfigured: boolean;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onSyncGoogleEvents: (date: string) => void;
  onCreateGoogleEvent: (summary: string, description: string, startTime: string, endTime: string) => Promise<string | null>;
  onDeleteGoogleEvent: (eventId: string) => Promise<void>;
  onSelectPatientForAnamnese?: (patientId: string) => void;
  scheduleBlocks: ScheduleBlock[];
  onAddScheduleBlock: (block: Omit<ScheduleBlock, "id" | "createdAt">) => void;
  onDeleteScheduleBlock: (id: string) => void;
}

export default function CalendarView({
  patients,
  appointments,
  services = [],
  onAddAppointment,
  onUpdateAppointment,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  googleEvents,
  isGoogleConnected,
  isGoogleConfigured,
  onConnectGoogle,
  onDisconnectGoogle,
  onSyncGoogleEvents,
  onCreateGoogleEvent,
  onDeleteGoogleEvent,
  onSelectPatientForAnamnese,
  scheduleBlocks,
  onAddScheduleBlock,
  onDeleteScheduleBlock,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  const [patientId, setPatientId] = useState(patients[0]?.id || "");
  const [time, setTime] = useState("09:00");
  const [service, setService] = useState("");
  const [price, setPrice] = useState(0);
  const [notes, setNotes] = useState("");

  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState("12:00");
  const [blockEndTime, setBlockEndTime] = useState("14:00");
  const [blockReason, setBlockReason] = useState("Almoço");

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

  // Sync Google Calendar events when date changes
  useEffect(() => {
    if (isGoogleConnected) {
      onSyncGoogleEvents(selectedDate);
    }
  }, [selectedDate, isGoogleConnected]);

  const handleServiceChange = (srv: string) => {
    setService(srv);
    if (servicePrices[srv] !== undefined) {
      setPrice(servicePrices[srv]);
    }
  };

  const resetForm = () => {
    setPatientId(patients[0]?.id || "");
    setTime("09:00");
    setNotes("");
    setEditingAppt(null);
    if (services.length > 0) {
      const activeSrvs = services.filter((s) => s.isActive);
      const firstSrv = activeSrvs[0] || services[0];
      setService(firstSrv.name);
      setPrice(firstSrv.price);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientObj = patients.find((p) => p.id === patientId);
    if (!patientObj) return;

    if (editingAppt) {
      // UPDATE existing appointment
      const updatedAppt: Appointment = {
        ...editingAppt,
        patientId,
        patientName: patientObj.name,
        time,
        service,
        price,
        notes,
      };
      await onUpdateAppointment(updatedAppt);

      // Update Google Calendar event if linked
      if (editingAppt.calendarEventId && isGoogleConnected) {
        const dtStart = `${selectedDate}T${time}:00-03:00`;
        const [h, m] = time.split(":").map(Number);
        const endDate = new Date(new Date(`${selectedDate}T${time}:00`).getTime() + (price > 150 ? 60 : 45) * 60000);
        const dtEnd = endDate.toISOString().slice(0, 19) + "-03:00";
        await onEditGoogleEvent(editingAppt.calendarEventId, `${service} - ${patientObj.name}`, notes || "", dtStart, dtEnd);
      }
    } else {
      // CREATE new appointment
      const dtStart = `${selectedDate}T${time}:00-03:00`;
      const [h, m] = time.split(":").map(Number);
      const endDate = new Date(new Date(`${selectedDate}T${time}:00`).getTime() + (price > 150 ? 60 : 45) * 60000);
      const dtEnd = endDate.toISOString().slice(0, 19) + "-03:00";

      let calendarEventId: string | undefined = undefined;
      if (isGoogleConnected) {
        const result = await onCreateGoogleEvent(
          `${service} - ${patientObj.name}`,
          notes || `Agendamento via Podologia Fabrícia - ${patientObj.name}`,
          dtStart,
          dtEnd
        );
        if (result) calendarEventId = result;
      }

      await onAddAppointment({
        patientId,
        patientName: patientObj.name,
        date: selectedDate,
        time,
        service,
        price,
        status: "scheduled",
        notes,
        calendarEventId,
      });
    }

    resetForm();
    setShowAddForm(false);
  };

  const startEdit = (appt: Appointment) => {
    setEditingAppt(appt);
    setPatientId(appt.patientId);
    setTime(appt.time);
    setService(appt.service);
    setPrice(appt.price);
    setNotes(appt.notes || "");
    setShowAddForm(true);
  };

  const handleDelete = async (appt: Appointment) => {
    if (!confirm(`Excluir agendamento de ${appt.patientName}?`)) return;
    await onDeleteAppointment(appt.id);
    if (appt.calendarEventId && isGoogleConnected) {
      await onDeleteGoogleEvent(appt.calendarEventId);
    }
  };

  const handleStatusChange = async (appt: Appointment, newStatus: Appointment["status"]) => {
    await onUpdateAppointmentStatus(appt.id, newStatus);
  };

  // Helper: format Google event time for display
  const formatGoogleTime = (isoString: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString.slice(11, 16);
    }
  };

  const dayHours = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
    "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
    "17:30", "18:00",
  ];

  const dailyAppointments = appointments.filter((a) => a.date === selectedDate);

  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const onEditGoogleEvent = async (eventId: string, summary: string, description: string, start: string, end: string) => {
    try {
      const { updateGoogleCalendarEvent } = await import("../services/googleCalendar");
      await updateGoogleCalendarEvent(eventId, summary, description, start, end);
    } catch (err) {
      console.error("Error updating Google Calendar event:", err);
    }
  };

  const getApptForHour = (hour: string) => {
    const [sh, sm] = hour.split(":").map(Number);
    const slotMinutes = sh * 60 + sm;
    const matchedAppt = dailyAppointments.find((a) => {
      if (!a.time) return false;
      const [ah, am] = a.time.split(":").map(Number);
      const apptMinutes = ah * 60 + am;
      return apptMinutes >= slotMinutes && apptMinutes < slotMinutes + 30;
    });
    return matchedAppt;
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

  const isSlotBlocked = (hour: string): ScheduleBlock | undefined => {
    const [sh, sm] = hour.split(":").map(Number);
    const slotMin = sh * 60 + sm;
    return scheduleBlocks.find((b) => {
      if (b.date !== selectedDate) return false;
      const [bsh, bsm] = b.startTime.split(":").map(Number);
      const [beh, bem] = b.endTime.split(":").map(Number);
      const blockStart = bsh * 60 + bsm;
      const blockEnd = beh * 60 + bem;
      return slotMin >= blockStart && slotMin < blockEnd;
    });
  };

  const ScheduleForm = ({ isMobile = false }: { isMobile?: boolean }) => (
    <form onSubmit={handleScheduleSubmit} className="space-y-3">
      {editingAppt && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-[10px] font-bold text-blue-700 flex items-center gap-1.5">
          <Pencil className="w-3 h-3" /> Editando agendamento de {editingAppt.patientName}
        </div>
      )}

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Paciente:</label>
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.isDiabetic ? " (Diabético)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Horário:</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serviço / Procedimento:</label>
        <select
          value={service}
          onChange={(e) => handleServiceChange(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {services.length > 0 ? (
            services.filter((s) => s.isActive || s.name === service).map((s) => (
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
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Primeira consulta de espiculotomia..."
          rows={2}
          className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <button
        type="submit"
        className="w-full text-center text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
      >
        {editingAppt ? "Atualizar Agendamento" : "Confirmar Agendamento"}
      </button>
    </form>
  );

  return (
    <div id="calendar-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: Date selector + Schedule form (desktop) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6 order-2 lg:order-1">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-left">Data</span>
          <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-xl">
            <button
              onClick={() => changeDate(-1)}
              className="text-xs font-bold text-slate-600 hover:bg-white px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              onClick={() => changeDate(1)}
              className="text-xs font-bold text-slate-600 hover:bg-white px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Google Calendar Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Google Agenda</span>
            {isGoogleConnected ? (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Conectado
              </span>
            ) : (
              <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">Desconectado</span>
            )}
          </div>

          {isGoogleConfigured ? (
            isGoogleConnected ? (
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500">
                  {googleEvents.length} evento(s) externo(s) sincronizado(s) para este dia.
                </p>
                <button
                  onClick={() => onSyncGoogleEvents(selectedDate)}
                  className="w-full text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 py-2 rounded-xl border border-teal-100 cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Sincronizar Agenda
                </button>
                <button
                  onClick={onDisconnectGoogle}
                  className="w-full text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 py-2 rounded-xl border border-rose-100 cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <Unlink className="w-3 h-3" /> Desconectar Google
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectGoogle}
                className="w-full text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5" /> Conectar Google Agenda
              </button>
            )
          ) : (
            <p className="text-[10px] text-slate-400 text-center">
              Configure VITE_GOOGLE_CALENDAR_CLIENT_ID no .env
            </p>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-4 h-4 text-teal-600" />
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
            <ScheduleForm />
          )}
        </div>

        {/* Block Schedule Section */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Bloquear Horário
            </h3>
            <button
              onClick={() => setShowBlockForm(!showBlockForm)}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                showBlockForm
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {showBlockForm ? "Cancelar" : "+ Bloquear"}
            </button>
          </div>

          {showBlockForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddScheduleBlock({
                  date: selectedDate,
                  startTime: blockStartTime,
                  endTime: blockEndTime,
                  reason: blockReason,
                });
                setShowBlockForm(false);
                setBlockStartTime("12:00");
                setBlockEndTime("14:00");
                setBlockReason("Almoço");
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Início:</label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fim:</label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Motivo:</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Almoço, Férias, Reunião..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full text-center text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Confirmar Bloqueio
              </button>
            </form>
          )}

          {!showBlockForm && scheduleBlocks.filter((b) => b.date === selectedDate).length > 0 && (
            <div className="space-y-2">
              {scheduleBlocks
                .filter((b) => b.date === selectedDate)
                .map((block) => (
                  <div key={block.id} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-700">{block.startTime} - {block.endTime}</span>
                      <span className="text-[10px] text-amber-600">{block.reason}</span>
                    </div>
                    <button
                      onClick={() => onDeleteScheduleBlock(block.id)}
                      className="text-[9px] font-bold text-amber-600 hover:text-amber-800 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Hourly agenda */}
      <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left order-1 lg:order-2">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Agenda do Dia
          </h3>
          <div className="flex items-center gap-2">
            {googleEvents.length > 0 && (
              <span className="text-[9px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold border border-purple-100">
                +{googleEvents.length} Google
              </span>
            )}
            <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-bold">
              {dailyAppointments.length} local(is)
            </span>
          </div>
        </div>

        {/* Mobile date nav */}
        <div className="lg:hidden flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-xl mb-4">
          <button onClick={() => changeDate(-1)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "2-digit",
              month: "short",
            })}
          </span>
          <button onClick={() => changeDate(1)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {dayHours.map((hour) => {
            const appt = getApptForHour(hour);
            const patientObj = appt ? patients.find((p) => p.id === appt.patientId) : null;
            const blocked = isSlotBlocked(hour);

            // Find Google event at this time slot
            const googleEvt = googleEvents.find((ge) => {
              const geTime = formatGoogleTime(ge.start);
              return geTime === hour;
            });

            return (
              <div
                key={hour}
                className={`flex gap-3 items-start p-3 rounded-xl border transition-all ${
                  blocked
                    ? "bg-amber-50/30 border-amber-200/70"
                    : appt
                    ? appt.status === "completed"
                      ? "bg-emerald-50/10 border-emerald-100/70"
                      : appt.status === "confirmed"
                      ? "bg-teal-50/10 border-teal-100/70"
                      : appt.status === "canceled"
                      ? "bg-slate-50 border-slate-100 opacity-60"
                      : "bg-blue-50/10 border-blue-100/70"
                    : googleEvt
                    ? "bg-purple-50/10 border-purple-100/70"
                    : "border-slate-50 bg-slate-50/20"
                }`}
              >
                <div className="flex items-center gap-1.5 w-14 shrink-0 text-slate-500 font-bold text-[11px] pt-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{hour}</span>
                </div>

                <div className="flex-1 min-w-0">
                  {appt ? (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
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
                          {patientObj?.phone && (
                            <p className="text-[9px] text-slate-400 mt-0.5">{patientObj.phone}</p>
                          )}
                        </div>

                        <span
                          className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border shrink-0 ${
                            appt.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : appt.status === "confirmed"
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : appt.status === "canceled"
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
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
                          <a
                            href={`https://wa.me/${patientObj.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-500 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-0.5"
                          >
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </a>
                        )}
                        {appt.status !== "completed" && appt.status !== "canceled" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(appt, "confirmed")}
                              className="text-[9px] font-bold text-teal-700 bg-teal-50/50 hover:bg-teal-500 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => handleStatusChange(appt, "completed")}
                              className="text-[9px] font-bold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-500 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-0.5 cursor-pointer"
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
                          onClick={() => startEdit(appt)}
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
                  ) : googleEvt ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded uppercase">
                          Google
                        </span>
                        <span className="font-bold text-purple-800 text-xs">{googleEvt.summary}</span>
                      </div>
                      <p className="text-[9px] text-purple-500">
                        {formatGoogleTime(googleEvt.start)} - {formatGoogleTime(googleEvt.end)}
                      </p>
                      {googleEvt.description && (
                        <p className="text-[9px] text-slate-500 italic">{googleEvt.description}</p>
                      )}
                    </div>
                  ) : blocked ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-bold text-amber-700 uppercase">BLOQUEADO</span>
                        <span className="text-[9px] text-amber-600">- {blocked.reason}</span>
                      </div>
                      <button
                        onClick={() => onDeleteScheduleBlock(blocked.id)}
                        className="text-[9px] font-bold text-amber-600 bg-amber-100 hover:bg-amber-600 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3 inline" /> Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-2 text-slate-300 text-[11px] font-medium border-2 border-dashed border-slate-50/40 rounded-xl bg-slate-50/5">
                      Horário disponível
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {overflowAppointments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Outros Horários do Dia</h4>
              {overflowAppointments.map((appt) => {
                const patientObj = patients.find((p) => p.id === appt.patientId);
                return (
                  <div key={appt.id} className="flex gap-3 items-start p-3 rounded-xl border bg-blue-50/10 border-blue-100/70">
                    <div className="flex items-center gap-1.5 w-14 shrink-0 text-slate-500 font-bold text-[11px] pt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{appt.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
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
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : appt.status === "canceled"
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {appt.status === "completed" ? "Concluído" : appt.status === "confirmed" ? "Confirmado" : appt.status === "canceled" ? "Cancelado" : "Agendado"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-100/40">
                          <button onClick={() => startEdit(appt)} className="text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-500 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer">
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
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => { resetForm(); setShowAddForm(true); }}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-teal-600 text-white px-4 py-3 shadow-xl hover:bg-teal-700 transition-all lg:hidden cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs font-bold">Nova Consulta</span>
      </button>

      {/* Mobile bottom sheet form */}
      {showAddForm && (
        <div className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] lg:hidden" onClick={() => { setShowAddForm(false); resetForm(); }}>
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingAppt ? "Editar Consulta" : "Agendar Consulta"}
              </h3>
              <button onClick={() => { setShowAddForm(false); resetForm(); }} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500 cursor-pointer">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <ScheduleForm isMobile />
          </div>
        </div>
      )}
    </div>
  );
}
