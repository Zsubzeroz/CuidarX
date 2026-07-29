import React, { useState } from "react";
import { ClinicService } from "../types";
import {
  ClipboardList,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  Clock,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  Sliders,
} from "lucide-react";

interface ServicesViewProps {
  services: ClinicService[];
  onAddOrUpdateService: (service: Omit<ClinicService, "id"> & { id?: string }) => void;
  onDeleteService: (id: string) => void;
}

export default function ServicesView({
  services,
  onAddOrUpdateService,
  onDeleteService,
}: ServicesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  
  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Statistics
  const activeServices = services.filter((s) => s.isActive).length;
  const averagePrice =
    services.length > 0
      ? services.reduce((acc, s) => acc + s.price, 0) / services.length
      : 0;

  // Filter and search services
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === "active") return matchesSearch && service.isActive;
    if (statusFilter === "inactive") return matchesSearch && !service.isActive;
    return matchesSearch;
  });

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setDuration("45");
    setDescription("");
    setIsActive(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: ClinicService) => {
    setEditingId(service.id);
    setName(service.name);
    setPrice(service.price.toString());
    setDuration(service.duration ? service.duration.toString() : "45");
    setDescription(service.description || "");
    setIsActive(service.isActive);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("O nome do serviço é obrigatório.");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg("Insira um preço válido maior que zero.");
      return;
    }

    const parsedDuration = parseInt(duration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      setErrorMsg("Insira uma duração válida maior que zero.");
      return;
    }

    onAddOrUpdateService({
      id: editingId || undefined,
      name: name.trim(),
      price: parsedPrice,
      duration: parsedDuration,
      description: description.trim(),
      isActive,
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, serviceName: string) => {
    if (
      window.confirm(
        `Tem certeza de que deseja excluir o serviço "${serviceName}"? Isso não afetará os agendamentos anteriores.`
      )
    ) {
      onDeleteService(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gold" /> Controle de Serviços & Preços
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie os procedimentos oferecidos, configure preços de tabela, tempos de atendimento e ative/desative serviços.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Novo Serviço
        </button>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Serviços</p>
            <h3 className="text-2xl font-bold text-slate-800 font-mono">{services.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-gold">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Serviços Ativos</p>
            <h3 className="text-2xl font-bold text-gold font-mono">{activeServices}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-gold">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preço Médio da Tabela</p>
            <h3 className="text-2xl font-bold text-slate-800 font-mono">
              R$ {averagePrice.toFixed(2).replace(".", ",")}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-gold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar serviço por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs border border-slate-200/80 pl-10 pr-4 py-2.5 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-gold text-slate-700"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <Sliders className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Status:</span>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white overflow-hidden">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-brand text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === "active"
                    ? "bg-brand text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === "inactive"
                    ? "bg-brand text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Inativos
              </button>
            </div>
          </div>
        </div>

        {/* Services List Table */}
        <div className="overflow-x-auto">
          {filteredServices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold">Nenhum serviço encontrado</p>
              <p className="text-[11px] text-slate-400">
                Tente redefinir seus termos de busca ou filtros ou crie um novo serviço.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/20 text-slate-500 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-3">Serviço / Procedimento</th>
                  <th className="px-6 py-3">Duração Média</th>
                  <th className="px-6 py-3 text-right">Valor de Tabela</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-55/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{service.name}</p>
                        {service.description && (
                          <p className="text-[11px] text-slate-400 max-w-md line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{service.duration || 45} minutos</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                      R$ {service.price.toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          service.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {service.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-gold hover:bg-gold/5 transition-all cursor-pointer"
                          title="Editar Serviço"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id, service.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Excluir Serviço"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? "Editar Serviço Clínico" : "Cadastrar Novo Serviço"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Service Name */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nome do Serviço / Procedimento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Órtese FMM / Fibra de Vidro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Valor Cobrado (R$) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0,00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full text-xs border border-slate-200 pl-9 pr-3 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold font-mono"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Duração Média (Minutos) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      required
                      placeholder="45"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full text-xs border border-slate-200 pl-9 pr-3 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Descrição do Procedimento (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva detalhes do procedimento, assepsia, indicações clínicas, etc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                />
              </div>

              {/* Is Active Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">Disponível para Agendamento</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Permite selecionar este serviço para novas consultas e agendamentos online.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
                </label>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
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
}
