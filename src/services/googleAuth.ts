import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getAccessToken,
  silentConnectGoogle,
} from "./googleCalendar";

const AUTH_STORAGE_KEY = "google_admin_auth";
const AUTHORIZED_EMAIL =
  import.meta.env.VITE_AUTHORIZED_ADMIN_EMAIL || "fabriciapodologa@gmail.com";

export interface AdminUser {
  email: string;
  name?: string;
  picture?: string;
  loginAt: string;
}

export function getAuthorizedEmail(): string {
  return AUTHORIZED_EMAIL.toLowerCase();
}

export function isAuthorizedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === AUTHORIZED_EMAIL.toLowerCase();
}

export function getCurrentUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const user: AdminUser = JSON.parse(raw);
    if (!user || !isAuthorizedEmail(user.email)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function fetchGoogleUserInfo(
  token: string
): Promise<{ email: string; name?: string; picture?: string } | null> {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function loginWithGoogle(): Promise<AdminUser> {
  const token = await connectGoogleCalendar();

  const info = await fetchGoogleUserInfo(token);
  if (!info?.email) {
    disconnectGoogleCalendar();
    throw new Error("INVALID_RESPONSE");
  }

  if (!isAuthorizedEmail(info.email)) {
    disconnectGoogleCalendar();
    throw new Error("UNAUTHORIZED:" + info.email);
  }

  const user: AdminUser = {
    email: info.email,
    name: info.name,
    picture: info.picture,
    loginAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {}

  return user;
}

export async function trySilentLogin(): Promise<AdminUser | null> {
  const persisted = getCurrentUser();
  if (persisted) return persisted;

  try {
    const connected = await silentConnectGoogle();
    if (!connected) return null;
    const token = getAccessToken();
    if (!token) return null;
    const info = await fetchGoogleUserInfo(token);
    if (!info || !isAuthorizedEmail(info.email)) {
      disconnectGoogleCalendar();
      return null;
    }
    const user: AdminUser = {
      email: info.email,
      name: info.name,
      picture: info.picture,
      loginAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {}
    return user;
  } catch {
    return null;
  }
}

export function logout(): void {
  disconnectGoogleCalendar();
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}
