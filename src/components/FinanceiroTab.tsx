import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  Calendar,
  Wallet,
  PieChart,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  value: number;
  date: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [];

export const FinanceiroTab: React.FC<{professionalId?: string}> = ({professionalId}) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const key = `cuidarx_transactions_${professionalId || 'global'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved transactions', e);
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [search, setSearch] = useState('');

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    const key = `cuidarx_transactions_${professionalId || 'global'}`;
    localStorage.setItem(key, JSON.stringify(transactions));
  }, [transactions, professionalId]);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newType, setNewType] = useState<'income' | 'expense'>('income');
  const [newCategory, setNewCategory] = useState('Procedimento Clínico');
  const [newDesc, setNewDesc] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDate, setNewDate] = useState('26 de Maio, 2026');

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.value, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0);

  const netBalance = totalIncome - totalExpense;

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newValue.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!newDesc.trim() || isNaN(val)) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: newType,
      category: newCategory,
      description: newDesc.trim(),
      value: val,
      date: newDate,
    };

    setTransactions([newTx, ...transactions]);
    setNewDesc('');
    setNewValue('');
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (search) {
      const match =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-24 no-scrollbar space-y-6">
      {/* Header matching user's SaaS Screenshot 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4D8C4]">
        <div>
          <h1 className="font-fraunces text-[22px] font-semibold text-[#14261C]">
            Caixa & Financeiro
          </h1>
          <p className="text-[13px] text-[#55695E] mt-0.5">
            Fluxo de caixa, controle de entradas de consultas e despesas do consultório
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>{isFormOpen ? 'Fechar Lançamento' : '+ Novo Lançamento'}</span>
        </button>
      </div>

      {/* KPI Cards (Screenshot 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Recebido */}
        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#55695E] uppercase tracking-wider">
              Total Recebido
            </span>
            <span className="p-2 rounded-xl bg-[#E3EEEC] text-[#0F766E]">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <div className="text-[24px] sm:text-[26px] font-bold text-[#0F766E] mt-2">
            R$ {totalIncome.toFixed(2).replace('.', ',')}
          </div>
          <span className="text-[11px] text-[#0F766E] font-semibold flex items-center gap-1 mt-1">
            +18.4% em relação ao mês anterior
          </span>
        </div>

        {/* Total de Custos */}
        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#55695E] uppercase tracking-wider">
              Total de Custos
            </span>
            <span className="p-2 rounded-xl bg-[#FEE2E2] text-[#DC2626]">
              <ArrowDownRight size={18} />
            </span>
          </div>
          <div className="text-[24px] sm:text-[26px] font-bold text-[#DC2626] mt-2">
            R$ {totalExpense.toFixed(2).replace('.', ',')}
          </div>
          <span className="text-[11px] text-[#55695E] font-medium mt-1 block">
            Insumos, autoclave e materiais
          </span>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-[#133023] text-white rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#A7F3D0] uppercase tracking-wider">
              Saldo Líquido
            </span>
            <span className="p-2 rounded-xl bg-[#214D39] text-[#4ADE80]">
              <Wallet size={18} />
            </span>
          </div>
          <div className="text-[24px] sm:text-[26px] font-bold text-white mt-2">
            R$ {netBalance.toFixed(2).replace('.', ',')}
          </div>
          <span className="text-[11px] text-[#A7F3D0] font-medium mt-1 block">
            Margem clínica saudável (+74%)
          </span>
        </div>
      </div>

      {/* NEW TRANSACTION FORM */}
      {isFormOpen && (
        <form
          onSubmit={handleAddTransaction}
          className="bg-[#FFFDF9] border border-[#0F766E] rounded-2xl p-5 shadow-sm space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E4D8C4]">
            <h3 className="font-fraunces text-[16px] font-semibold text-[#14261C]">
              Registrar Lançamento no Fluxo de Caixa
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewType('income')}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold ${
                  newType === 'income' ? 'bg-[#0F766E] text-white' : 'bg-[#FAF8F5] text-[#55695E]'
                }`}
              >
                + Receita (Entrada)
              </button>
              <button
                type="button"
                onClick={() => setNewType('expense')}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold ${
                  newType === 'expense' ? 'bg-[#DC2626] text-white' : 'bg-[#FAF8F5] text-[#55695E]'
                }`}
              >
                - Despesa (Saída)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                Descrição *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Consulta Podologia Geral"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
              >
                <option value="Procedimento Clínico">Procedimento Clínico</option>
                <option value="Produtos Podológicos">Produtos Podológicos</option>
                <option value="Materiais & Descartáveis">Materiais & Descartáveis</option>
                <option value="Esterilização & Autoclave">Esterilização & Autoclave</option>
                <option value="Aluguel & Infraestrutura">Aluguel & Infraestrutura</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                Valor (R$) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 150,00"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#E4D8C4] text-[12px] font-semibold text-[#55695E]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#0F766E] text-white text-[12px] font-bold shadow-xs"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#FAF8F5] border border-[#E4D8C4] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-white border border-[#E4D8C4] rounded-xl px-3 py-2 shadow-2xs">
          <Search size={15} className="text-[#6B7280]" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-[12.5px] text-[#14261C] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              filterType === 'all'
                ? 'bg-[#14261C] text-white'
                : 'bg-white text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Todos ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              filterType === 'income'
                ? 'bg-[#0F766E] text-white'
                : 'bg-white text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Receitas
          </button>
          <button
            type="button"
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              filterType === 'expense'
                ? 'bg-[#DC2626] text-white'
                : 'bg-white text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Despesas
          </button>
        </div>
      </div>

      {/* Livro-Caixa Table (Screenshot 4) */}
      <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-[#E4D8C4] flex items-center justify-between">
          <h3 className="font-bold text-[14px] text-[#14261C]">
            Livro-Caixa & Movimentações Recentes
          </h3>
          <span className="text-[12px] text-[#55695E]">
            {filtered.length} registros exibidos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E4D8C4] text-[#55695E] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4D8C4]/60">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                  <td className="py-3 px-4 text-[#55695E] font-medium">{t.date}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold inline-block ${
                        t.type === 'income'
                          ? 'bg-[#E3EEEC] text-[#0F766E]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                      }`}
                    >
                      {t.type === 'income' ? '+ Receita' : '- Despesa'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#14261C]">{t.category}</td>
                  <td className="py-3 px-4 text-[#55695E]">{t.description}</td>
                  <td
                    className={`py-3 px-4 text-right font-bold ${
                      t.type === 'income' ? 'text-[#0F766E]' : 'text-[#DC2626]'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'} R$ {t.value.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="text-[#9CA3AF] hover:text-[#DC2626] p-1 transition-colors"
                      title="Excluir lançamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
