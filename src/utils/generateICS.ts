import { clinicConfig } from "../config";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toICSDate(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return `${y}${pad(m)}${pad(d)}T${pad(hh)}${pad(mm)}00`;
}

export function generateICSFile(params: {
  date: string;
  time: string;
  durationMin?: number;
  procedure: string;
  patientName: string;
  location?: string;
}): void {
  const { date, time, durationMin = 60, procedure, patientName, location } = params;

  const dtStart = toICSDate(date, time);

  const [hh, mm] = time.split(":").map(Number);
  const endMin = hh * 60 + mm + durationMin;
  const endH = Math.floor(endMin / 60);
  const endM = endMin % 60;
  const dtEnd = toICSDate(date, `${pad(endH)}:${pad(endM)}`);

  const now = new Date();
  const dtStamp =
    now.getUTCFullYear().toString() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    "T" +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds()) +
    "Z";

  const host = clinicConfig.clinicUrl ? new URL(clinicConfig.clinicUrl).hostname : "cuidarx.app";
  const uid = `appt-${date}-${time}-${Date.now()}@${host}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${clinicConfig.clinicName}//Agendamento//PT`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-TIMEZONE:America/Sao_Paulo",
    "",
    "BEGIN:VTIMEZONE",
    "TZID:America/Sao_Paulo",
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:BRT",
    "END:STANDARD",
    "END:VTIMEZONE",
    "",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=America/Sao_Paulo:${dtStart}`,
    `DTEND;TZID=America/Sao_Paulo:${dtEnd}`,
    `SUMMARY:${procedure} - ${patientName}`,
    `DESCRIPTION:Consulta agendada com ${clinicConfig.doctorName}. Procedimento: ${procedure}`,
    location ? `LOCATION:${location}` : "",
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Lembrete: sua consulta é em 1 hora",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const icsContent = lines.filter((l) => l !== undefined).join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `agendamento-${date}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
