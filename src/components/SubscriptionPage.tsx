import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db, isFirebaseConfigured } from "../services/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getCurrentAdminUser, logout } from "../services/multiTenantAuth";
import { getCachedClinicConfig, loadClinicConfig } from "../services/clinicConfigService";
import { setClinicConfig } from "../config";
import { useAuth } from "../contexts/AuthContext";
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Zap,
  Star,
  Users,
  Database,
  ArrowLeft,
  Globe,
  Smartphone,
  BarChart2,
  Lock,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  period: "month" | "year";
  description: string;
  features: string[];
  limits: {
    patients: number | "unlimited";
    professionals: number | "unlimited";
    locations: number | "unlimited";
    apiAccess: boolean;
    whatsappAutomation: boolean;
    aiAssistant: boolean;
    customBranding: boolean;
    sso: boolean;
    prioritySupport: boolean;
  };
  stripePriceId?: string;
  mercadoPagoPreferenceId?: string;
  popular?: boolean;
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
    description: "Ideal para testar a plataforma",
    features: [
      "Até 50 pacientes",
      "1 profissional",
      "Agendamento online",
      "Prontuário digital básico",
      "Relatórios simples",
    ],
    limits: {
      patients: 50,
      professionals: 1,
      locations: 1,
      apiAccess: false,
      whatsappAutomation: false,
      aiAssistant: false,
      customBranding: false,
      sso: false,
      prioritySupport: false,
    },
    cta: "Continuar no Free",
  },
  {
    id: "basic",
    name: "Básico",
    price: 99,
    period: "month",
    description: "Para clínicas em crescimento",
    features: [
      "Até 200 pacientes",
      "Até 3 profissionais",
      "Agendamento online ilimitado",
      "Prontuário completo",
      "Automação WhatsApp básica",
      "Relatórios avançados",
      "Backup automático",
    ],
    limits: {
      patients: 200,
      professionals: 3,
      locations: 1,
      apiAccess: false,
      whatsappAutomation: true,
      aiAssistant: false,
      customBranding: false,
      sso: false,
      prioritySupport: false,
    },
    stripePriceId: "price_basic_monthly",
    mercadoPagoPreferenceId: "basic_monthly",
    cta: "Assinar Básico",
  },
  {
    id: "pro",
    name: "Profissional",
    price: 199,
    period: "month",
    description: "Para clínicas estabelecidas",
    features: [
      "Pacientes ilimitados",
      "Até 10 profissionais",
      "Múltiplas unidades",
      "IA Assistant incluído",
      "Automação WhatsApp completa",
      "API access",
      "Branding personalizado",
      "Relatórios customizados",
      "Suporte prioritário",
    ],
    limits: {
      patients: "unlimited",
      professionals: 10,
      locations: 3,
      apiAccess: true,
      whatsappAutomation: true,
      aiAssistant: true,
      customBranding: true,
      sso: false,
      prioritySupport: true,
    },
    stripePriceId: "price_pro_monthly",
    mercadoPagoPreferenceId: "pro_monthly",
    popular: true,
    cta: "Assinar Profissional",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499,
    period: "month",
    description: "Para redes de clínicas e franquias",
    features: [
      "Tudo do Profissional +",
      "Profissionais ilimitados",
      "Unidades ilimitadas",
      "SSO (Login único)",
      "Auditoria completa",
      "SLA garantido",
      "Gerente de sucesso dedicado",
      "Migração de dados inclusa",
      "Treinamento da equipe",
    ],
    limits: {
      patients: "unlimited",
      professionals: "unlimited",
      locations: "unlimited",
      apiAccess: true,
      whatsappAutomation: true,
      aiAssistant: true,
      customBranding: true,
      sso: true,
      prioritySupport: true,
    },
    stripePriceId: "price_enterprise_monthly",
    mercadoPagoPreferenceId: "enterprise_monthly",
    cta: "Falar com vendas",
  },
];

