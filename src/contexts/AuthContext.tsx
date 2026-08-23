import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  loginWithEmailPassword,
  loginWithGoogle,
  handleAuthRedirect,
  logout,
  getCurrentAdminUser,
  onAuthStateChange,
  type AdminUser,
} from "../services/multiTenantAuth";
import { setClinicConfig, resetClinicConfig } from "../config";
import { setClinicId, getClinicId } from "../services/firestoreService";
import { loadClinicConfig, clearClinicConfigCache } from "../services/clinicConfigService";

interface AuthContextType {
  adminUser: AdminUser | null;
  isAuthReady: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadClinicData = useCallback(async (clinicId: string) => {
    const config = await loadClinicConfig(clinicId);
    if (config) {
      setClinicConfig(config);
      setClinicId(config.clinicId);
      clearClinicConfigCache();
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const stored = getCurrentAdminUser();
    if (stored) {
      setAdminUser(stored);
      if (stored.clinicId) {
        await loadClinicData(stored.clinicId);
      }
    }
    setIsAuthReady(true);
  }, [loadClinicData]);

  useEffect(() => {
    const unsub = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        const stored = getCurrentAdminUser();
        if (stored) {
          setAdminUser(stored);
          if (stored.clinicId) {
            await loadClinicData(stored.clinicId);
          }
        }
      } else {
        const stored = getCurrentAdminUser();
        if (!stored) {
          setAdminUser(null);
          resetClinicConfig();
          setClinicId(null);
          clearClinicConfigCache();
        }
      }
      setIsAuthReady(true);
    });
    return unsub;
  }, [loadClinicData]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const redirected = await handleAuthRedirect();
        if (redirected) {
          setAdminUser(redirected);
          if (redirected.clinicId) {
            await loadClinicData(redirected.clinicId);
          }
        }
      } catch (e) {
        console.error("Erro no redirect auth:", e);
      } finally {
        setIsAuthReady(true);
      }
    };
    initAuth();
  }, [loadClinicData]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await loginWithEmailPassword(email, password);
      setAdminUser(user);
      if (user.clinicId) {
        await loadClinicData(user.clinicId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      setAdminUser(user);
      if (user.clinicId) {
        await loadClinicData(user.clinicId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const doLogout = async () => {
    await logout();
    setAdminUser(null);
    resetClinicConfig();
    setClinicId(null);
    clearClinicConfigCache();
  };

  return (
    <AuthContext.Provider value={{ adminUser, isAuthReady, isLoading, login: login, loginWithGoogle: loginGoogle, logout: doLogout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}