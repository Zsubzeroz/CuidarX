import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getAccessToken,
  persistGoogleToken,
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
  GoogleAuthProvider,
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

// ====== FIREBASE AUTH + GOOGLE CALENDAR (Web) ======

export async function loginWithGoogle(): Promise<AdminUser> {
  // Create a GoogleAuthProvider with Calendar API scopes
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/calendar");
  provider.addScope("https://www.googleapis.com/auth/calendar.events");
  provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

  // Sign in via Firebase Auth popup — this both:
  // 1. Authenticates with Firebase Auth (request.auth != null for Firestore rules)
  // 2. Gets a Google OAuth access token for Calendar API
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (!user?.email || !isAuthorizedEmail(user.email)) {
    await firebaseSignOut(auth);
    throw new Error("UNAUTHORIZED:" + (user?.email || "unknown"));
  }

  // Extract Google OAuth access token for Calendar API
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (credential?.accessToken) {
    persistGoogleToken(credential.accessToken);
  }

  const adminUser = firebaseUserToAdminUser(user);
  saveAdminUser(adminUser);
  return adminUser;
}

export async function trySilentLogin(): Promise<AdminUser | null> {
  const persisted = getCurrentUser();
  if (persisted) {
    // If we have a persisted admin user, also check Firebase Auth state
    // Firebase Auth session persists across page reloads
    const firebaseUser = auth?.currentUser;
    if (!firebaseUser && isAuthorizedEmail(persisted.email)) {
      // Firebase Auth session expired or was cleared — try to restore silently
      // This is a no-op if the user needs to re-authenticate
    }
    return persisted;
  }

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
