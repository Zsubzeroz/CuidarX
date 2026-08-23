import { lazy, Suspense, ReactNode } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Loader2, Stethoscope } from "lucide-react";

const OnboardingFlow = lazy(() => import("./components/OnboardingFlow").then(m => ({ default: m.default })));
const AdminLayout = lazy(() => import("./components/AdminLayout").then(m => ({ default: m.default })));
const ClinicListingPage = lazy(() => import("./components/ClinicListingPage").then(m => ({ default: m.default })));
const BookingPortalView = lazy(() => import("./components/BookingPortalView").then(m => ({ default: m.default })));
const ConsultarAgendamento = lazy(() => import("./components/ConsultarAgendamento").then(m => ({ default: m.default })));
const SubscriptionPage = lazy(() => import("./components/SubscriptionPage").then(m => ({ default: m.default })));

function LoadingFallback({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">
      <div className="relative flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border-2 border-emerald-200 dark:border-emerald-800">
            <Stethoscope className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">{message}</p>
      </div>
    </div>
  );
}

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback message="Carregando portal do cliente..." />}>
      {children}
    </Suspense>
  );
}

function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback message="Carregando painel administrativo..." />}>
      {children}
    </Suspense>
  );
}

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingFallback message="Carregando..." />}>
      {children}
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <AuthLayout>
          <OnboardingFlow />
        </AuthLayout>
      } />
      <Route path="/assinatura" element={
        <AuthLayout>
          <SubscriptionPage />
        </AuthLayout>
      } />
      <Route path="/" element={<Navigate to="/cliente" replace />} />
      <Route element={<PublicLayout><Outlet /></PublicLayout>}>
        <Route path="/cliente" element={<ClinicListingPage />} />
        <Route path="/cliente/:clinicSlug" element={<BookingPortalView />} />
        <Route path="/cliente/:clinicSlug/consultar" element={<ConsultarAgendamento />} />
      </Route>
      <Route element={<PrivateLayout><AdminLayout /></PrivateLayout>}>
        <Route path="/app/*" element={<Outlet />} />
      </Route>
      <Route path="*" element={<Navigate to="/cliente" replace />} />
    </Routes>
  );
}