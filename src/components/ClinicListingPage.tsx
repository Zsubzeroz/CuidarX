import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, isFirebaseConfigured } from "../services/firebase";
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from "firebase/firestore";
import { useResponsive } from "../hooks/useResponsive";
import {
  Search,
  MapPin,
  Filter,
  X,
  Loader2,
  Building2,
  Stethoscope,
  MapPin as MapPinIcon,
  Star,
  CreditCard,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClinicCardData {
  id: string;
  name: string;
  slug: string;
  doctorName: string;
  doctorSpecialty: string;
  logoPath: string;
  primaryColor: string;
  city: string;
  state: string;
  acceptsInsurance: boolean;
  averageRating: number;
  reviewCount: number;
  priceRange: { min: number; max: number };
  subscription: {
    plan: string;
    status: string;
  };
  createdAt: string;
}

const STATES = [
  { value: "", label: "Todos os estados" },
  { value: "SP", label: "São Paulo" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "MG", label: "Minas Gerais" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "PR", label: "Paraná" },
  { value: "SC", label: "Santa Catarina" },
  { value: "BA", label: "Bahia" },
  { value: "DF", label: "Distrito Federal" },
  { value: "GO", label: "Goiás" },
  { value: "PE", label: "Pernambuco" },
  { value: "CE", label: "Ceará" },
  { value: "outro", label: "Outro" },
];

const SPECIALTIES = [
  { value: "", label: "Todas as especialidades" },
  { value: "Podologia", label: "Podologia" },
  { value: "Fisioterapia", label: "Fisioterapia" },
  { value: "Enfermagem", label: "Enfermagem" },
  { value: "Nutrição", label: "Nutrição" },
  { value: "Psicologia", label: "Psicologia" },
  { value: "Medicina Geral", label: "Medicina Geral" },
  { value: "Dermatologia", label: "Dermatologia" },
  { value: "Ortopedia", label: "Ortopedia" },
  { value: "Cardiologia", label: "Cardiologia" },
  { value: "Outra", label: "Outra" },
];

function ClinicCard({ clinic }: { clinic: ClinicCardData }) {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/cliente/${clinic.slug}`);
  };

  return (
    <article
      onClick={handleClick}
      className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col"
      style={{ borderTop: `4px solid ${clinic.primaryColor || "#0B4C33"}` }}
    >
      <div className="relative h-40 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
        {clinic.logoPath && clinic.logoPath !== "/logo.png" ? (
          <img
            src={clinic.logoPath}
            alt={clinic.name}
            className="w-20 h-20 rounded-xl object-cover border-2 border-white/50 shadow-lg"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: clinic.primaryColor || "#0B4C33" }}
          >
            <Building2 className="w-10 h-10 text-white" />
          </div>
        )}

        <div className="absolute top-3 right-3 flex gap-1">
          {clinic.subscription?.status === "active" && (
            <span className="px-2 py-1 text-xs font-semibold text-white rounded-full bg-emerald-600">
              Ativa
            </span>
          )}
          {clinic.acceptsInsurance && (
            <span className="px-2 py-1 text-xs font-semibold text-white rounded-full bg-blue-600">
              Convênio
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {clinic.name}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
              {clinic.doctorName} • {clinic.doctorSpecialty}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{clinic.city}, {clinic.state}</span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-medium">{clinic.averageRating.toFixed(1)}</span>
            <span className="text-slate-400">({clinic.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CreditCard className="w-4 h-4" />
            <span className="font-medium text-sm">
              {clinic.priceRange.min === clinic.priceRange.max
                ? `R$ ${clinic.priceRange.min}`
                : `R$ ${clinic.priceRange.min} - ${clinic.priceRange.max}`}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleClick(); }}
          className="w-full py-2.5 px-4 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
          style={{ backgroundColor: clinic.primaryColor || "#0B4C33" }}
        >
          Agendar Consulta
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </article>
  );
}

function SearchFilters({
  searchTerm,
  setSearchTerm,
  specialty,
  setSpecialty,
  city,
  setCity,
  state,
  setState,
  acceptsInsurance,
  setAcceptsInsurance,
  onClear,
  hasFilters,
}: {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  specialty: string;
  setSpecialty: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  acceptsInsurance: boolean;
  setAcceptsInsurance: (v: boolean) => void;
  onClear: () => void;
  hasFilters: boolean;
}) {
  const { isMobile } = useResponsive();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 lg:p-6 shadow-sm sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Filter className="w-5 h-5 text-emerald-600" />
          Filtros
        </h2>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Buscar por nome ou especialidade
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: Clínica Vida, Podologia..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Especialidade
          </label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none"
          >
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cidade
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: São Paulo"
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Estado
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none"
            >
              {STATES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="insurance"
            checked={acceptsInsurance}
            onChange={(e) => setAcceptsInsurance(e.target.checked)}
            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="insurance" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            Aceita convênio
          </label>
        </div>
      </div>
    </div>
  );
}

export default function ClinicListingPage() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const [clinics, setClinics] = useState<ClinicCardData[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<ClinicCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [acceptsInsurance, setAcceptsInsurance] = useState(false);

  const [showFilters, setShowFilters] = useState(!isMobile);

  const hasFilters = !!(searchTerm || specialty || city || state || acceptsInsurance);

  const clearFilters = () => {
    setSearchTerm("");
    setSpecialty("");
    setCity("");
    setState("");
    setAcceptsInsurance(false);
  };

  const loadClinics = useCallback(async () => {
    if (!isFirebaseConfigured || !db) {
      setError("Firebase não configurado");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, "clinics"),
        where("subscription.status", "==", "active"),
        orderBy("name"),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const clinicsData: ClinicCardData[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Buscar preço médio dos serviços
        let priceRange = { min: 0, max: 0 };
        try {
          const servicesSnap = await getDocs(
            query(collection(db, "clinics", docSnap.id, "services"), where("isActive", "==", true))
          );
          const prices = servicesSnap.docs
            .map(d => d.data().price)
            .filter(p => typeof p === "number" && p > 0);
          if (prices.length > 0) {
            priceRange = { min: Math.min(...prices), max: Math.max(...prices) };
          }
        } catch {}

        clinicsData.push({
          id: docSnap.id,
          name: data.name || "Clínica",
          slug: data.slug || "",
          doctorName: data.doctorName || "Profissional",
          doctorSpecialty: data.doctorSpecialty || "Saúde",
          logoPath: data.logoPath || "/logo.png",
          primaryColor: data.primaryColor || "#0B4C33",
          city: data.city || "",
          state: data.state || "",
          acceptsInsurance: data.acceptsInsurance || false,
          averageRating: data.averageRating || 0,
          reviewCount: data.reviewCount || 0,
          priceRange,
          subscription: data.subscription || { plan: "free", status: "active" },
          createdAt: data.createdAt || "",
        });
      }

      setClinics(clinicsData);
      setFilteredClinics(clinicsData);
      setHasLoaded(true);
    } catch (err: any) {
      console.error("Erro ao carregar clínicas:", err);
      setError(err.message || "Erro ao carregar clínicas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClinics();
  }, [loadClinics]);

  useEffect(() => {
    let result = [...clinics];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.doctorSpecialty.toLowerCase().includes(term) ||
        c.doctorName.toLowerCase().includes(term)
      );
    }

    if (specialty) {
      result = result.filter(c => c.doctorSpecialty === specialty);
    }

    if (city) {
      const term = city.toLowerCase();
      result = result.filter(c => c.city.toLowerCase().includes(term));
    }

    if (state) {
      result = result.filter(c => c.state === state);
    }

    if (acceptsInsurance) {
      result = result.filter(c => c.acceptsInsurance);
    }

    setFilteredClinics(result);
  }, [clinics, searchTerm, specialty, city, state, acceptsInsurance]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 py-12 lg:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Encontre sua Clínica Ideal
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Busque por nome, especialidade, cidade ou convênio. Agende online em segundos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                <div className="h-40 bg-slate-200 dark:bg-slate-700" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 py-8 lg:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 lg:mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Link
              to="/"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                Encontre sua Clínica
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {filteredClinics.length} clínica{filteredClinics.length !== 1 ? "s" : ""} encontrada{filteredClinics.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          <aside className="lg:col-span-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium shadow-sm"
            >
              <Filter className="w-5 h-5" />
              Filtros {hasFilters && <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs">{Object.values({ searchTerm, specialty, city, state, acceptsInsurance: acceptsInsurance.toString() }).filter(Boolean).length}</span>}
            </button>

            {showFilters && (
              <SearchFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                specialty={specialty}
                setSpecialty={setSpecialty}
                city={city}
                setCity={setCity}
                state={state}
                setState={setState}
                acceptsInsurance={acceptsInsurance}
                setAcceptsInsurance={setAcceptsInsurance}
                onClear={clearFilters}
                hasFilters={hasFilters}
              />
            )}
          </aside>

          <main className="lg:col-span-3">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {filteredClinics.length === 0 && hasLoaded ? (
              <div className="text-center py-16 lg:py-24">
                <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  Nenhuma clínica encontrada
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  Tente ajustar seus filtros ou buscar por termos mais genéricos.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 mx-auto"
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredClinics.map((clinic) => (
                    <ClinicCard key={clinic.id} clinic={clinic} />
                  ))}
                </div>

                {filteredClinics.length === 0 && !hasLoaded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                        <div className="h-40 bg-slate-200 dark:bg-slate-700" />
                        <div className="p-4 space-y-3">
                          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-full mt-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-8">
          <p>CuidarX - Conectando pacientes a profissionais de saúde</p>
          <p className="mt-1">Seguro • LGPD Compliant • Multi-clínica</p>
        </div>
      </div>
    </div>
  );
}