import { clinicConfig } from "../config";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function addDays(y: number, m: number, d: number, days: number) {
  const dt = new Date(y, m - 1, d + days);
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

export function generateGoogleCalendarLink(params: {
  date: string;
  time: string;
  durationMin?: number;
  procedure: string;
  location?: string;
}): string {
  const { date, time, durationMin = 60, procedure, location } = params;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  const totalMinStart = hh * 60 + mm;
  const utcTotalMinStart = totalMinStart + 3 * 60;
  const startDayOffset = Math.floor(utcTotalMinStart / (24 * 60));
  const utcStartH = Math.floor((utcTotalMinStart % (24 * 60)) / 60);
  const utcStartM = utcTotalMinStart % 60;
  const start = addDays(y, m, d, startDayOffset);

  const totalMinEnd = totalMinStart + durationMin;
  const utcTotalMinEnd = totalMinEnd + 3 * 60;
  const endDayOffset = Math.floor(utcTotalMinEnd / (24 * 60));
  const utcEndH = Math.floor((utcTotalMinEnd % (24 * 60)) / 60);
  const utcEndM = utcTotalMinEnd % 60;
  const end = addDays(y, m, d, endDayOffset);

  const dtStart = `${start.y}${pad(start.m)}${pad(start.d)}T${pad(utcStartH)}${pad(utcStartM)}00Z`;
  const dtEnd = `${end.y}${pad(end.m)}${pad(end.d)}T${pad(utcEndH)}${pad(utcEndM)}00Z`;

  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: procedure,
    dates: `${dtStart}/${dtEnd}`,
    details: `Consulta com ${clinicConfig.doctorName}. Procedimento: ${procedure}`,
  });
  if (location) p.set("location", location);

  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
