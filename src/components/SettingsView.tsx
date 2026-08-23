import { useState, useEffect } from "react";
import { useClinic } from "../contexts/ClinicContext";
import { saveClinicConfig, loadClinicConfig } from "../services/clinicConfigService";
import { saveSettingsToFirestore, getLocalSettings } from "../services/clinicSettingsService";
import { useToast } from "../components/Toast";
import {
  Building2,
  User,
  Stethoscope,
  Palette,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Shield,
  Bell,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  Calendar,
  MessageCircle,
  Users,
  ArrowLeft,
} from "lucide-react";

export default function SettingsView() {
  const { clinicConfig, clinicId } = useClinic();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"geral" | "aparencia" | "notificacoes" | "integracoes" | "conta">("geral");

  const [formData, setFormData] = useState({
    clinicName: clinicConfig?.clinicName || "",
    doctorName: clinicConfig?.doctorName || "",
    doctorSpecialty: clinicConfig?.doctorSpecialty || "",
    city: clinicConfig?.city || "",
    state: clinicConfig?.state || "",
    address: clinicConfig?.address || "",
    phone: clinicConfig?.phone || "",
    email: clinicConfig?.email || "",
    website: clinicConfig?.website || "",
    logoPath: clinicConfig?.logoPath || "/logo.png",
    primaryColor: clinicConfig?.primaryColor || "#0B4C33",
    accentColor: clinicConfig?.accentColor || "#CBAA6C",
    whatsappDefaultMessage: clinicConfig?.whatsappDefaultMessage || "",
    clinicUrl: clinicConfig?.clinicUrl || "",
    acceptsInsurance: clinicConfig?.acceptsInsurance || false,
    allowOnlineBooking: clinicConfig?.settings?.allowOnlineBooking ?? true,
    requireConfirmation: clinicConfig?.settings?.requireConfirmation ?? true,
    bookingWindowDays: clinicConfig?.settings?.bookingWindowDays ?? 30,
    expedienteStart: clinicConfig?.settings?.expedienteStart || "08:00",
    expedienteEnd: clinicConfig?.settings?.expedienteEnd || "20:00",
  });

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPreviewLogo(dataUrl);
        setFormData((prev) => ({ ...prev, logoPath: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!clinicId) {
      showToast({ type: "error", title: "Erro", message: "Clínica não identificada" });
      return;
    }

    setIsLoading(true);
    try {
      await saveClinicConfig(clinicId, {
        clinicName: formData.clinicName,
        doctorName: formData.doctorName,
        doctorSpecialty: formData.doctorSpecialty,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        logoPath: formData.logoPath,
        primaryColor: formData.primaryColor,
        accentColor: formData.accentColor,
        whatsappDefaultMessage: formData.whatsappDefaultMessage,
        clinicUrl: formData.clinicUrl,
        acceptsInsurance: formData.acceptsInsurance,
        settings: {
          allowOnlineBooking: formData.allowOnlineBooking,
          requireConfirmation: formData.requireConfirmation,
          bookingWindowDays: formData.bookingWindowDays,
          expedienteStart: formData.expedienteStart,
          expedienteEnd: formData.expedienteEnd,
          timezone: "America/Sao_Paulo",
        },
      });

      await saveSettingsToFirestore({
        expedienteStart: formData.expedienteStart,
        expedienteEnd: formData.expedienteEnd,
      });

      await loadClinicConfig(clinicId);
      showToast({ type: "success", title: "Salvo!", message: "Configurações atualizadas com sucesso" });
    } catch (err: any) {
      showToast({ type: "error", title: "Erro", message: err.message || "Erro ao salvar configurações" });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "geral", label: "Geral", icon: Building2 },
    { id: "aparencia", label: "Aparência", icon: Palette },
    { id: "notificacoes", label: "Notificações", icon: Bell },
    { id: "integracoes", label: "Integrações", icon: Globe },
    { id: "conta", label: "Conta", icon: User },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
          <p className="text-slate-600 dark:text-slate-400">Gerencie as configurações da sua clínica</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar alterações"
          )}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <nav className="flex gap-1 p-2" role="tablist" aria-label="Abas de configurações">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "geral" && (
            <div className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Informações da Clínica
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Clínica *
                  </label>
                  <input
                    type="text"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Profissional *
                  </label>
                  <input
                    type="text"
                    name="doctorName"
                    value={formData.doctorName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Especialidade *
                  </label>
                  <select
                    name="doctorSpecialty"
                    value={formData.doctorSpecialty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  >
                    <option value="Podologia">Podologia</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Enfermagem">Enfermagem</option>
                    <option value="Nutrição">Nutrição</option>
                    <option value="Psicologia">Psicologia</option>
                    <option value="Medicina Geral">Medicina Geral</option>
                    <option value="Dermatologia">Dermatologia</option>
                    <option value="Ortopedia">Ortopedia</option>
                    <option value="Cardiologia">Cardiologia</option>
                    <option value="Outra">Outra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contato@clinica.com"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Site
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://clinica.com.br"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="">Selecione</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="PR">Paraná</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="BA">Bahia</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="GO">Goiás</option>
                    <option value="PE">Pernambuco</option>
                    <option value="CE">Ceará</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    name="cep"
                    placeholder="00000-000"
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Endereço Completo
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-y"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="acceptsInsurance"
                  name="acceptsInsurance"
                  checked={formData.acceptsInsurance}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="acceptsInsurance" className="text-sm text-slate-700 dark:text-slate-300">
                  Clínica aceita convênio
                </label>
              </div>
            </div>
          )}

          {activeTab === "aparencia" && (
            <div className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600" />
                Aparência e Branding
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Logo da Clínica
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600 relative">
                      {previewLogo || formData.logoPath ? (
                        <img
                          src={previewLogo || formData.logoPath}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image className="w-10 h-10 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        PNG, JPG ou SVG • Máx. 2MB • Recomendado: 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Cor Primária
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        className="w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        name="primaryColor"
                        value={formData.primaryColor}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Cor de Destaque
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="accentColor"
                        value={formData.accentColor}
                        onChange={handleInputChange}
                        className="w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        name="accentColor"
                        value={formData.accentColor}
                        onChange={handleInputChange}
                        className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <strong>Prévia do Portal do Cliente:</strong> As cores acima serão aplicadas automaticamente no portal público de agendamento (/cliente/&#123;seu-slug&#125;).
                </p>
              </div>
            </div>
          )}

          {activeTab === "notificacoes" && (
            <div className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Notificações e WhatsApp
              </h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mensagem padrão do WhatsApp
                </label>
                <textarea
                  name="whatsappDefaultMessage"
                  value={formData.whatsappDefaultMessage}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Mensagem enviada automaticamente após agendamento..."
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-y"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Variáveis disponíveis: &#123;&#123;nome&#125;&#125;, &#123;&#123;data&#125;&#125;, &#123;&#123;horario&#125;&#125;, &#123;&#123;procedimento&#125;&#125;, &#123;&#123;valor&#125;&#125;
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                  <input
                    type="checkbox"
                    name="allowOnlineBooking"
                    checked={formData.allowOnlineBooking}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Permitir agendamento online</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                  <input
                    type="checkbox"
                    name="requireConfirmation"
                    checked={formData.requireConfirmation}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Exigir confirmação de agendamentos</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Janela de agendamento (dias)
                </label>
                <input
                  type="number"
                  name="bookingWindowDays"
                  value={formData.bookingWindowDays}
                  onChange={handleInputChange}
                  min={1}
                  max={365}
                  className="w-full max-w-xs px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === "integracoes" && (
            <div className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-600" />
                Integrações
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Stripe</h3>
                      <p className="text-sm text-slate-500">Cartão de crédito internacional</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Configure as chaves da API no painel do Stripe para receber pagamentos por cartão.
                  </p>
                  <button className="w-full px-4 py-2 border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-sm font-medium">
                    Configurar Stripe
                  </button>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Mercado Pago</h3>
                      <p className="text-sm text-slate-500">PIX, Boleto e Cartão (Brasil)</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Configure as credenciais do Mercado Pago para receber pagamentos locais.
                  </p>
                  <button className="w-full px-4 py-2 border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-sm font-medium">
                    Configurar Mercado Pago
                  </button>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">Google Calendar</h3>
                      <p className="text-sm text-slate-500">Sincronização de agenda</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Conecte sua conta Google para sincronizar agendamentos automaticamente.
                  </p>
                  <button className="w-full px-4 py-2 border border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm font-medium">
                    Conectar Google Calendar
                  </button>
                </div>

                <div className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">WhatsApp Business API</h3>
                      <p className="text-sm text-slate-500">Automação de mensagens</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Configure o número verificado do WhatsApp Business para envio automático.
                  </p>
                  <button className="w-full px-4 py-2 border border-green-500 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm font-medium">
                    Configurar WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "conta" && (
            <div className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Conta e Segurança
              </h2>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-200">Período de teste</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Sua clínica está no plano Free com trial de 30 dias. Após o período, será necessário assinar um plano pago para continuar acessando o painel administrativo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3">
                  <Key className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Alterar senha</p>
                    <p className="text-sm text-slate-500">Atualize sua senha de acesso</p>
                  </div>
                </button>

                <button className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3">
                  <Eye className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Autenticação de dois fatores</p>
                    <p className="text-sm text-slate-500">Adicione uma camada extra de segurança</p>
                  </div>
                </button>

                <button className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3">
                  <Users className="w-6 h-6 text-emerald-600" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Gerenciar equipe</p>
                    <p className="text-sm text-slate-500">Convidar/remover profissionais</p>
                  </div>
                </button>

                <button className="p-4 border border-red-200 dark:border-red-800 rounded-xl text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-300">Cancelar assinatura</p>
                    <p className="text-sm text-red-500">Encerrar plano e dados</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}