function FeatureIcon({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-sm">
      {enabled ? (
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
      )}
      <span className={enabled ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>
        {children}
      </span>
    </span>
  );
}

function PlanCard({ plan, isCurrent, onSelect, isLoading }: { plan: Plan; isCurrent: boolean; onSelect: () => void; isLoading: boolean }) {
  return (
    <div
      className={`relative rounded-2xl border-2 p-6 lg:p-8 transition-all ${
        isCurrent
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg shadow-emerald-500/10"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700"
      } ${plan.popular ? "ring-2 ring-emerald-500" : ""}`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            MAIS POPULAR
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white">
            R$ {plan.price.toFixed(2).replace(".", ",")}
          </span>
          <span className="text-slate-500 dark:text-slate-400">/mês</span>
        </div>
        {plan.price === 0 && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <Shield className="w-4 h-4" />
            30 dias de trial grátis • Cancele quando quiser
          </p>
        )}
        {plan.price > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sem taxa de adesão • Cancele quando quiser
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-8" role="list">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-700 dark:text-slate-300 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrent || isLoading}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          isCurrent
            ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed"
            : plan.price === 0
            ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md"
        }`}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isCurrent ? (
          <>
            <Check className="w-4 h-4" />
            Plano atual
          </>
        ) : plan.id === "enterprise" ? (
          <>
            <ExternalLink className="w-4 h-4" />
            {plan.cta}
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {plan.cta}
          </>
        )}
      </button>

      {plan.price > 0 && !isCurrent && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
          Cobrança recorrente mensal • NF-e emitida automaticamente
        </p>
      )}
    </div>
  );
}

function PaymentMethodSelector({ selectedMethod, onChange }: { selectedMethod: "stripe" | "mercadopago"; onChange: (m: "stripe" | "mercadopago") => void }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
        Forma de pagamento
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("stripe")}
          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
            selectedMethod === "stripe"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
              : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CreditCard className="w-5 h-5" />
            <span className="font-semibold">Cartão de Crédito</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Stripe (Visa, Master, Amex, Elo)</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("mercadopago")}
          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
            selectedMethod === "mercadopago"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
              : "border-slate-200 dark:border-slate-700 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Smartphone className="w-5 h-5" />
            <span className="font-semibold">PIX / Boleto</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Mercado Pago (PIX, Boleto, Cartão)</span>
        </button>
      </div>
    </div>
  );
}

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  if (daysLeft <= 0) return null;
  return (
    <div className="mb-8 p-4 rounded-xl flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-amber-800 dark:text-amber-200">
          Período de teste gratuito
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Restam <strong>{daysLeft} dia{daysLeft !== 1 ? "s" : ""}</strong> no seu trial de 30 dias.
          {daysLeft <= 7 && " Assine agora para não perder acesso ao painel."}
        </p>
      </div>
    </div>
  );
}

function PaymentSuccess({ planName }: { planName: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Assinatura ativada com sucesso!
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
        Seu plano <strong>{planName}</strong> está ativo. Você já pode acessar todos os recursos do painel administrativo.
      </p>
      <button
        onClick={() => window.location.href = "/app/agenda"}
        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 mx-auto"
      >
        Ir para o painel
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, isAuthReady } = useAuth();

  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "mercadopago">("stripe");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTrialActive = trialDaysLeft > 0;

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const user = getCurrentAdminUser();
        if (!user?.clinicId) {
          navigate("/login");
          return;
        }

        const cached = getCachedClinicConfig();
        if (cached?.subscription) {
          setCurrentPlan(cached.subscription.plan || "free");
          if (cached.createdAt) {
            const trialEnd = new Date(new Date(cached.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
            const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            setTrialDaysLeft(daysLeft);
          }
        } else {
          const fullConfig = await loadClinicConfig(user.clinicId);
          if (fullConfig?.subscription) {
            setCurrentPlan(fullConfig.subscription.plan || "free");
            if (fullConfig.createdAt) {
              const trialEnd = new Date(new Date(fullConfig.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000);
              const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
              setTrialDaysLeft(daysLeft);
            }
            setClinicConfig(fullConfig);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar assinatura:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthReady) {
      loadSubscription();
    }
  }, [isAuthReady, navigate]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("success") === "true") {
      const planId = searchParams.get("plan");
      const plan = PLANS.find(p => p.id === planId);
      setShowSuccess(true);
      setSelectedPlan(plan || null);
      searchParams.delete("success");
      searchParams.delete("plan");
      window.history.replaceState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
    } else if (searchParams.get("canceled") === "true") {
      setError("Pagamento cancelado. Tente novamente ou escolha outro método.");
      searchParams.delete("canceled");
      window.history.replaceState({}, "", `${window.location.pathname}?${searchParams.toString()}`);
    }
  }, [location.search]);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === "free") return;
    setSelectedPlan(plan);
    setError(null);
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return;
    setPaymentLoading(true);
    setError(null);

    try {
      const user = getCurrentAdminUser();
      if (!user?.clinicId) throw new Error("Usuário não autenticado");

      const isStripe = paymentMethod === "stripe";

      // Em produção, isso seria uma chamada para sua API/backend que cria a sessão de checkout
      // Para demo, vamos simular redirecionamento
      if (isStripe) {
        // window.location.href = `https://checkout.stripe.com/pay/${selectedPlan.stripePriceId}?client_reference_id=${user.clinicId}&success_url=${window.location.origin}/assinatura?success=true&plan=${selectedPlan.id}&cancel_url=${window.location.origin}/assinatura?canceled=true`
        console.log("Redirect to Stripe Checkout:", selectedPlan.stripePriceId);
        // Simulate success for demo
        setTimeout(() => {
          navigate(`/assinatura?success=true&plan=${selectedPlan.id}`);
        }, 1500);
      } else {
        // window.location.href = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${selectedPlan.mercadoPagoPreferenceId}&external_reference=${user.clinicId}&back_urls[success]=${window.location.origin}/assinatura?success=true&plan=${selectedPlan.id}&back_urls[failure]=${window.location.origin}/assinatura?canceled=true`
        console.log("Redirect to Mercado Pago:", selectedPlan.mercadoPagoPreferenceId);
        setTimeout(() => {
          navigate(`/assinatura?success=true&plan=${selectedPlan.id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleManageSubscription = () => {
    // Em produção, redirecionar para portal do cliente Stripe/MercadoPago
    alert("Em produção, isso abriria o portal de gerenciamento de assinatura do provedor de pagamento.");
  };

  const currentPlanData = PLANS.find(p => p.id === currentPlan);

  if (showSuccess && selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <PaymentSuccess planName={selectedPlan.name} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 py-12 lg:py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 lg:mb-12">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                Planos e Assinatura
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Escolha o plano ideal para sua clínica
              </p>
            </div>
          </div>
          {adminUser && (
            <button
              onClick={handleManageSubscription}
              className="hidden lg:flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
            >
              <Lock className="w-4 h-4" />
              Gerenciar assinatura
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {currentPlan !== "free" && currentPlanData && (
          <div className="mb-8 p-4 rounded-xl flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                Plano ativo: <strong>{currentPlanData.name}</strong>
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Renova automaticamente todo mês • <button onClick={handleManageSubscription} className="underline hover:text-emerald-600">Gerenciar</button>
              </p>
            </div>
          </div>
        )}

        {currentPlan === "free" && isTrialActive && (
          <TrialBanner daysLeft={trialDaysLeft} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={currentPlan === plan.id}
              onSelect={() => handleSelectPlan(plan)}
              isLoading={paymentLoading}
            />
          ))}
        </div>

        {selectedPlan && selectedPlan.id !== "free" && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 lg:p-8 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Finalizar assinatura: {selectedPlan.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  R$ {selectedPlan.price.toFixed(2).replace(".", ",")}/mês
                </p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label="Fechar"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onChange={setPaymentMethod}
            />

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 dark:text-white">Valor mensal</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white" style={{ color: brandColor }}>
                    R$ {selectedPlan.price.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Primeira cobrança: Hoje</span>
                  <span>Renovação: Mensal automática</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-emerald-800 dark:text-emerald-200">
                    <p className="font-semibold mb-1">Pagamento seguro</p>
                    <p>Processado por {paymentMethod === "stripe" ? "Stripe" : "Mercado Pago"} — certificação PCI DSS Nível 1. Seus dados de cartão nunca tocam nossos servidores.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={paymentLoading}
                  className="flex-1 px-6 py-3 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: brandColor }}
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "stripe" ? <CreditCard className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      Confirmar e pagar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 lg:mt-16">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
            Perguntas frequentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { q: "Posso cancelar a qualquer momento?", a: "Sim, todas as assinaturas podem ser canceladas a qualquer momento. O acesso permanece até o final do período pago." },
              { q: "Como funciona o trial de 30 dias?", a: "Novas clínicas têm 30 dias grátis no plano Free. Após o trial, é necessário assinar um plano pago para continuar acessando o painel administrativo. O portal do cliente permanece gratuito." },
              { q: "Quais formas de pagamento são aceitas?", a: "Cartão de crédito (Visa, Mastercard, Amex, Elo) via Stripe, e PIX, Boleto ou Cartão via Mercado Pago. A primeira cobrança ocorre no momento da assinatura." },
              { q: "Posso mudar de plano depois?", a: "Sim, você pode fazer upgrade ou downgrade a qualquer momento. No upgrade, a diferença é cobrada proporcionalmente. No downgrade, o novo valor vale no próximo ciclo." },
              { q: "Emitem nota fiscal?", a: "Sim, emitimos NF-e automaticamente para todos os pagamentos. A nota é enviada por e-mail e fica disponível no painel administrativo." },
              { q: "O portal do cliente é gratuito?", a: "Sim, o portal público de agendamento (/cliente/:sua-clinica) é 100% gratuito para seus pacientes, independentemente do seu plano." },
            ].map((faq, i) => (
              <details key={i} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <summary className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer list-none">
                  {faq.q}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform ml-auto" />
                </summary>
                <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-8">
          <p>CuidarX - Sistema de Gestão para Clínicas</p>
          <p className="mt-1">Seguro • LGPD Compliant • Multi-clínica</p>
        </div>
      </div>
    </div>
  );
}

const brandColor = "#0B4C33";