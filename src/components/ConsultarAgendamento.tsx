import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db, isFirebaseConfigured } from "../services/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { sanitizePhone, formatPhoneBR, isValidPhoneBR } from "../utils/sanitize";
import { generateICSFile } from "../utils/generateICS";
import { generateGoogleCalendarLink } from "../utils/generateGoogleCalendarLink";
import type { Appointment } from "../types";
import { getClinicBySlug } from "../services/multiTenantFirestore";
import { loadClinicConfig, getCachedClinicConfig } from "../services/clinicConfigService";
import { setClinicId, getClinicId } from "../services/firestoreService";
import { Building2, Loader2, Calendar, Clock, MapPin, Star, ArrowLeft, CheckCircle } from "lucide-react";

interface ResultItem {
  patientName: string;
  appointment: Appointment;
}

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function ConsultarAgendamento() {
  const { clinicSlug } = useParams<{ clinicSlug: string }>();
  const [clinicConfig, setClinicConfig] = useState<{
    id: string;
    name: string;
    slug: string;
    doctorName: string;
    doctorSpecialty: string;
    logoPath: string;
    primaryColor: string;
    accentColor: string;
    city: string;
    state: string;
    address: string;
  } | null>(null);

  const [isLoadingClinic, setIsLoadingClinic] = useState(true);
  const [clinicError, setClinicError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const loadClinic = async () => {
      if (!clinicSlug) {
        setClinicError("Slug da clínica não fornecido");
        setIsLoadingClinic(false);
        return;
      }

      setIsLoadingClinic(true);
      setClinicError(null);

      try {
        const clinic = await getClinicBySlug(clinicSlug);
        if (!clinic) {
          setClinicError("Clínica não encontrada");
          setIsLoadingClinic(false);
          return;
        }

        const fullConfig = await loadClinicConfig(clinic.id);
        if (fullConfig) {
          setClinicConfig({
            id: clinic.id,
            name: clinic.name,
            slug: clinic.slug,
            doctorName: clinic.doctorName,
            doctorSpecialty: clinic.doctorSpecialty,
            logoPath: clinic.logoPath,
            primaryColor: clinic.primaryColor,
            accentColor: clinic.accentColor,
            city: clinic.city || "",
            state: clinic.state || "",
            address: clinic.address || "Rua Exemplo, 123 — Centro, Cidade/UF",
          });
          setClinicId(clinic.id);
        }
      } catch (err: any) {
        console.error("Erro ao carregar clínica:", err);
        setClinicError(err.message || "Erro ao carregar clínica");
      } finally {
        setIsLoadingClinic(false);
      }
    };

    loadClinic();
  }, [clinicSlug]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");

    if (!isValidPhoneBR(digits)) {
      setError("Informe um celular válido com DDD (10 ou 11 dígitos).");
      return;
    }

    if (!isFirebaseConfigured || !db) {
      setError("Serviço indisponível. Tente novamente mais tarde.");
      return;
    }

    const clinicId = getClinicId();
    if (!clinicId) {
      setError("Clínica não identificada.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setSearched(false);

    try {
      const patientsSnap = await getDocs(
        query(
          collection(db, "clinics", clinicId, "patients"),
          where("phoneNormalized", "==", digits),
          limit(10)
        )
      );

      if (patientsSnap.empty) {
        setResults([]);
        setSearched(true);
        setLoading(false);
        return;
      }

      const patientIds = patientsSnap.docs.map((d) => d.id);
      const patientNames: Record<string, string> = {};
      patientsSnap.docs.forEach((d) => {
        patientNames[d.id] = d.data().name || "Paciente";
      });

      const today = getTodayStr();
      const allResults: ResultItem[] = [];

      for (const pid of patientIds) {
        const apptsSnap = await getDocs(
          query(
            collection(db, "clinics", clinicId, "appointments"),
            where("patientId", "==", pid),
            where("status", "==", "scheduled"),
            limit(20)
          )
        );

        apptsSnap.docs.forEach((doc) => {
          const data = doc.data() as Appointment;
          if (data.date >= today) {
            allResults.push({
              patientName: patientNames[pid] || "Paciente",
              appointment: { ...data, id: doc.id },
            });
          }
        });
      }

      allResults.sort((a, b) => {
        const dateCmp = a.appointment.date.localeCompare(b.appointment.date);
        if (dateCmp !== 0) return dateCmp;
        return a.appointment.time.localeCompare(b.appointment.time);
      });

      setResults(allResults);
      setSearched(true);
    } catch (err: any) {
      console.error("Error querying appointments:", err);
      setError("Erro ao buscar agendamentos. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingClinic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Carregando clínica...</p>
        </div>
      </div>
    );
  }

  if (clinicError || !clinicConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <Building2 className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Clínica não encontrada</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{clinicError || "A clínica solicitada não existe ou não está ativa."}</p>
          <Link
            to="/cliente"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para busca
          </Link>
        </div>
      </div>
    );
  }

  const brandColor = clinicConfig.primaryColor || "#0B4C33";
  const accentColor = clinicConfig.accentColor || "#CBAA6C";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center px-4 py-8">
      <div className="flex flex-col items-center mb-6">
        {clinicConfig.logoPath && clinicConfig.logoPath !== "/logo.png" ? (
          <img
            src={clinicConfig.logoPath}
            alt={clinicConfig.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm border-2 border-white/50 mb-3"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-3 shadow-sm border-2 border-white/50"
            style={{ backgroundColor: brandColor }}
          >
            <Building2 className="w-10 h-10 text-white" />
          </div>
        )}
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white text-center">
          {clinicConfig.doctorName}
        </h1>
        <p className="text-xs text-emerald-700 font-medium tracking-wide">{clinicConfig.doctorSpecialty}</p>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 text-center" style={{ backgroundColor: brandColor }}>
          <h2 className="text-white font-bold text-base">Consultar Agendamento</h2>
          <p className="text-white/70 text-[11px] mt-1">
            Informe o celular usado no agendamento
          </p>
        </div>

        <form onSubmit={handleSearch} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Celular / WhatsApp
            </label>
            <input
              type="tel"
              inputMode="tel"
              required
              placeholder="(11) 98888-7777"
              value={phone}
              onChange={(e) => {
                const raw = sanitizePhone(e.target.value);
                setPhone(formatPhoneBR(raw));
              }}
              className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-brand focus:ring-0 transition-colors min-h-[48px" style={{ borderColor: brandColor, backgroundColor: "white", color: "black" }}
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full text-white font-bold py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm min-h-[48px] cursor-pointer disabled:cursor-not-allowed"
            style={{ backgroundColor: brandColor }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Buscando...
              </span>
            ) : (
              "Consultar agendamento"
            )}
          </button>
        </form>

        {searched && results !== null && (
          <div className="border-t border-slate-100 dark:border-slate-700 px-5 sm:px-6 pb-5 pt-4">
            {results.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Nenhum agendamento ativo encontrado
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  para este número de celular.
                </p>
                <Link
                  to={`/cliente/${clinicSlug}`}
                  className="inline-block mt-4 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                  style={{ color: brandColor }}
                >
                  Fazer novo agendamento
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {results.length} agendamento{results.length > 1 ? "s" : ""} encontrado{results.length > 1 ? "s" : ""}:
                </p>
                {results.map((item, idx) => (
                  <div
                    key={item.appointment.id || idx}
                    className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4"
                  >
                    {new Set(results.map((r) => r.patientName)).size > 1 && (
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>
                        {item.patientName}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ backgroundColor: `${brandColor}1A`, color: brandColor }}>
                          Data
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatDateBR(item.appointment.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}>
                          Horário
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {item.appointment.time}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase" style={{ backgroundColor: "#10B9811A", color: "#10B981" }}>
                          Procedimento
                        </span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {item.appointment.service}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0" style={{ backgroundColor: "#F59E0B1A", color: "#F59E0B" }}>
                          Local
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          {clinicConfig.address}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <a
                        href={generateGoogleCalendarLink({
                          date: item.appointment.date,
                          time: item.appointment.time,
                          procedure: item.appointment.service,
                          location: clinicConfig.address,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: brandColor }}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Google Agenda
                      </a>
                      <button
                        onClick={() =>
                          generateICSFile({
                            date: item.appointment.date,
                            time: item.appointment.time,
                            procedure: item.appointment.service,
                            patientName: item.patientName,
                            location: clinicConfig.address,
                          })
                        }
                        className="flex-1 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 font-bold py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Baixar .ics
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      <Link
        to={`/cliente/${clinicSlug}`}
        className="block text-center mt-5 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        style={{ color: brandColor }}
      >
        ← Voltar ao agendamento
      </Link>

      <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-6 mb-4">
        © 2026 {clinicConfig.name}. Todos os direitos reservados.
      </p>
    </div>
  </div>
  );
}