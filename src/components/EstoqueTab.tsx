import React, { useState } from 'react';
import {
  Package,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  category: 'Descartáveis' | 'Instrumentais' | 'Medicamentos / Tópicos' | 'Curativos';
  quantity: number;
  minQuantity: number;
  unit: string;
  expiryDate?: string;
  autoclaveStatus?: 'Esterilizado' | 'Pendente' | 'Não Requer';
  lotNumber?: string;
}

const INITIAL_STOCK: StockItem[] = [
  {
    id: 'st-1',
    name: 'Lâminas de Bisturi Descartáveis nº 15 (Carbono)',
    category: 'Descartáveis',
    quantity: 140,
    minQuantity: 50,
    unit: 'unidades',
    expiryDate: '12/2028',
    autoclaveStatus: 'Não Requer',
    lotNumber: 'L-98412',
  },
  {
    id: 'st-2',
    name: 'Alicates de Cutícula & Espícula em Inox Cirúrgico',
    category: 'Instrumentais',
    quantity: 18,
    minQuantity: 10,
    unit: 'unidades',
    autoclaveStatus: 'Esterilizado',
    lotNumber: 'Ciclo Auto-04',
  },
  {
    id: 'st-3',
    name: 'Envelopes de Grau Cirúrgico com Indicador Térmico',
    category: 'Descartáveis',
    quantity: 350,
    minQuantity: 100,
    unit: 'unidades',
    expiryDate: '06/2029',
    autoclaveStatus: 'Não Requer',
  },
  {
    id: 'st-4',
    name: 'Órteses de Titânio & Fita com Memória Elástica',
    category: 'Instrumentais',
    quantity: 8,
    minQuantity: 15,
    unit: 'kits',
    autoclaveStatus: 'Não Requer',
    lotNumber: 'ORT-2026',
  },
  {
    id: 'st-5',
    name: 'Sulfadiazina de Prata 1% & Pomada Cicatrizante',
    category: 'Medicamentos / Tópicos',
    quantity: 4,
    minQuantity: 5,
    unit: 'bisnagas',
    expiryDate: '08/2027',
    autoclaveStatus: 'Não Requer',
    lotNumber: 'MED-771',
  },
  {
    id: 'st-6',
    name: 'Monofilamento de Semmes-Weinstein 10g (Rastreio)',
    category: 'Instrumentais',
    quantity: 6,
    minQuantity: 2,
    unit: 'estojos',
    autoclaveStatus: 'Esterilizado',
  },
];

export const EstoqueTab: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>(INITIAL_STOCK);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const lowStockCount = stock.filter((s) => s.quantity <= s.minQuantity).length;
  const sterilizedCount = stock.filter((s) => s.autoclaveStatus === 'Esterilizado').length;

  const filtered = stock.filter((s) => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (search) {
      const match =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-3 pb-24 no-scrollbar space-y-6">
      {/* Header matching Screenshot 6 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4D8C4]">
        <div>
          <h1 className="font-fraunces text-[22px] font-semibold text-[#14261C]">
            Gestão de Estoque & Autoclave
          </h1>
          <p className="text-[13px] text-[#55695E] mt-0.5">
            Controle rigoroso de materiais descartáveis, instrumentais esterilizados e reposição
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#E3EEEC] text-[#0F766E] text-[12px] font-bold flex items-center gap-1.5 border border-[#0F766E]/30">
            <ShieldCheck size={16} />
            Autoclave Hospitalar Conforme
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11.5px] font-bold text-[#55695E] uppercase tracking-wider">
            Total de Itens
          </span>
          <div className="text-[24px] font-bold text-[#14261C] mt-1">
            {stock.length} cadastrados
          </div>
          <span className="text-[11px] text-[#55695E]">Materiais ativos no inventário</span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11.5px] font-bold text-[#55695E] uppercase tracking-wider">
            Instrumentos Esterilizados
          </span>
          <div className="text-[24px] font-bold text-[#0F766E] mt-1">
            {sterilizedCount} lotes prontos
          </div>
          <span className="text-[11px] text-[#0F766E] font-semibold">100% de biossegurança ativa</span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11.5px] font-bold text-[#DC2626] uppercase tracking-wider">
            Alertas de Reposição
          </span>
          <div className="text-[24px] font-bold text-[#DC2626] mt-1">
            {lowStockCount} itens críticos
          </div>
          <span className="text-[11px] text-[#DC2626] font-semibold">
            Quantidade próxima ou abaixo da cota mínima
          </span>
        </div>
      </div>

      {/* Filter and search */}
      <div className="bg-[#FAF8F5] border border-[#E4D8C4] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-white border border-[#E4D8C4] rounded-xl px-3 py-2 shadow-2xs">
          <Search size={15} className="text-[#6B7280]" />
          <input
            type="text"
            placeholder="Buscar insumo ou lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-[12.5px] text-[#14261C] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              categoryFilter === 'all'
                ? 'bg-[#14261C] text-white'
                : 'bg-white text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('Descartáveis')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              categoryFilter === 'Descartáveis'
                ? 'bg-[#0F766E] text-white'
                : 'bg-white text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Descartáveis
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('Instrumentais')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              categoryFilter === 'Instrumentais'
                ? 'bg-[#0F766E] text-white'
                : 'bg-white text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Instrumentais
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E4D8C4] text-[#55695E] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Item de Estoque</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-center">Quantidade</th>
                <th className="py-3 px-4">Validade / Lote</th>
                <th className="py-3 px-4 text-center">Autoclave</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4D8C4]/60">
              {filtered.map((item) => {
                const isLow = item.quantity <= item.minQuantity;
                return (
                  <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#14261C] text-[13.5px]">{item.name}</div>
                      {item.lotNumber && (
                        <div className="text-[11px] text-[#6B7280]">Lote: {item.lotNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#55695E] font-medium">{item.category}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-bold text-[13px] ${
                          isLow ? 'text-[#DC2626]' : 'text-[#14261C]'
                        }`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                      {isLow && (
                        <div className="text-[10px] text-[#DC2626] font-bold">
                          Mínimo: {item.minQuantity}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#55695E]">
                      {item.expiryDate || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold inline-block ${
                          item.autoclaveStatus === 'Esterilizado'
                            ? 'bg-[#E3EEEC] text-[#0F766E]'
                            : item.autoclaveStatus === 'Pendente'
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}
                      >
                        {item.autoclaveStatus || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isLow ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] text-[10.5px] font-bold flex items-center justify-center gap-1">
                          <AlertTriangle size={11} />
                          Repor
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E3EEEC] text-[#0F766E] text-[10.5px] font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 size={11} />
                          Regular
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
