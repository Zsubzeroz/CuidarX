import React, { useState, useEffect } from "react";
import { FinanceRecord } from "../types";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface FinanceViewProps {
  finances: FinanceRecord[];
  onAddFinanceRecord: (record: Omit<FinanceRecord, "id">) => void;
  onDeleteFinanceRecord: (id: string) => Promise<void>;
}

export default function FinanceView({ finances, onAddFinanceRecord, onDeleteFinanceRecord }: FinanceViewProps) {
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("Serviço");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const categories = {
    income: ["Serviço", "Produto", "Curso/Palestra", "Outros"],
    expense: ["Materiais", "Aluguel", "Energia/Luz", "Internet/Telefone", "Taxas/Impostos", "Marketing", "Outros"],
  };

  const handleTypeChange = (newType: "income" | "expense") => {
    setType(newType);
    setCategory(categories[newType][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    onAddFinanceRecord({
      date,
      type,
      category,
      amount: Number(amount),
      description,
    });

    setAmount("");
    setDescription("");
  };

  const handleDeleteRecord = async (record: FinanceRecord) => {
    if (!confirm(`Excluir o lançamento "${record.description}" no valor de R$ ${record.amount.toFixed(2)}?`)) return;
    try {
      await onDeleteFinanceRecord(record.id);
      setFeedback({ type: "success", message: "Lançamento excluído com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir lançamento:", err);
      setFeedback({ type: "error", message: "Erro ao excluir lançamento. Tente novamente." });
    }
  };

  // Financial Metrics
  const totalIncome = finances
    .filter((f) => f.type === "income")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalExpense = finances
    .filter((f) => f.type === "expense")
    .reduce((sum, f) => sum + f.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Pie Chart Data: Expenses by Category
  const expenseByCategory = finances
    .filter((f) => f.type === "expense")
    .reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + f.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#0f766e", "#0d9488", "#14b8a6", "#2dd4bf", "#99f6e4", "#ccfbf1", "#115e59"];

  // Bar Chart Data: Incomes & Expenses by day for the last 15 days
  const todayStr = new Date().toISOString().split("T")[0];
  const last15Days = Array.from({ length: 15 })
    .map((_, i) => {
      const d = new Date(todayStr + "T00:00:00");
      d.setDate(d.getDate() - (14 - i));
      const dStr = d.toISOString().split("T")[0];

      const inc = finances
        .filter((f) => f.date === dStr && f.type === "income")
        .reduce((sum, f) => sum + f.amount, 0);

      const exp = finances
        .filter((f) => f.date === dStr && f.type === "expense")
        .reduce((sum, f) => sum + f.amount, 0);

      return {
        date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        Receitas: inc,
        Despesas: exp,
      };
    });

  // Filtered transactions for the ledger
  const filteredLedger = finances
    .filter((f) => {
      const matchesSearch = f.description.toLowerCase().includes(searchQuery.toLowerCase()) || f.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || f.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => new Date(b.date + "T00:00:00").getTime() - new Date(a.date + "T00:00:00").getTime());

  // Distinct categories list for filter dropdown
  const allUsedCategories = Array.from(new Set(finances.map((f) => f.category)));

  return (
    <div id="finance-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {feedback && (
        <div className={`fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-xs font-bold text-white page-enter ${feedback.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {feedback.message}
        </div>
      )}
      {/* LEFT SIDE: Cash Entry Form & Overview Cards */}
      <div className="lg:col-span-4 space-y-6">
        {/* Overview cards */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 text-left">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metas e Fluxo de Caixa</h4>
          
          <div className="space-y-3">
            {/* Income Card */}
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Recebido</span>
                <p className="text-sm font-extrabold text-slate-800">
                  R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg text-gold">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            {/* Expense Card */}
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total de Custos</span>
                <p className="text-sm font-extrabold text-slate-800">
                  R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>

            {/* Balance Card */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              netBalance >= 0 ? "bg-emerald-50/50 border-emerald-100 text-emerald-900" : "bg-rose-50/50 border-rose-100 text-rose-900"
            }`}>
              <div>
                <span className="text-[10px] font-bold uppercase opacity-75">Saldo Líquido</span>
                <p className="text-base font-extrabold">
                  R$ {netBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg ${netBalance >= 0 ? "bg-gold text-white" : "bg-rose-600 text-white"}`}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Add Entry Form */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-left">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <PlusCircle className="w-5 h-5 text-gold" />
            Lançar Fluxo de Caixa
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Toggle Income/Expense */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === "income" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400"
                }`}
              >
                Receita (+)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === "expense" ? "bg-white text-rose-700 shadow-sm" : "text-slate-400"
                }`}
              >
                Despesa (-)
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
              >
                {categories[type].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor (R$):</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data:</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descrição / Detalhe:</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Creme cicatrizante com Ureia 20%"
                className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>

            <button
              type="submit"
              className="w-full text-center text-xs font-bold text-white bg-brand hover:bg-brand-700 py-2.5 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              Registrar Lançamento
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE: Financial Charts and Ledger Table */}
      <div className="lg:col-span-8 space-y-6 text-left">
        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue and Expense evolution chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico de Fluxo</h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last15Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickLine={false} style={{ fontSize: "10px", fill: "#94a3b8" }} />
                  <YAxis tickLine={false} style={{ fontSize: "10px", fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="Receitas" fill="#0d9488" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expenses Pie Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distribuição de Despesas</h4>
            {pieData.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">Nenhuma despesa registrada.</p>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
                <div className="h-32 w-1/2 min-w-[120px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {pieData.slice(0, 4).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-slate-600 truncate max-w-[100px]">{entry.name}:</span>
                      <span className="text-slate-500">R$ {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Historic Cash Ledger Table */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h4 className="text-sm font-bold text-slate-800">Livro-Caixa e Lançamentos</h4>
            
            <div className="flex flex-wrap gap-2">
              {/* Ledger search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-[11px] pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              {/* Ledger Filter category */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-[11px] bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              >
                <option value="all">Todas Categorias</option>
                {allUsedCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3 text-right">Valor (R$)</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Nenhum lançamento financeiro encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredLedger.slice(0, 10).map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-semibold text-slate-500">
                        {new Date(record.date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.type === "income"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}>
                          {record.type === "income" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-600">{record.category}</td>
                      <td className="p-3 text-slate-600 truncate max-w-[200px]" title={record.description}>
                        {record.description}
                      </td>
                      <td className={`p-3 text-right font-bold ${
                        record.type === "income" ? "text-gold" : "text-rose-600"
                      }`}>
                        {record.type === "income" ? "+" : "-"} R$ {record.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteRecord(record)}
                          className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white px-2 py-1.5 rounded-lg border border-rose-100 hover:border-rose-600 transition-all cursor-pointer"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filteredLedger.length > 10 && (
            <p className="text-[10px] text-slate-400 italic text-center mt-2">
              Mostrando os 10 lançamentos mais recentes de {filteredLedger.length} totais.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
