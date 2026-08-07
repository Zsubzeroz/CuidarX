/**
 * Teste local: Recorrência de Bloqueio de Horário
 *
 * Valida a lógica de expansão de blocos recorrentes
 * sem conectar ao Firestore.
 *
 * Rodar: npx tsx src/services/testRecurrence.ts
 */

// ============================================================
// Types (espelho de types.ts)
// ============================================================
type RecurrenceFrequency = "none" | "diaria" | "semanal" | "dias_uteis" | "personalizada";

interface ScheduleBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  recurrence?: {
    frequency: RecurrenceFrequency;
    daysOfWeek: number[]; // 0=Dom, 1=Seg, ..., 6=Sáb
  };
}

// ============================================================
// Lógica de expansão (espelho de CalendarView.tsx:826-844)
// ============================================================
function expandBlocksForDate(
  scheduleBlocks: ScheduleBlock[],
  selectedDate: string
): ScheduleBlock[] {
  const selectedDateObj = new Date(selectedDate + "T12:00:00-03:00");
  const selectedDayOfWeek = selectedDateObj.getDay();

  return scheduleBlocks.filter((b) => {
    // Direct date match (non-recurring or one-off)
    if (b.date === selectedDate) return true;

    // Recurring block: check if this day matches
    if (b.recurrence && b.recurrence.frequency !== "none") {
      const { frequency, daysOfWeek } = b.recurrence;
      if (frequency === "diaria") return true;
      if (frequency === "dias_uteis") return selectedDayOfWeek >= 1 && selectedDayOfWeek <= 5;
      if ((frequency === "semanal" || frequency === "personalizada") && daysOfWeek?.length > 0) {
        return daysOfWeek.includes(selectedDayOfWeek);
      }
    }
    return false;
  });
}

// ============================================================
// Cenários de teste
// ============================================================
const lunchBlock: ScheduleBlock = {
  id: "test-lunch",
  date: "", // vazio = recorrente
  startTime: "12:00",
  endTime: "13:30",
  reason: "Almoço",
  recurrence: {
    frequency: "semanal",
    daysOfWeek: [1, 2, 3, 4, 5], // Seg a Sex
  },
};

const oneOffBlock: ScheduleBlock = {
  id: "test-vacation",
  date: "2026-08-12",
  startTime: "08:00",
  endTime: "20:00",
  reason: "Férias",
};

const dailyBlock: ScheduleBlock = {
  id: "test-cleaning",
  date: "",
  startTime: "20:00",
  endTime: "20:30",
  reason: "Limpeza",
  recurrence: {
    frequency: "diaria",
    daysOfWeek: [],
  },
};

const weekdayBlock: ScheduleBlock = {
  id: "test-weekday",
  date: "",
  startTime: "13:30",
  endTime: "14:00",
  reason: "Reunião Equipe",
  recurrence: {
    frequency: "dias_uteis",
    daysOfWeek: [],
  },
};

const blocks = [lunchBlock, oneOffBlock, dailyBlock, weekdayBlock];

// ============================================================
// Helper: nome do dia da semana
// ============================================================
function dayName(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00-03:00");
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.getDay()];
}

function weekdayNum(dateStr: string): number {
  return new Date(dateStr + "T12:00:00-03:00").getDay();
}

// ============================================================
// Execução dos testes
// ============================================================
const testDates = [
  "2026-08-08", // Sábado
  "2026-08-09", // Domingo
  "2026-08-10", // Segunda
  "2026-08-11", // Terça
  "2026-08-12", // Quarta (também tem bloqueio one-off "Férias")
  "2026-08-13", // Quinta
  "2026-08-14", // Sexta
];

console.log("=".repeat(70));
console.log("  TESTE: Recorrência de Bloqueio de Horário");
console.log("=".repeat(70));
console.log();

console.log("Blocos cadastrados:");
console.log(`  1. "${lunchBlock.reason}" — ${lunchBlock.startTime}~${lunchBlock.endTime} — Seg a Sex (semanal)`);
console.log(`  2. "${oneOffBlock.reason}" — ${oneOffBlock.startTime}~${oneOffBlock.endTime} — ${oneOffBlock.date} (one-off)`);
console.log(`  3. "${dailyBlock.reason}" — ${dailyBlock.startTime}~${dailyBlock.endTime} — Todo dia (diária)`);
console.log(`  4. "${weekdayBlock.reason}" — ${weekdayBlock.startTime}~${weekdayBlock.endTime} — Dias úteis`);
console.log();

console.log("-".repeat(70));
console.log(`${"Data".padEnd(12)} ${"Dia".padEnd(5)} ${" weekday#".padEnd(5)} | Blocos Exibidos`);
console.log("-".repeat(70));

let allPassed = true;

for (const date of testDates) {
  const matched = expandBlocksForDate(blocks, date);
  const wn = weekdayNum(date);
  const names = matched.map((b) => b.reason).join(", ") || "(nenhum)";
  const dowMatch = lunchBlock.recurrence!.daysOfWeek.includes(wn);

  console.log(`${date.padEnd(12)} ${dayName(date).padEnd(5)} ${String(wn).padEnd(5)} | ${names}`);

  // Validações
  const expectsLunch = dowMatch; // Seg=1..Sex=5
  const hasLunch = matched.some((b) => b.id === "test-lunch");
  if (expectsLunch !== hasLunch) {
    console.log(`  ❌ ERRO: Almoço deveria ${expectsLunch ? "aparecer" : "NÃO aparecer"} nesta data`);
    allPassed = false;
  }

  const expectsOneOff = date === oneOffBlock.date;
  const hasOneOff = matched.some((b) => b.id === "test-vacation");
  if (expectsOneOff !== hasOneOff) {
    console.log(`  ❌ ERRO: Férias (one-off) deveria ${expectsOneOff ? "aparecer" : "NÃO aparecer"}`);
    allPassed = false;
  }

  const hasDaily = matched.some((b) => b.id === "test-cleaning");
  if (!hasDaily) {
    console.log(`  ❌ ERRO: Limpeza (diária) deveria sempre aparecer`);
    allPassed = false;
  }

  const isWeekday = wn >= 1 && wn <= 5;
  const hasWeekday = matched.some((b) => b.id === "test-weekday");
  if (isWeekday !== hasWeekday) {
    console.log(`  ❌ ERRO: Reunião (dias úteis) deveria ${isWeekday ? "aparecer" : "NÃO aparecer"}`);
    allPassed = false;
  }
}

console.log("-".repeat(70));
console.log();

if (allPassed) {
  console.log("✅ TODOS OS TESTES PASSARAM — Lógica de recorrência validada!");
} else {
  console.log("❌ ALGUNS TESTES FALHARAM — Revisar lógica de expansão");
  process.exit(1);
}

// ============================================================
// Teste adicional: slot de 30min
// ============================================================
console.log();
console.log("=".repeat(70));
console.log("  TESTE: Altura dos slots (30min = 80px)");
console.log("=".repeat(70));
console.log();

function slotHeight(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const durationMin = (eh * 60 + em) - (sh * 60 + sm);
  return Math.round((durationMin / 30) * 80);
}

const slots = [
  { start: "12:00", end: "12:30", label: "30 min" },
  { start: "12:00", end: "13:00", label: "1h" },
  { start: "12:00", end: "13:30", label: "1h30 (Almoço)" },
  { start: "08:00", end: "20:00", label: "12h (Férias)" },
];

for (const s of slots) {
  const h = slotHeight(s.start, s.end);
  console.log(`  ${s.label.padEnd(20)} ${s.start}~${s.end} → ${h}px`);
}

console.log();
console.log("✅ Validação de slots concluída!");
