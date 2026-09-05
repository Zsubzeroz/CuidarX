import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Edit2,
  Trash2,
  Tag,
  DollarSign,
  X,
} from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  active: boolean;
  description: string;
}

const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 's-1',
    name: 'Podologia Geral & Higienização Completa',
    category: 'Profilaxia',
    duration: '45 min',
    price: 150,
    active: true,
    description: 'Corte profilático correto das unhas, limpeza de sulcos periungueais, desbaste e hidratação.',
  },
  {
    id: 's-2',
    name: 'Tratamento de Onicocriptose (Unha Encravada)',
    category: 'Procedimento Clínico',
    duration: '50 min',
    price: 160,
    active: true,
    description: 'Desobstrução técnica e alívio imediato da espícula ungueal, assepsia e curativo oclusivo.',
  },
  {
    id: 's-3',
    name: 'Avaliação & Podogeriatria (Pé Diabético)',
    category: 'Atenção Especial',
    duration: '50 min',
    price: 150,
    active: true,
    description: 'Rastreio com monofilamento de Semmes-Weinstein, corte seguro e hidratação preventiva.',
  },
  {
    id: 's-4',
    name: 'Tratamento de Órtese Ungueal',
    category: 'Correção Biomecânica',
    duration: '40 min',
    price: 120,
    active: true,
    description: 'Aplicação de órtese metálica ou fibra elástica para correção de curvatura ungueal.',
  },
  {
    id: 's-5',
    name: 'Tratamento de Verruga Plantar (Olho de Peixe)',
    category: 'Tecnologia Aplicada',
    duration: '45 min',
    price: 180,
    active: true,
    description: 'Cauterização com laser terapêutico e queratolítico seguro sem dor ou sangramento.',
  },
  {
    id: 's-6',
    name: 'Tratamento de Calosidades & Fissuras',
    category: 'Dermatopodologia',
    duration: '45 min',
    price: 130,
    active: true,
    description: 'Desbastamento indolor de calosidades de atrito e oclusão emoliente com ureia de alta densidade.',
  },
  {
    id: 's-7',
    name: 'Laserterapia Pós-Procedimento / ILIB',
    category: 'Tecnologia Aplicada',
    duration: '30 min',
    price: 90,
    active: false,
    description: 'Fotobiomodulação a laser para cicatrização acelerada de fissuras e redução de inflamação.',
  },
];

