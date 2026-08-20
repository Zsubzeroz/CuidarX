import React, { useState } from "react";
import { useRealtimeInventory } from "../hooks/useRealtimeInventory";
import type { InventoryProduct, ProductLot, SurgicalInstrument, ProcedureKit, ProductCategory, ProductUsage } from "../types";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Layers,
  Search,
  ChevronDown,
  ChevronRight,
  Wrench,
  Archive,
  X,
  Save,
  Ban,
} from "lucide-react";

type Tab = "produtos" | "lotes" | "instrumentos" | "kits" | "alertas";

const emptyProduct = {
  name: "",
  category: "material" as ProductCategory,
  usage: "interno" as ProductUsage,
  unit: "un",
  currentStock: 0,
  minStock: 1,
  maxStock: undefined as number | undefined,
  unitCost: undefined as number | undefined,
  salePrice: undefined as number | undefined,
  supplier: "",
  barcode: "",
  isActive: true,
};

const emptyLot = {
  productId: "",
  lotNumber: "",
  expiryDate: "",
  costPrice: 0,
  supplier: "",
  quantity: 0,
  remainingQuantity: 0,
  invoiceNumber: "",
};

const emptyInstrument = {
  name: "",
  serialNumber: "",
  sterilizationDate: new Date().toISOString().slice(0, 10),
  surgicalGrade: "Grau Cirúrgico A",
  gradeExpiryDate: "",
  autoclaveId: "",
  cycleNumber: undefined as number | undefined,
  lastUsedAt: undefined as string | undefined,
  isActive: true,
};

const emptyKit = {
  name: "",
  description: "",
  items: [] as { productId: string; productName: string; quantityNeeded: number }[],
};

const categoryLabels: Record<string, string> = {
  material: "Material",
  quimico: "Químico",
  descartavel: "Descartável",
  medicamento: "Medicamento",
  equipamento: "Equipamento",
  revenda: "Revenda",
};

