import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";
import { createClinic, getUserProfile, getClinic, updateClinic } from "./multiTenantFirestore";

const AUTH_STORAGE_KEY = "cuidarx_admin_auth";

export interface AdminUser {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
  clinicId: string;
  role: "owner" | "admin" | "professional" | "receptionist";
  clinicName: string;
  clinicSlug: string;
  loginAt: string;
}

function firebaseUserToAdminUser(firebaseUser: FirebaseUser, profile: any): AdminUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    name: firebaseUser.displayName || profile?.displayName || undefined,
    picture: firebaseUser.photoURL || profile?.photoURL || undefined,
    clinicId: profile?.clinicId || "",
    role: profile?.role || "owner",
    clinicName: profile?.clinicName || "",
    clinicSlug: profile?.clinicSlug || "",
    loginAt: new Date().toISOString(),
  };
}

function saveAdminUser(user: AdminUser): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function getCurrentAdminUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const user: AdminUser = JSON.parse(raw);
    if (!user || !user.email) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function clearAdminUser(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
}

export async function signupWithEmail(
  email: string,
  password: string,
  clinicData: {
    clinicName: string;
    doctorName: string;
    doctorSpecialty: string;
    slug: string;
  }
): Promise<AdminUser> {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase não configurado");

  const result = await createUserWithEmailAndPassword(auth, email, password);
  const user = result.user;

  await updateProfile(user, {
    displayName: clinicData.doctorName,
  });

  const clinicId = await createClinic({
    name: clinicData.clinicName,
    slug: clinicData.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    ownerId: user.uid,
    doctorName: clinicData.doctorName,
    doctorSpecialty: clinicData.doctorSpecialty,
    logoPath: "/logo.png",
    primaryColor: "#0B4C33",
    accentColor: "#CBAA6C",
    whatsappDefaultMessage: "",
    clinicUrl: "",
    subscription: {
      plan: "free",
      status: "active",
    },
    settings: {
      allowOnlineBooking: true,
      requireConfirmation: true,
      bookingWindowDays: 30,
      timezone: "America/Sao_Paulo",
    },
  });

  const profile = await getUserProfile(user.uid);
  const clinic = await getClinic(clinicId);
  
  const adminUser = firebaseUserToAdminUser(user, {
    ...profile,
    clinicName: clinic?.name,
    clinicSlug: clinic?.slug,
  });
  
  saveAdminUser(adminUser);
  return adminUser;
}

export async function loginWithEmailPassword(email: string, password: string): Promise<AdminUser> {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase não configurado");

  const result = await signInWithEmailAndPassword(auth, email, password);
  const user = result.user;

  const profile = await getUserProfile(user.uid);
  if (!profile?.clinicId) {
    await firebaseSignOut(auth);
    throw new Error("Usuário não vinculado a nenhuma clínica");
  }

  const clinic = await getClinic(profile.clinicId);
  if (!clinic) {
    await firebaseSignOut(auth);
    throw new Error("Clínica não encontrada");
  }

  await updateClinic(profile.clinicId, {
    subscription: clinic.subscription,
  } as any);

  const adminUser = firebaseUserToAdminUser(user, {
    ...profile,
    clinicName: clinic.name,
    clinicSlug: clinic.slug,
  });
  
  saveAdminUser(adminUser);
  return adminUser;
}

export async function loginWithGoogle(): Promise<AdminUser> {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase não configurado");

  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/calendar");
  provider.addScope("https://www.googleapis.com/auth/calendar.events");
  provider.addScope("https://www.googleapis.com/auth/calendar.readonly");

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  let profile = await getUserProfile(user.uid);
  
  if (!profile) {
    const clinicData = {
      clinicName: user.displayName || "Minha Clínica",
      doctorName: user.displayName || "Profissional",
      doctorSpecialty: "Saúde",
      slug: user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-") || `clinic-${Date.now()}`,
    };
    
    const clinicId = await createClinic({
      name: clinicData.clinicName,
      slug: clinicData.slug,
      ownerId: user.uid,
      doctorName: clinicData.doctorName,
      doctorSpecialty: clinicData.doctorSpecialty,
      logoPath: "/logo.png",
      primaryColor: "#0B4C33",
      accentColor: "#CBAA6C",
      whatsappDefaultMessage: "",
      clinicUrl: "",
      subscription: {
        plan: "free",
        status: "active",
      },
      settings: {
        allowOnlineBooking: true,
        requireConfirmation: true,
        bookingWindowDays: 30,
        timezone: "America/Sao_Paulo",
      },
    });

    profile = await getUserProfile(user.uid);
    const clinic = await getClinic(clinicId);
    
    const adminUser = firebaseUserToAdminUser(user, {
      ...profile,
      clinicName: clinic?.name,
      clinicSlug: clinic?.slug,
    });
    
    saveAdminUser(adminUser);
    return adminUser;
  }

  if (!profile.clinicId) {
    await firebaseSignOut(auth);
    throw new Error("Usuário não vinculado a nenhuma clínica");
  }

  const clinic = await getClinic(profile.clinicId);
  if (!clinic) {
    await firebaseSignOut(auth);
    throw new Error("Clínica não encontrada");
  }

  const adminUser = firebaseUserToAdminUser(user, {
    ...profile,
    clinicName: clinic.name,
    clinicSlug: clinic.slug,
  });
  
  saveAdminUser(adminUser);
  return adminUser;
}

export async function loginWithGoogleRedirect(): Promise<void> {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase não configurado");
  
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/calendar");
  provider.addScope("https://www.googleapis.com/auth/calendar.events");
  provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
  
  await signInWithRedirect(auth, provider);
}

export async function handleAuthRedirect(): Promise<AdminUser | null> {
  if (!isFirebaseConfigured || !auth) return null;
  
  try {
    const result = await getRedirectResult(auth);
    if (!result?.user) return null;
    
    const user = result.user;
    const profile = await getUserProfile(user.uid);
    
    if (!profile?.clinicId) {
      await firebaseSignOut(auth);
      throw new Error("Usuário não vinculado a nenhuma clínica");
    }

    const clinic = await getClinic(profile.clinicId);
    if (!clinic) {
      await firebaseSignOut(auth);
      throw new Error("Clínica não encontrada");
    }

    const adminUser = firebaseUserToAdminUser(user, {
      ...profile,
      clinicName: clinic.name,
      clinicSlug: clinic.slug,
    });
    
    saveAdminUser(adminUser);
    return adminUser;
  } catch (error) {
    console.error("Erro no redirect auth:", error);
    return null;
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (!isFirebaseConfigured || !auth) throw new Error("Firebase não configurado");
  await sendPasswordResetEmail(auth, email);
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function logout(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    try {
      await firebaseSignOut(auth);
    } catch {}
  }
  clearAdminUser();
}

export async function getCurrentClinicData(): Promise<{
  clinicId: string;
  clinicName: string;
  clinicSlug: string;
  role: string;
} | null> {
  const user = getCurrentAdminUser();
  if (!user) return null;
  
  return {
    clinicId: user.clinicId,
    clinicName: user.clinicName,
    clinicSlug: user.clinicSlug,
    role: user.role,
  };
}