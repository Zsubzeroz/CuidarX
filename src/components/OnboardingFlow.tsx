import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signupWithEmail,
  loginWithEmailPassword,
  loginWithGoogle,
  handleAuthRedirect,
  logout,
  getCurrentAdminUser,
} from "../services/multiTenantAuth";
import { loadClinicConfig, clearClinicConfigCache } from "../services/clinicConfigService";
import { setClinicConfig, resetClinicConfig } from "../config";
import { setClinicId } from "../services/firestoreService";
import {
  User,
  Mail,
  Lock,
  Building2,
  Stethoscope,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  LogIn,
  UserPlus,
} from "lucide-react";

type AuthMode = "login" | "signup" | "loading" | "redirect";

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    clinicName: "",
    doctorName: "",
    doctorSpecialty: "Podologia",
    slug: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const specialties = [
    "Podologia",
    "Fisioterapia",
    "Enfermagem",
    "Nutrição",
    "Psicologia",
    "Medicina Geral",
    "Dermatologia",
    "Ortopedia",
    "Cardiologia",
    "Outra",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    
    if (name === "clinicName") {
      const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const validateLoginForm = () => {
    if (!formData.email.trim()) return "E-mail é obrigatório";
    if (!formData.password) return "Senha é obrigatória";
    return null;
  };

  const validateSignupForm = () => {
    if (!formData.clinicName.trim()) return "Nome da clínica é obrigatório";
    if (!formData.doctorName.trim()) return "Nome do profissional é obrigatório";
    if (!formData.doctorSpecialty.trim()) return "Especialidade é obrigatória";
    if (!formData.slug.trim()) return "Slug da clínica é obrigatório";
    if (!formData.email.trim()) return "E-mail é obrigatório";
    if (!formData.password) return "Senha é obrigatória";
    if (formData.password.length < 6) return "Senha deve ter pelo menos 6 caracteres";
    if (formData.password !== formData.confirmPassword) return "Senhas não coincidem";
    if (!agreedToTerms) return "Você deve concordar com os termos de uso";
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateLoginForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const adminUser = await loginWithEmailPassword(formData.email, formData.password);
      await loadClinicData(adminUser.clinicId);
      navigate("/");
    } catch (err: any) {
      setError(err.message === "UNAUTHORIZED" 
        ? "E-mail não autorizado para esta clínica" 
        : err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateSignupForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const adminUser = await signupWithEmail(formData.email, formData.password, {
        clinicName: formData.clinicName,
        doctorName: formData.doctorName,
        doctorSpecialty: formData.doctorSpecialty,
        slug: formData.slug,
      });
      await loadClinicData(adminUser.clinicId);
      navigate("/");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (err.code === "auth/invalid-email") {
        setError("E-mail inválido");
      } else if (err.code === "auth/weak-password") {
        setError("Senha muito fraca. Use pelo menos 6 caracteres.");
      } else {
        setError(err.message || "Erro ao criar conta");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const adminUser = await loginWithGoogle();
      await loadClinicData(adminUser.clinicId);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login com Google");
    } finally {
      setIsLoading(false);
    }
  };

  const loadClinicData = async (clinicId: string) => {
    const config = await loadClinicConfig(clinicId);
    if (config) {
      setClinicConfig(config);
      setClinicId(config.clinicId);
      clearClinicConfigCache();
    }
  };

  const checkRedirect = async () => {
    setMode("redirect");
    setIsLoading(true);
    
    try {
      const adminUser = await handleAuthRedirect();
      if (adminUser) {
        await loadClinicData(adminUser.clinicId);
        navigate("/");
      } else {
        setMode("login");
      }
    } catch (err) {
      console.error("Erro no redirect:", err);
      setMode("login");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  const handleLogout = async () => {
    await logout();
    resetClinicConfig();
    setClinicId(null);
    clearClinicConfigCache();
    navigate("/login");
  };

  if (mode === "redirect" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Carregando...</p>
        </div>
      </div>
    );
  }

  const currentUser = getCurrentAdminUser();
  if (currentUser && location.pathname === "/login") {
    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <Stethoscope className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {mode === "signup" ? "Criar minha clínica" : "Acessar minha clínica"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                {mode === "signup" 
                  ? "Configure sua clínica e comece a gerenciar seus pacientes"
                  : "Faça login para acessar seu painel administrativo"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
              </div>
            )}

            {currentUser && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{currentUser.name || currentUser.email}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.clinicName}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={mode === "signup" ? handleSignup : handleLogin} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    Dados da Clínica
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nome da Clínica *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="clinicName"
                        value={formData.clinicName}
                        onChange={handleInputChange}
                        placeholder="Ex: Clínica Vida Saudável"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Profissional *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="doctorName"
                        value={formData.doctorName}
                        onChange={handleInputChange}
                        placeholder="Ex: Dra. Maria Silva"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Especialidade *
                    </label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        name="doctorSpecialty"
                        value={formData.doctorSpecialty}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none"
                        required
                      >
                        {specialties.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Link da Clínica (slug) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">cuidarx.com/cliente/</span>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="minha-clinica"
                        className="w-full pl-36 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        required
                        pattern="[a-z0-9-]+"
                        maxLength={50}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Apenas letras minúsculas, números e hífen. Ex: minha-clinica
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  Credenciais de Acesso
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Confirmar Senha *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {mode === "signup" && (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600 dark:text-slate-400">
                    Concordo com os <a href="/termos" className="text-emerald-600 hover:underline" target="_blank" rel="noopener">Termos de Uso</a> e <a href="/privacidade" className="text-emerald-600 hover:underline" target="_blank" rel="noopener">Política de Privacidade</a>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Aguarde...
                  </>
                ) : mode === "signup" ? (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Criar Clínica e Acessar
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Entrar
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  ou continue com
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continuar com Google</span>
            </button>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
              <button
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                {mode === "login" ? "Criar minha clínica" : "Fazer login"}
              </button>
            </p>

            <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
              <p>CuidarX - Sistema de Gestão para Clínicas</p>
              <p>Multi-clínica • Seguro • LGPD Compliant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}