export default function InventoryView() {
  const {
    products, lots, instruments, kits, expiryAlerts,
    isLoading, syncStatus,
    handleAddProduct, handleUpdateProduct, handleDeleteProduct,
    handleAddLot, handleUpdateLot, handleDeleteLot,
    handleAddInstrument, handleUpdateInstrument, handleDeleteInstrument,
    handleAddKit, handleUpdateKit, handleDeleteKit,
    handleDispenseKit,
  } = useRealtimeInventory();

  const [activeTab, setActiveTab] = useState<Tab>("produtos");
  const [search, setSearch] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"product" | "lot" | "instrument" | "kit">("product");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState(emptyProduct);
  const [lotForm, setLotForm] = useState(emptyLot);
  const [instrumentForm, setInstrumentForm] = useState(emptyInstrument);
  const [kitForm, setKitForm] = useState(emptyKit);

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "produtos", label: "Produtos", icon: Package, count: products.length },
    { id: "lotes", label: "Lotes", icon: Layers, count: lots.length },
    { id: "instrumentos", label: "Instrumentos", icon: Wrench, count: instruments.length },
    { id: "kits", label: "Kits", icon: Archive, count: kits.length },
    { id: "alertas", label: "Alertas", icon: AlertTriangle, count: expiryAlerts.length },
  ];

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddProduct = () => {
    setFormType("product");
    setEditingId(null);
    setProductForm(emptyProduct);
    setShowForm(true);
  };

  const openEditProduct = (p: InventoryProduct) => {
    setFormType("product");
    setEditingId(p.id);
    setProductForm({
      name: p.name,
      category: p.category,
      usage: p.usage,
      unit: p.unit,
      currentStock: p.currentStock,
      minStock: p.minStock,
      maxStock: p.maxStock,
      unitCost: p.unitCost,
      salePrice: p.salePrice,
      supplier: p.supplier || "",
      barcode: p.barcode || "",
      isActive: p.isActive,
    });
    setShowForm(true);
  };

  const openAddLot = (productId?: string) => {
    setFormType("lot");
    setEditingId(null);
    setLotForm({ ...emptyLot, productId: productId || "" });
    setShowForm(true);
  };

  const openEditLot = (l: ProductLot) => {
    setFormType("lot");
    setEditingId(l.id);
    setLotForm({
      productId: l.productId,
      lotNumber: l.lotNumber,
      expiryDate: l.expiryDate,
      costPrice: l.costPrice,
      supplier: l.supplier,
      quantity: l.quantity,
      remainingQuantity: l.remainingQuantity,
      invoiceNumber: l.invoiceNumber || "",
    });
    setShowForm(true);
  };

  const openAddInstrument = () => {
    setFormType("instrument");
    setEditingId(null);
    setInstrumentForm(emptyInstrument);
    setShowForm(true);
  };

  const openEditInstrument = (i: SurgicalInstrument) => {
    setFormType("instrument");
    setEditingId(i.id);
    setInstrumentForm({
      name: i.name,
      serialNumber: i.serialNumber || "",
      sterilizationDate: i.sterilizationDate,
      surgicalGrade: i.surgicalGrade,
      gradeExpiryDate: i.gradeExpiryDate,
      autoclaveId: i.autoclaveId || "",
      cycleNumber: i.cycleNumber,
      lastUsedAt: i.lastUsedAt,
      isActive: i.isActive,
    });
    setShowForm(true);
  };

  const openAddKit = () => {
    setFormType("kit");
    setEditingId(null);
    setKitForm(emptyKit);
    setShowForm(true);
  };

  const openEditKit = (kit: ProcedureKit) => {
    setFormType("kit");
    setEditingId(kit.id);
    setKitForm({ name: kit.name, description: kit.description || "", items: kit.items });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) { alert("Nome é obrigatório"); return; }
    try {
      if (editingId) {
        const original = products.find((p) => p.id === editingId);
        if (original) {
          await handleUpdateProduct({
            ...original,
            ...productForm,
            supplier: productForm.supplier || undefined,
            barcode: productForm.barcode || undefined,
          });
        }
      } else {
        await handleAddProduct({
          ...productForm,
          supplier: productForm.supplier || undefined,
          barcode: productForm.barcode || undefined,
        });
      }
      closeForm();
    } catch (err: any) {
      console.error("Erro ao salvar produto:", err);
      alert(`Erro ao salvar produto: ${err?.message || "Verifique o console para detalhes."}`);
    }
  };

  const handleSaveLot = async () => {
    if (!lotForm.productId) { alert("Selecione um produto"); return; }
    if (!lotForm.lotNumber.trim()) { alert("Número do lote é obrigatório"); return; }
    if (!lotForm.expiryDate) { alert("Data de validade é obrigatória"); return; }
    try {
      if (editingId) {
        const original = lots.find((l) => l.id === editingId);
        if (original) {
          await handleUpdateLot({
            ...original,
            ...lotForm,
            invoiceNumber: lotForm.invoiceNumber || undefined,
          });
        }
      } else {
        await handleAddLot({
          ...lotForm,
          remainingQuantity: lotForm.remainingQuantity || lotForm.quantity,
          supplier: lotForm.supplier || "",
          invoiceNumber: lotForm.invoiceNumber || undefined,
        });
      }
      closeForm();
    } catch (err: any) {
      console.error("Erro ao salvar lote:", err);
      alert(`Erro ao salvar lote: ${err?.message || "Verifique o console para detalhes."}`);
    }
  };

  const handleSaveInstrument = async () => {
    if (!instrumentForm.name.trim()) { alert("Nome é obrigatório"); return; }
    if (!instrumentForm.sterilizationDate) { alert("Data de esterilização é obrigatória"); return; }
    if (!instrumentForm.gradeExpiryDate) { alert("Validade do grau cirúrgico é obrigatória"); return; }
    try {
      if (editingId) {
        const original = instruments.find((i) => i.id === editingId);
        if (original) {
          await handleUpdateInstrument({
            ...original,
            ...instrumentForm,
            serialNumber: instrumentForm.serialNumber || undefined,
            autoclaveId: instrumentForm.autoclaveId || undefined,
            lastUsedAt: instrumentForm.lastUsedAt || undefined,
          });
        }
      } else {
        await handleAddInstrument({
          ...instrumentForm,
          serialNumber: instrumentForm.serialNumber || undefined,
          autoclaveId: instrumentForm.autoclaveId || undefined,
          lastUsedAt: instrumentForm.lastUsedAt || undefined,
        });
      }
      closeForm();
    } catch (err: any) {
      console.error("Erro ao salvar instrumento:", err);
      alert(`Erro ao salvar instrumento: ${err?.message || "Verifique o console para detalhes."}`);
    }
  };

  const handleSaveKit = async () => {
    if (!kitForm.name.trim()) { alert("Nome do kit é obrigatório"); return; }
    if (kitForm.items.length === 0) { alert("Adicione pelo menos um item ao kit"); return; }
    try {
      if (editingId) {
        const original = kits.find((k) => k.id === editingId);
        if (original) {
          await handleUpdateKit({
            ...original,
            name: kitForm.name,
            description: kitForm.description || undefined,
            items: kitForm.items,
          });
        }
      } else {
        await handleAddKit({
          name: kitForm.name,
          description: kitForm.description || undefined,
          items: kitForm.items,
        });
      }
      closeForm();
    } catch (err: any) {
      console.error("Erro ao salvar kit:", err);
      alert(`Erro ao salvar kit: ${err?.message || "Verifique o console para detalhes."}`);
    }
  };

  const handleSave = async () => {
    if (formType === "product") await handleSaveProduct();
    else if (formType === "lot") await handleSaveLot();
    else if (formType === "kit") await handleSaveKit();
    else await handleSaveInstrument();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Carregando estoque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#1B4332]" />
            Gestão de Estoque
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {products.length} produtos · {lots.length} lotes · {instruments.length} instrumentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus === "syncing" && (
            <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full font-bold animate-pulse">
              Sincronizando...
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#1B4332] text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-500 hover:border-[#C9A227]/40 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Add button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#C9A227]/30 transition-all"
          />
        </div>
        {activeTab === "produtos" && (
          <button onClick={openAddProduct} className="flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#245E47] text-white px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Produto
          </button>
        )}
        {activeTab === "lotes" && (
          <button onClick={() => openAddLot()} className="flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#245E47] text-white px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Lote
          </button>
        )}
        {activeTab === "instrumentos" && (
          <button onClick={openAddInstrument} className="flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#245E47] text-white px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Instrumento
          </button>
        )}
        {activeTab === "kits" && (
          <button onClick={openAddKit} className="flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#245E47] text-white px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" /> Kit
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {/* ── PRODUTOS ── */}
        {activeTab === "produtos" && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">Nenhum produto encontrado</p>
                <button onClick={openAddProduct} className="mt-3 text-[10px] font-bold text-[#1B4332] bg-[#1B4332]/10 hover:bg-[#1B4332]/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                  <Plus className="w-3 h-3 inline mr-1" /> Adicionar primeiro produto
                </button>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const productLots = lots.filter((l) => l.productId === product.id);
                const isLowStock = product.currentStock <= product.minStock;
                const isExpanded = expandedProduct === product.id;
                return (
                  <div key={product.id} className={`bg-white border rounded-xl transition-all ${isLowStock ? "border-amber-300 shadow-sm" : "border-slate-100"}`}>
                    <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpandedProduct(isExpanded ? null : product.id)}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLowStock ? "bg-amber-100" : "bg-[#1B4332]/10"}`}>
                        {isLowStock ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <Package className="w-4 h-4 text-[#1B4332]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate">{product.name}</span>
                          {isLowStock && <span className="text-[8px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-700 border border-amber-200">Estoque baixo</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">{categoryLabels[product.category] || product.category}</span>
                          <span className="text-[10px] text-slate-300">·</span>
                          <span className="text-[10px] font-bold text-slate-600">{product.currentStock} {product.unit}</span>
                          {product.unitCost != null && <><span className="text-[10px] text-slate-300">·</span><span className="text-[10px] text-slate-400">R$ {product.unitCost.toFixed(2)}</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); openEditProduct(product); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 cursor-pointer"><Pencil className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); if (confirm(`Excluir "${product.name}"?`)) handleDeleteProduct(product.id); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                        {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                          <div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-400 block">Mínimo</span><span className="font-bold text-slate-700">{product.minStock} {product.unit}</span></div>
                          {product.maxStock != null && <div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-400 block">Máximo</span><span className="font-bold text-slate-700">{product.maxStock} {product.unit}</span></div>}
                          <div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-400 block">Uso</span><span className="font-bold text-slate-700 capitalize">{product.usage}</span></div>
                          {product.salePrice != null && <div className="bg-slate-50 rounded-lg p-2"><span className="text-slate-400 block">Venda</span><span className="font-bold text-[#1B4332]">R$ {product.salePrice.toFixed(2)}</span></div>}
                        </div>
                        {product.supplier && <p className="text-[10px] text-slate-400">Fornecedor: <span className="text-slate-600 font-medium">{product.supplier}</span></p>}
                        {productLots.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lotes</p>
                              <button onClick={() => openAddLot(product.id)} className="text-[9px] font-bold text-[#1B4332] hover:underline cursor-pointer">+ Lote</button>
                            </div>
                            {productLots.map((lot) => (
                              <div key={lot.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-2 py-1.5 text-[10px]">
                                <span className="font-medium text-slate-700">Lote {lot.lotNumber}</span>
                                <span className="text-slate-500">{lot.remainingQuantity}/{lot.quantity} un</span>
                                <span className={`font-bold ${new Date(lot.expiryDate) < new Date(Date.now() + 30*24*60*60*1000) ? "text-amber-600" : "text-slate-400"}`}>
                                  {new Date(lot.expiryDate).toLocaleDateString("pt-BR")}
                                </span>
                                <div className="flex gap-0.5">
                                  <button onClick={() => openEditLot(lot)} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 cursor-pointer"><Pencil className="w-2.5 h-2.5" /></button>
                                  <button onClick={() => { if (confirm("Excluir lote?")) handleDeleteLot(lot.id); }} className="p-0.5 rounded hover:bg-rose-100 text-rose-400 cursor-pointer"><Trash2 className="w-2.5 h-2.5" /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── LOTES ── */}
        {activeTab === "lotes" && (
          <>
            {lots.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <Layers className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">Nenhum lote registrado</p>
                <button onClick={() => openAddLot()} className="mt-3 text-[10px] font-bold text-[#1B4332] bg-[#1B4332]/10 hover:bg-[#1B4332]/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                  <Plus className="w-3 h-3 inline mr-1" /> Adicionar primeiro lote
                </button>
              </div>
            ) : (
              lots.map((lot) => {
                const product = products.find((p) => p.id === lot.productId);
                const isExpiringSoon = new Date(lot.expiryDate) < new Date(Date.now() + 30*24*60*60*1000);
                return (
                  <div key={lot.id} className={`bg-white border rounded-xl p-3 flex items-center gap-3 ${isExpiringSoon ? "border-amber-300" : "border-slate-100"}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isExpiringSoon ? "bg-amber-100" : "bg-slate-100"}`}>
                      <Layers className={`w-4 h-4 ${isExpiringSoon ? "text-amber-600" : "text-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{product?.name || "Produto desconhecido"}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Lote {lot.lotNumber}</span>
                        <span>·</span>
                        <span className={isExpiringSoon ? "text-amber-600 font-bold" : ""}>{new Date(lot.expiryDate).toLocaleDateString("pt-BR")}</span>
                        <span>·</span>
                        <span>{lot.remainingQuantity}/{lot.quantity} un</span>
                        {lot.costPrice > 0 && <><span>·</span><span>R$ {lot.costPrice.toFixed(2)}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditLot(lot)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 cursor-pointer"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => { if (confirm("Excluir lote?")) handleDeleteLot(lot.id); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── INSTRUMENTOS ── */}
        {activeTab === "instrumentos" && (
          <>
            {instruments.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <Wrench className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">Nenhum instrumento registrado</p>
                <button onClick={openAddInstrument} className="mt-3 text-[10px] font-bold text-[#1B4332] bg-[#1B4332]/10 hover:bg-[#1B4332]/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                  <Plus className="w-3 h-3 inline mr-1" /> Adicionar primeiro instrumento
                </button>
              </div>
            ) : (
              instruments.map((inst) => {
                const daysSince = Math.floor((Date.now() - new Date(inst.sterilizationDate).getTime()) / (1000*60*60*24));
                return (
                  <div key={inst.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1B4332]/10 flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4 text-[#1B4332]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{inst.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{inst.surgicalGrade}</span>
                        <span>·</span>
                        <span>{daysSince}d desde esterilização</span>
                        {inst.serialNumber && <><span>·</span><span>S/N: {inst.serialNumber}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditInstrument(inst)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 cursor-pointer"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => { if (confirm(`Excluir "${inst.name}"?`)) handleDeleteInstrument(inst.id); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ── KITS ── */}
        {activeTab === "kits" && (
          <>
            {kits.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <Archive className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">Nenhum kit configurado</p>
                <button onClick={openAddKit} className="mt-3 text-[10px] font-bold text-[#1B4332] bg-[#1B4332]/10 hover:bg-[#1B4332]/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                  <Plus className="w-3 h-3 inline mr-1" /> Criar primeiro kit
                </button>
              </div>
            ) : (
              kits.map((kit) => (
                <div key={kit.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C9A227]/10 flex items-center justify-center shrink-0">
                    <Archive className="w-4 h-4 text-[#C9A227]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{kit.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{kit.items.length} itens no kit</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditKit(kit)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 cursor-pointer"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => { if (confirm(`Excluir kit "${kit.name}"?`)) handleDeleteKit(kit.id); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDispenseKit(kit.id)} className="text-[9px] font-bold text-white bg-[#1B4332] hover:bg-[#245E47] px-3 py-1.5 rounded-lg transition-colors cursor-pointer">Dispensar</button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── ALERTAS ── */}
        {activeTab === "alertas" && (
          <>
            {expiryAlerts.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">Nenhum alerta no momento</p>
              </div>
            ) : (
              expiryAlerts.map((alert, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-800">{alert.itemName}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">{alert.details}</p>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/30 backdrop-blur-sm" onClick={closeForm}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? "Editar" : "Novo"} {formType === "product" ? "Produto" : formType === "lot" ? "Lote" : formType === "kit" ? "Kit" : "Instrumento"}
              </h3>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            {/* Product Form */}
            {formType === "product" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome *</label>
                  <input type="text" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" placeholder="Ex: Luva Nitrílica" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                    <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]">
                      <option value="material">Material</option>
                      <option value="quimico">Químico</option>
                      <option value="descartavel">Descartável</option>
                      <option value="medicamento">Medicamento</option>
                      <option value="equipamento">Equipamento</option>
                      <option value="revenda">Revenda</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Uso</label>
                    <select value={productForm.usage} onChange={(e) => setProductForm({ ...productForm, usage: e.target.value as ProductUsage })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]">
                      <option value="interno">Interno</option>
                      <option value="revenda">Revenda</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Unidade</label>
                    <input type="text" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" placeholder="un, cx, pct" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Estoque Atual</label>
                    <input type="number" min="0" value={productForm.currentStock} onChange={(e) => setProductForm({ ...productForm, currentStock: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Mínimo</label>
                    <input type="number" min="0" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Custo Unit. (R$)</label>
                    <input type="number" min="0" step="0.01" value={productForm.unitCost ?? ""} onChange={(e) => setProductForm({ ...productForm, unitCost: e.target.value ? Number(e.target.value) : undefined })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Preço Venda (R$)</label>
                    <input type="number" min="0" step="0.01" value={productForm.salePrice ?? ""} onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value ? Number(e.target.value) : undefined })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fornecedor</label>
                  <input type="text" value={productForm.supplier} onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                </div>
              </div>
            )}

            {/* Lot Form */}
            {formType === "lot" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Produto *</label>
                  <select value={lotForm.productId} onChange={(e) => setLotForm({ ...lotForm, productId: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]">
                    <option value="">Selecione...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nº Lote *</label>
                    <input type="text" value={lotForm.lotNumber} onChange={(e) => setLotForm({ ...lotForm, lotNumber: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Validade *</label>
                    <input type="date" value={lotForm.expiryDate} onChange={(e) => setLotForm({ ...lotForm, expiryDate: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Quantidade</label>
                    <input type="number" min="0" value={lotForm.quantity} onChange={(e) => setLotForm({ ...lotForm, quantity: Number(e.target.value), remainingQuantity: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Custo (R$)</label>
                    <input type="number" min="0" step="0.01" value={lotForm.costPrice} onChange={(e) => setLotForm({ ...lotForm, costPrice: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fornecedor</label>
                  <input type="text" value={lotForm.supplier} onChange={(e) => setLotForm({ ...lotForm, supplier: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nota Fiscal</label>
                  <input type="text" value={lotForm.invoiceNumber} onChange={(e) => setLotForm({ ...lotForm, invoiceNumber: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                </div>
              </div>
            )}

            {/* Instrument Form */}
            {formType === "instrument" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome *</label>
                  <input type="text" value={instrumentForm.name} onChange={(e) => setInstrumentForm({ ...instrumentForm, name: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" placeholder="Ex: Bisturi #15" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nº Série</label>
                    <input type="text" value={instrumentForm.serialNumber} onChange={(e) => setInstrumentForm({ ...instrumentForm, serialNumber: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Grau Cirúrgico</label>
                    <select value={instrumentForm.surgicalGrade} onChange={(e) => setInstrumentForm({ ...instrumentForm, surgicalGrade: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]">
                      <option value="Grau Cirúrgico A">Grau A</option>
                      <option value="Grau Cirúrgico B">Grau B</option>
                      <option value="Grau Cirúrgico C">Grau C</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Esterilização *</label>
                    <input type="date" value={instrumentForm.sterilizationDate} onChange={(e) => setInstrumentForm({ ...instrumentForm, sterilizationDate: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Validade Grau *</label>
                    <input type="date" value={instrumentForm.gradeExpiryDate} onChange={(e) => setInstrumentForm({ ...instrumentForm, gradeExpiryDate: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Autoclave</label>
                    <input type="text" value={instrumentForm.autoclaveId} onChange={(e) => setInstrumentForm({ ...instrumentForm, autoclaveId: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Ciclo</label>
                    <input type="number" min="0" value={instrumentForm.cycleNumber ?? ""} onChange={(e) => setInstrumentForm({ ...instrumentForm, cycleNumber: e.target.value ? Number(e.target.value) : undefined })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" />
                  </div>
                </div>
              </div>
            )}

            {/* Kit Form */}
            {formType === "kit" && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome *</label>
                  <input type="text" value={kitForm.name} onChange={(e) => setKitForm({ ...kitForm, name: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" placeholder="Ex: Kit Podopatia Preventiva" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição</label>
                  <input type="text" value={kitForm.description} onChange={(e) => setKitForm({ ...kitForm, description: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]" placeholder="Opcional" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Itens do Kit *</label>
                  <div className="mt-1 space-y-2">
                    {kitForm.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2">
                        <span className="text-[10px] font-bold text-slate-500 w-4 text-center">{idx + 1}</span>
                        <span className="flex-1 text-xs text-slate-700 truncate">{item.productName}</span>
                        <span className="text-[10px] text-slate-400">x{item.quantityNeeded}</span>
                        <button type="button" onClick={() => setKitForm({ ...kitForm, items: kitForm.items.filter((_, i) => i !== idx) })} className="p-1 rounded hover:bg-rose-100 text-rose-400 cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <select
                        id="kit-product-select"
                        defaultValue=""
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                      >
                        <option value="">Selecione um produto...</option>
                        {products.filter((p) => p.currentStock > 0).map((p) => (
                          <option key={p.id} value={p.id}>{p.name} (est: {p.currentStock})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        defaultValue="1"
                        id="kit-qty-input"
                        className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] text-center"
                        placeholder="Qtd"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const sel = document.getElementById("kit-product-select") as HTMLSelectElement;
                          const qtyInput = document.getElementById("kit-qty-input") as HTMLInputElement;
                          const productId = sel.value;
                          const qty = parseInt(qtyInput.value, 10);
                          if (!productId) { alert("Selecione um produto"); return; }
                          if (!qty || qty < 1) { alert("Quantidade inválida"); return; }
                          const product = products.find((p) => p.id === productId);
                          if (!product) return;
                          setKitForm({
                            ...kitForm,
                            items: [...kitForm.items, { productId, productName: product.name, quantityNeeded: qty }],
                          });
                          sel.value = "";
                          qtyInput.value = "1";
                        }}
                        className="p-2 bg-[#1B4332] hover:bg-[#245E47] text-white rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-5">
              <button onClick={closeForm} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer">Cancelar</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-[#1B4332] hover:bg-[#245E47] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> {editingId ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