export const ServicosTab: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // New Service Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Procedimento Clínico');
  const [newDuration, setNewDuration] = useState('45 min');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const totalServices = services.length;
  const activeServices = services.filter((s) => s.active).length;
  const avgPrice =
    services.reduce((acc, s) => acc + s.price, 0) / (totalServices || 1);

  const toggleActive = (id: string) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleDelete = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newPrice.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!newName.trim() || isNaN(priceNum)) return;

    const newServ: ServiceItem = {
      id: `serv-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      duration: newDuration,
      price: priceNum,
      active: true,
      description: newDesc.trim() || 'Procedimento podológico especializado.',
    };

    setServices([...services, newServ]);
    setIsModalOpen(false);
    setNewName('');
    setNewPrice('');
    setNewDesc('');
  };

  const filtered = services.filter((s) => {
    if (statusFilter === 'active' && !s.active) return false;
    if (statusFilter === 'inactive' && s.active) return false;
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
      {/* Header matching user's SaaS Screenshot 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4D8C4]">
        <div>
          <h1 className="font-fraunces text-[22px] font-semibold text-[#14261C]">
            Controle de Serviços & Preços
          </h1>
          <p className="text-[13px] text-[#55695E] mt-0.5">
            Gerencie o catálogo de procedimentos, tempo médio de cadeira e valores cobrados
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D655E] text-white text-[13px] font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>+ Novo Serviço</span>
        </button>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11.5px] font-bold text-[#55695E] uppercase tracking-wider">
            Total de Serviços
          </span>
          <div className="text-[24px] font-bold text-[#14261C] mt-1.5">
            {totalServices}
          </div>
          <span className="text-[11px] text-[#55695E]">Cadastrados no sistema</span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11.5px] font-bold text-[#55695E] uppercase tracking-wider">
            Serviços Ativos
          </span>
          <div className="text-[24px] font-bold text-[#0F766E] mt-1.5">
            {activeServices}
          </div>
          <span className="text-[11px] text-[#0F766E] font-semibold">
            Visíveis no Portal do Cliente
          </span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11.5px] font-bold text-[#55695E] uppercase tracking-wider">
            Preço Médio da Tabela
          </span>
          <div className="text-[24px] font-bold text-[#14261C] mt-1.5">
            R$ {avgPrice.toFixed(2).replace('.', ',')}
          </div>
          <span className="text-[11px] text-[#55695E]">Ticket médio por atendimento</span>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-[#FAF8F5] border border-[#E4D8C4] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-80 bg-white border border-[#E4D8C4] rounded-xl px-3 py-2 shadow-2xs">
          <Search size={15} className="text-[#6B7280]" />
          <input
            type="text"
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-[12.5px] text-[#14261C] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#14261C] text-white'
                : 'bg-white text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Todos ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-[#0F766E] text-white'
                : 'bg-white text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Ativos ({activeServices})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all ${
              statusFilter === 'inactive'
                ? 'bg-[#4B5563] text-white'
                : 'bg-white text-[#55695E] border border-[#E4D8C4]'
            }`}
          >
            Inativos
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-[#FFFDF9] border border-[#E4D8C4] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E4D8C4] text-[#55695E] text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Serviço / Procedimento</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Duração Média</th>
                <th className="py-3 px-4 text-right">Valor de Tabela</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4D8C4]/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#14261C] text-[13.5px]">{s.name}</div>
                    <div className="text-[11.5px] text-[#55695E] line-clamp-1">{s.description}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#55695E]">{s.category}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-[#14261C] font-medium">
                      <Clock size={12} className="text-[#0F766E]" />
                      {s.duration}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#0F766E] text-[14px]">
                    R$ {s.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(s.id)}
                      className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-colors cursor-pointer ${
                        s.active
                          ? 'bg-[#E3EEEC] text-[#0F766E]'
                          : 'bg-[#F3F4F6] text-[#6B7280]'
                      }`}
                    >
                      {s.active ? 'Ativo no Portal' : 'Inativo'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="text-[#9CA3AF] hover:text-[#DC2626] p-1 transition-colors"
                      title="Excluir serviço"
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

      {/* Modal: + Novo Serviço */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#FFFDF9] border border-[#E4D8C4] rounded-[24px] shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4D8C4]">
              <h3 className="font-fraunces text-[18px] font-semibold text-[#14261C]">
                Adicionar Novo Procedimento
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] text-[#55695E] flex items-center justify-center hover:bg-[#E4D8C4]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddService} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                  Nome do Procedimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tratamento de Micose por Laser"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    <option value="Profilaxia">Profilaxia</option>
                    <option value="Atenção Especial">Atenção Especial</option>
                    <option value="Correção Biomecânica">Correção Biomecânica</option>
                    <option value="Tecnologia Aplicada">Tecnologia Aplicada</option>
                    <option value="Dermatopodologia">Dermatopodologia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                    Duração
                  </label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                  Valor de Tabela (R$) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 140,00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#14261C] uppercase tracking-wider mb-1">
                  Descrição para o Paciente
                </label>
                <textarea
                  rows={2}
                  placeholder="Explicação do que está incluso neste atendimento"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E4D8C4] rounded-xl px-3 py-2 text-[13px] text-[#14261C]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E4D8C4] text-[12px] font-semibold text-[#55695E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F766E] text-white text-[12px] font-bold shadow-xs"
                >
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
