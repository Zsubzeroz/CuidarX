import React, { useState } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../services/firebase";
import { sanitizePhone, formatPhoneBR, isValidPhoneBR } from "../utils/sanitize";
import { generateICSFile } from "../utils/generateICS";
import { generateGoogleCalendarLink } from "../utils/generateGoogleCalendarLink";
import type { Appointment } from "../types";

const CLINIC_ADDRESS = "Rua Exemplo, 123 — Centro, Cidade/UF";

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
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[] | null>(null);
  const [searched, setSearched] = useState(false);

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

    setLoading(true);
    setError(null);
    setResults(null);
    setSearched(false);

    try {
      // 1. Find patients by phoneNormalized
      const patientsSnap = await getDocs(
        query(
          collection(db, "patients"),
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

      // 2. Find scheduled appointments for these patients
      const today = getTodayStr();
      const allResults: ResultItem[] = [];

      for (const pid of patientIds) {
        const apptsSnap = await getDocs(
          query(
            collection(db, "appointments"),
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

      // 3. Sort by date ASC, then time ASC
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F2F0EA] flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        {/* @ts-ignore */}
        <img
          src="/logo-fr.png"
          alt="Clínica Dra. Fabrícia Rodrigues"
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm border-2 border-[#C8A45A]/30 mb-3"
          referrerPolicy="no-referrer"
        />
        <h1 className="text-lg sm:text-xl font-bold text-[#0F3B2E] text-center" style={{ fontFamily: "var(--font-display)" }}>
          Dra. Fabrícia Rodrigues
        </h1>
        <p className="text-xs text-[#C8A45A] font-medium tracking-wide">PODOLOGA</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_2px_16px_rgba(15,59,46,0.06)] border border-slate-100 overflow-hidden">
        {/* Green header */}
        <div className="bg-[#0F3B2E] px-6 py-4">
          <h2 className="text-white font-bold text-base text-center" style={{ fontFamily: "var(--font-display)" }}>
            Consultar Agendamento
          </h2>
          <p className="text-white/70 text-[11px] text-center mt-1">
            Informe o celular usado no agendamento
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSearch} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
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
              className="w-full text-[16px] sm:text-sm p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#0F3B2E] focus:ring-0 transition-colors min-h-[48px]"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full bg-[#0F3B2E] hover:bg-[#1B523E] disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow-sm hover:shadow transition-all text-sm min-h-[48px] cursor-pointer disabled:cursor-not-allowed"
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

        {/* Results */}
        {searched && results !== null && (
          <div className="border-t border-slate-100 px-5 sm:px-6 pb-5 pt-4">
            {results.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Nenhum agendamento ativo encontrado
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  para este número de celular.
                </p>
                <a
                  href="/cliente"
                  className="inline-block mt-4 text-xs font-semibold text-[#0F3B2E] underline underline-offset-2 hover:text-[#1B523E] transition-colors"
                >
                  Fazer novo agendamento
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium">
                  {results.length} agendamento{results.length > 1 ? "s" : ""} encontrado{results.length > 1 ? "s" : ""}:
                </p>
                {results.map((item, idx) => (
                  <div
                    key={item.appointment.id || idx}
                    className="bg-gradient-to-r from-[#F2F7F5] to-white border border-[#0F3B2E]/10 rounded-xl p-4"
                  >
                    {/* Patient name (if multiple patients share this phone) */}
                    {new Set(results.map((r) => r.patientName)).size > 1 && (
                      <p className="text-[10px] font-bold text-[#C8A45A] uppercase tracking-wider mb-1.5">
                        {item.patientName}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#0F3B2E] bg-[#0F3B2E]/10 px-2 py-0.5 rounded uppercase">
                          Data
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          {formatDateBR(item.appointment.date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#C8A45A] bg-[#C8A45A]/10 px-2 py-0.5 rounded uppercase">
                          Horário
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {item.appointment.time}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                          Procedimento
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {item.appointment.service}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase shrink-0">
                          Local
                        </span>
                        <span className="text-[11px] text-slate-500 leading-snug">
                          {CLINIC_ADDRESS}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <a
                        href={generateGoogleCalendarLink({
                          date: item.appointment.date,
                          time: item.appointment.time,
                          procedure: item.appointment.service,
                          location: CLINIC_ADDRESS,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#C8A45A] hover:bg-[#A8833C] text-white font-bold py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        Google Agenda
                      </a>
                      <button
                        onClick={() =>
                          generateICSFile({
                            date: item.appointment.date,
                            time: item.appointment.time,
                            procedure: item.appointment.service,
                            patientName: item.patientName,
                            location: CLINIC_ADDRESS,
                          })
                        }
                        className="flex-1 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
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
      </div>

      {/* Footer link */}
      <a
        href="/cliente"
        className="mt-5 text-xs text-[#0F3B2E]/60 hover:text-[#0F3B2E] transition-colors underline underline-offset-2"
      >
        ← Voltar ao agendamento
      </a>

      <p className="text-[10px] text-slate-400 text-center mt-6">
        © 2026 Clínica Dra. Fabrícia Rodrigues. Todos os direitos reservados. • Desenvolvido por Luan Estifer Rodrigues Pereira (Software Engineer).
      </p>
    </div>
  );
}
