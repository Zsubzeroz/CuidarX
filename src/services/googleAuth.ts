import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getAccessToken,
  silentConnectGoogle,
  isNativePlatform,
} from "./googleCalendar";

export { isNativePlatform } from "./googleCalendar";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";

const AUTH_STORAGE_KEY = "google_admin_auth";

const ADMIN_EMAILS: string[] = [
  "fabriciapodologa@gmail.com",
];

export interface AdminUser {
  email: string;
  name?: string;
  picture?: string;
  loginAt: string;
}

export function getAuthorizedEmails(): string[] {
  return [...ADMIN_EMAILS];
}

export function isAuthorizedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin === normalized);
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

function firebaseUserToAdminUser(firebaseUser: FirebaseUser): AdminUser {
  return {
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || undefined,
    picture: firebaseUser.photoURL || undefined,
    loginAt: new Date().toISOString(),
  };
}

function saveAdminUser(user: AdminUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {}
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

// ====== FIREBASE AUTH (Android / Native) ======

export async function loginWithEmailPassword(email: string, password: string): Promise<AdminUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;
  if (!user?.email || !isAuthorizedEmail(user.email)) {
    await firebaseSignOut(auth);
    throw new Error("UNAUTHORIZED:" + (user?.email || "unknown"));
  }
  const adminUser = firebaseUserToAdminUser(user);
  saveAdminUser(adminUser);
  return adminUser;
}

export async function loginWithFirebasePopup(): Promise<AdminUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  if (!user?.email || !isAuthorizedEmail(user.email)) {
    await firebaseSignOut(auth);
    throw new Error("UNAUTHORIZED:" + (user?.email || "unknown"));
  }
  const adminUser = firebaseUserToAdminUser(user);
  saveAdminUser(adminUser);
  return adminUser;
}

export function loginWithFirebaseRedirect(): void {
  signInWithRedirect(auth, googleProvider);
}

export async function handleFirebaseRedirectResult(): Promise<AdminUser | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    const user = result.user;
    if (!user?.email || !isAuthorizedEmail(user.email)) {
      await firebaseSignOut(auth);
      throw new Error("UNAUTHORIZED:" + (user?.email || "unknown"));
    }
    const adminUser = firebaseUserToAdminUser(user);
    saveAdminUser(adminUser);
    return adminUser;
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function logoutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch {}
}

// ====== LEGACY (GIS Popup — web only) ======

export async function loginWithGoogle(): Promise<AdminUser> {
  let token = getAccessToken();

  if (!token) {
    token = await connectGoogleCalendar();
  }

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

  saveAdminUser(user);
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
    saveAdminUser(user);
    return user;
  } catch {
    return null;
  }
}

export function logout(): void {
  disconnectGoogleCalendar();
  logoutFirebase();
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}
