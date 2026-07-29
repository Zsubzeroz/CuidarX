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
    const d = new Date(todayStr + "T00:00:00");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-hero-gradient p-6 rounded-2xl text-white shadow-luxury border border-[#1B523E] relative overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute inset-0 bg-dots-gold opacity-30 pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#C8A45A]/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-[#0A2B21]/60 blur-xl pointer-events-none" />
        <div className="flex items-center gap-4 relative">
          <img
            src={clinicLogo}
            alt="Logo Dra. Fabrícia Rodrigues"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#C8A45A]/50 shadow-lg hidden sm:block"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#C8A45A] font-semibold mb-1">Bem-vinda, Doutora</p>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight font-display">Fabrícia Rodrigues 👋</h2>
            <p className="text-white/60 text-xs mt-1">
              Seu consultório está pronto para os atendimentos de hoje.
            </p>
          </div>
        </div>
        <div className="flex gap-2 relative">
          <button
            onClick={onQuickSchedule}
            className="flex items-center gap-1.5 bg-[#C8A45A] hover:bg-[#D0A74F] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-gold transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
          <button
            onClick={() => onNavigate("assistente")}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Activity className="w-4 h-4 text-[#C8A45A]" /> Assistente IA
          </button>
        </div>
      </div>

      {/* Quick Actions (Ações Rápidas) */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ações Rápidas</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Button 1: Novo Agendamento */}
          <button
            onClick={onQuickSchedule}
            className="group flex items-center gap-3 bg-white border border-[#C8A45A]/15 hover:border-[#C8A45A]/40 hover:shadow-luxury p-4 rounded-2xl text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="bg-[#0F3B2E] text-[#C8A45A] p-2.5 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Novo Agendamento</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Agendar consulta</p>
            </div>
          </button>

          {/* Button 2: Cadastrar Cliente */}
          <button
            onClick={() => onNavigate("pacientes")}
            className="group flex items-center gap-3 bg-white border border-[#C8A45A]/15 hover:border-[#C8A45A]/40 hover:shadow-luxury p-4 rounded-2xl text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="bg-amber-500 text-white p-2.5 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Cadastrar Cliente</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Criar prontuário podal</p>
            </div>
          </button>

          {/* Button 3: Ficha de Anamnese */}
          <button
            onClick={() => onNavigate("anamnese")}
            className="group flex items-center gap-3 bg-white border border-[#C8A45A]/15 hover:border-[#C8A45A]/40 hover:shadow-luxury p-4 rounded-2xl text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="bg-indigo-500 text-white p-2.5 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Ficha de Anamnese</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Preencher ou imprimir</p>
            </div>
          </button>

          {/* Button 4: Abrir Caixa / Venda */}
          <button
            onClick={() => onNavigate("financeiro")}
            className="group flex items-center gap-3 bg-white border border-[#C8A45A]/15 hover:border-[#C8A45A]/40 hover:shadow-luxury p-4 rounded-2xl text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="bg-[#C8A45A] text-white p-2.5 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Abrir Caixa / Venda</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Registrar financeiro</p>
            </div>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="card-stat">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Pacientes</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1.5">{totalPatients}</h3>
            <p className="text-[10px] text-[#C8A45A] font-semibold flex items-center gap-1 mt-1.5">
              <TrendingUp className="w-3 h-3" /> Crescimento contínuo
            </p>
          </div>
          <div className="bg-[#0F3B2E] p-3 rounded-xl shadow-sm shrink-0">
            <Users className="w-5 h-5 text-[#C8A45A]" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="card-stat">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Consultas Hoje</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1.5">{todayAppointments.length}</h3>
            <p className="text-[10px] text-slate-400 mt-1.5">{new Date(todayStr + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long" })}</p>
          </div>
          <div className="bg-sky-500 p-3 rounded-xl shadow-sm shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="card-stat">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Receita Mensal</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1.5">
              R$ {monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-[#C8A45A] font-semibold mt-1.5">Procedimentos concluídos</p>
          </div>
          <div className="bg-[#C8A45A] p-3 rounded-xl shadow-sm shrink-0">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className={`card-stat ${
          diabeticActiveIssues.length > 0 ? "border-amber-200 bg-amber-50/30" : ""
        }`}>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Alertas Diabéticos</p>
            <h3 className="text-2xl font-bold mt-1.5 text-slate-800">{diabeticActiveIssues.length}</h3>
            <p className={`text-[10px] font-semibold mt-1.5 ${
              diabeticActiveIssues.length > 0 ? "text-amber-600" : "text-slate-400"
            }`}>
              {diabeticActiveIssues.length > 0 ? "⚠️ Requer atenção!" : "Nenhum caso crítico"}
            </p>
          </div>
          <div className={`p-3 rounded-xl shadow-sm shrink-0 ${
            diabeticActiveIssues.length > 0 ? "bg-amber-500" : "bg-slate-100"
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              diabeticActiveIssues.length > 0 ? "text-white" : "text-slate-400"
            }`} />
          </div>
        </div>
      </div>

      {/* Main Grid: Alerts and Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Critical patient alerts and visual chart */}
        <div className="lg:col-span-7 space-y-6">
          {/* Faturamento semanal chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-card">
            <div className="flex justify-between items-center mb-5">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Faturamento</p>
                <h3 className="text-sm font-semibold text-slate-700 mt-0.5">Fluxo semanal de receitas (R$)</h3>
              </div>
              <span className="text-[10px] text-[#C8A45A] bg-[#FBF8EE] px-3 py-1 rounded-full font-bold border border-[#E9D79E]">
                ● Sincronizado
              </span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F3B2E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#C8A45A" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: "10px", fill: "#94a3b8" }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: "10px", fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "12px",
                      border: "1px solid rgba(200,164,90,0.3)",
                      boxShadow: "0 4px 12px rgba(15,59,46,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Faturamento"
                    stroke="#0F3B2E"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorFaturamento)"
                    dot={{ fill: "#C8A45A", strokeWidth: 2, r: 3, stroke: "#fff" }}
                    activeDot={{ r: 5, fill: "#C8A45A", stroke: "#0F3B2E", strokeWidth: 2 }}
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
              <span className="text-xs font-semibold text-gold">
                {todayAppointments.length} consultas
              </span>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-[#F8FAFC] rounded-xl border border-dashed border-slate-200 text-center text-slate-400 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-xs font-semibold text-slate-500">Dia livre de consultas!</p>
                <p className="text-[10px] mt-1 text-slate-400">Aproveite para revisar prontuários e organizar as finanças.</p>
              </div>
            ) : (
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px]">
                {todayAppointments.map((appt) => {
                  const patientObj = patients.find((p) => p.id === appt.patientId);
                  return (
                    <div
                      key={appt.id}
                      className="border-l-4 border-[#0F3B2E] bg-[#F8FAFC] border border-slate-100 pl-3 pr-3.5 py-3 rounded-xl text-xs space-y-2 hover:border-l-[#C8A45A] hover:shadow-card transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800">{appt.patientName}</p>
                          <span className="text-[10px] text-[#0F3B2E] bg-[#D8E6E0] px-2 py-0.5 rounded-full font-semibold inline-block mt-0.5">
                            {appt.service}
                          </span>
                        </div>
                        <span className="font-bold text-white bg-[#0F3B2E] px-2.5 py-1 rounded-lg text-[11px] border border-[#C8A45A]/30">
                          {appt.time}
                        </span>
                      </div>

                      {patientObj && (
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
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
              className="mt-4 w-full text-center text-xs font-bold text-white bg-[#0F3B2E] hover:bg-[#1B523E] border border-[#C8A45A]/30 hover:border-[#C8A45A]/60 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Ver Agenda Completa →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
