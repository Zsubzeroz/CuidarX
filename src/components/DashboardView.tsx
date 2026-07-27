import { Patient, Appointment, FinanceRecord } from "../types";
// @ts-ignore
import clinicLogo from "../assets/images/clinic_logo_1783686122531.jpg";
import {
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Plus,
  TrendingUp,
  Activity,
  Phone,
  Clock,
  Heart,
  FileText,
  UserPlus,
  Wallet,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  finances: FinanceRecord[];
  onNavigate: (tab: string) => void;
  onQuickSchedule: () => void;
}

export default function DashboardView({
  patients,
  appointments,
  finances,
  onNavigate,
  onQuickSchedule,
}: DashboardProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  // Calcs
  const totalPatients = patients.length;
  const todayAppointments = appointments.filter((a) => a.date === todayStr);
  
  // Diabetic alerts
  const diabeticActiveIssues = patients.filter(
    (p) => p.isDiabetic && p.footIssues.some((issue) => issue.status === "active")
  );

  // Financial calculations
  const monthlyCompletedAppts = appointments.filter(
    (a) => a.status === "completed" && a.date.startsWith(currentMonthPrefix)
  );
  const monthlyRevenue = monthlyCompletedAppts.reduce((sum, a) => sum + a.price, 0);

  // Chart Data preparation: Last 7 days revenues
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() - (6 - i));
    const dStr = d.toISOString().split("T")[0];
    
    // Sum incomes on this day
    const dayIncome = finances
      .filter((f) => f.date === dStr && f.type === "income")
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      name: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      Faturamento: dayIncome,
    };
  });

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-800 to-teal-950 p-6 rounded-2xl text-white shadow-md border border-teal-700/20">
        <div className="flex items-center gap-4">
          <img
            src={clinicLogo}
            alt="Logo Dra. Fabrícia Rodrigues"
            className="w-16 h-16 rounded-full object-cover border-2 border-teal-400/30 shadow-lg hidden sm:block"
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Olá, Dra. Fabrícia! 👋</h2>
            <p className="text-teal-200 text-xs mt-1">
              Seu consultório está pronto para os atendimentos de hoje.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onQuickSchedule}
            className="flex items-center gap-1 bg-teal-500 hover:bg-teal-400 text-teal-950 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
          <button
            onClick={() => onNavigate("assistente")}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4 text-teal-300" /> Assistente IA Podal
          </button>
        </div>
      </div>

      {/* Quick Actions (Ações Rápidas) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">Ações Rápidas</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Button 1: Novo Agendamento */}
          <button
            onClick={onQuickSchedule}
            className="flex items-center gap-3.5 bg-sky-50 border border-sky-100/80 hover:bg-sky-100/50 p-4 rounded-2xl text-left cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="bg-sky-500 text-white p-2.5 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-sky-950">Novo Agendamento</h4>
              <p className="text-[10px] text-sky-600 mt-0.5">Agendar consulta na clínica</p>
            </div>
          </button>

          {/* Button 2: Cadastrar Cliente */}
          <button
            onClick={() => onNavigate("pacientes")}
            className="flex items-center gap-3.5 bg-amber-50 border border-amber-100/80 hover:bg-amber-100/50 p-4 rounded-2xl text-left cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="bg-amber-500 text-white p-2.5 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">Cadastrar Cliente</h4>
              <p className="text-[10px] text-amber-700 mt-0.5">Criar novo prontuário podal</p>
            </div>
          </button>

          {/* Button 3: Ficha de Anamnese */}
          <button
            onClick={() => onNavigate("anamnese")}
            className="flex items-center gap-3.5 bg-indigo-50 border border-indigo-100/80 hover:bg-indigo-100/50 p-4 rounded-2xl text-left cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="bg-indigo-500 text-white p-2.5 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950">Ficha de Anamnese</h4>
              <p className="text-[10px] text-indigo-700 mt-0.5">Preencher ou imprimir ficha</p>
            </div>
          </button>

          {/* Button 4: Abrir Caixa / Venda */}
          <button
            onClick={() => onNavigate("financeiro")}
            className="flex items-center gap-3.5 bg-emerald-50 border border-emerald-100/80 hover:bg-emerald-100/50 p-4 rounded-2xl text-left cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="bg-emerald-500 text-white p-2.5 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Abrir Caixa / Venda</h4>
              <p className="text-[10px] text-emerald-700 mt-0.5">Registrar fluxo financeiro</p>
            </div>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Pacientes</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{totalPatients}</h3>
            <p className="text-[10px] text-teal-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Crescimento contínuo
            </p>
          </div>
          <div className="bg-teal-50 p-2.5 rounded-xl">
            <Users className="w-5 h-5 text-teal-600" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Consultas Hoje</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">{todayAppointments.length}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Dia {new Date(todayStr).toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="bg-teal-50 p-2.5 rounded-xl">
            <Calendar className="w-5 h-5 text-teal-600" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Receita (Julho)</p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mt-1">
              R$ {monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-1">Doações e procedimentos concluidos</p>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
          diabeticActiveIssues.length > 0 ? "border-amber-100" : "border-slate-100"
        }`}>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Alertas Diabéticos</p>
            <h3 className="text-xl md:text-2xl font-bold mt-1 text-slate-800">
              {diabeticActiveIssues.length}
            </h3>
            <p className={`text-[10px] font-medium mt-1 ${
              diabeticActiveIssues.length > 0 ? "text-amber-600" : "text-slate-500"
            }`}>
              {diabeticActiveIssues.length > 0 ? "Requer atenção imediata!" : "Nenhum caso crítico ativo"}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl ${
            diabeticActiveIssues.length > 0 ? "bg-amber-50" : "bg-slate-50"
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              diabeticActiveIssues.length > 0 ? "text-amber-600" : "text-slate-400"
            }`} />
          </div>
        </div>
      </div>

      {/* Main Grid: Alerts and Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Critical patient alerts and visual chart */}
        <div className="lg:col-span-7 space-y-6">
          {/* Faturamento semanal chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento</h4>
                <h3 className="text-sm font-semibold text-slate-700">Fluxo semanal de receitas (R$)</h3>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                Sincronizado
              </span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: "10px", fill: "#94a3b8" }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px", fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #f1f5f9" }} />
                  <Area
                    type="monotone"
                    dataKey="Faturamento"
                    stroke="#0d9488"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorFaturamento)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diabetic clinical alerts panel */}
          {diabeticActiveIssues.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200/80 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Alertas Críticos de Pé Diabético</h3>
              </div>
              <p className="text-xs text-amber-700">
                Os seguintes pacientes diabéticos possuem patologias ativas no mapa podal. Acompanhamento rigoroso de cicatrização é imperativo:
              </p>
              <div className="space-y-2">
                {diabeticActiveIssues.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-white border border-amber-200 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{patient.name}</p>
                      <p className="text-slate-500 text-[10px]">Diagnóstico ativo:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patient.footIssues
                          .filter((issue) => issue.status === "active")
                          .map((issue) => (
                            <span
                              key={issue.id}
                              className="bg-rose-50 text-rose-700 border border-rose-100 text-[9px] px-1.5 py-0.5 rounded font-medium"
                            >
                              {issue.condition} ({issue.foot === "left" ? "Esq" : "Dir"})
                            </span>
                          ))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate("pacientes");
                        // Scroll or open patient details (the main page state will handle this)
                      }}
                      className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-1.5 rounded-lg transition-colors text-center"
                    >
                      Acessar Prontuário
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Agenda de Hoje */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agenda de Hoje</h4>
              <span className="text-xs font-semibold text-teal-600">
                {todayAppointments.length} consultas
              </span>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 flex-1">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium">Sem consultas agendadas para hoje.</p>
                <p className="text-[10px] mt-1 text-slate-400">Aproveite para organizar prontuários ou revisar finanças.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px]">
                {todayAppointments.map((appt) => {
                  const patientObj = patients.find((p) => p.id === appt.patientId);
                  return (
                    <div
                      key={appt.id}
                      className="border border-slate-100 bg-slate-50/50 p-3.5 rounded-xl text-xs space-y-2 hover:border-teal-100 hover:bg-teal-50/10 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800">{appt.patientName}</p>
                          <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium inline-block mt-0.5">
                            {appt.service}
                          </span>
                        </div>
                        <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200">
                          {appt.time}
                        </span>
                      </div>

                      {patientObj && (
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {patientObj.phone}
                          </span>
                          {patientObj.isDiabetic && (
                            <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                              <Heart className="w-3 h-3 text-amber-500 fill-amber-500" /> Diabético
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => onNavigate("agenda")}
              className="mt-4 w-full text-center text-xs font-semibold text-teal-700 hover:text-white bg-teal-50 hover:bg-teal-600 border border-teal-100 py-2.5 rounded-xl transition-all"
            >
              Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
