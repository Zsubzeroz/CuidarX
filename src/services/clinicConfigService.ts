import { getClinic, getClinicBySlug, updateClinic } from "./multiTenantFirestore";
import type { Clinic } from "./multiTenantFirestore";

export interface ClinicConfig {
  clinicName: string;
  doctorName: string;
  doctorSpecialty: string;
  adminEmail: string;
  clinicUrl: string;
  appId: string;
  logoPath: string;
  primaryColor: string;
  accentColor: string;
  whatsappDefaultMessage: string;
  clinicId: string;
  clinicSlug: string;
  createdAt?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  acceptsInsurance?: boolean;
  subscription?: Clinic["subscription"];
  settings?: Clinic["settings"];
}

let cachedConfig: ClinicConfig | null = null;
let configPromise: Promise<ClinicConfig | null> | null = null;

export function getCachedClinicConfig(): ClinicConfig | null {
  return cachedConfig;
}

export async function loadClinicConfig(clinicId: string): Promise<ClinicConfig | null> {
  if (configPromise) return configPromise;
  
  configPromise = (async () => {
    try {
      const clinic = await getClinic(clinicId);
      if (!clinic) return null;
      
      cachedConfig = {
        clinicName: clinic.name,
        doctorName: clinic.doctorName,
        doctorSpecialty: clinic.doctorSpecialty,
        adminEmail: clinic.ownerEmail || "",
        clinicUrl: clinic.clinicUrl || "",
        appId: clinic.appId || "com.cuidarx.app",
        logoPath: clinic.logoPath,
        primaryColor: clinic.primaryColor,
        accentColor: clinic.accentColor,
        whatsappDefaultMessage: clinic.whatsappDefaultMessage || "",
        clinicId: clinic.id,
        clinicSlug: clinic.slug,
        subscription: clinic.subscription,
        settings: clinic.settings,
      };
      
      return cachedConfig;
    } catch (error) {
      console.error("Erro ao carregar config da clínica:", error);
      return null;
    } finally {
      configPromise = null;
    }
  })();
  
  return configPromise;
}

export async function loadClinicConfigBySlug(slug: string): Promise<ClinicConfig | null> {
  try {
    const clinic = await getClinicBySlug(slug);
    if (!clinic) return null;
    
    return {
      clinicName: clinic.name,
      doctorName: clinic.doctorName,
      doctorSpecialty: clinic.doctorSpecialty,
      adminEmail: clinic.ownerEmail || "",
      clinicUrl: clinic.clinicUrl || "",
      appId: clinic.appId || "com.cuidarx.app",
      logoPath: clinic.logoPath,
      primaryColor: clinic.primaryColor,
      accentColor: clinic.accentColor,
      whatsappDefaultMessage: clinic.whatsappDefaultMessage || "",
      clinicId: clinic.id,
      clinicSlug: clinic.slug,
      subscription: clinic.subscription,
      settings: clinic.settings,
    };
  } catch (error) {
    console.error("Erro ao carregar config da clínica por slug:", error);
    return null;
  }
}

export async function saveClinicConfig(clinicId: string, config: Partial<ClinicConfig>): Promise<void> {
  const updateData: any = {};
  
  if (config.clinicName !== undefined) updateData.name = config.clinicName;
  if (config.doctorName !== undefined) updateData.doctorName = config.doctorName;
  if (config.doctorSpecialty !== undefined) updateData.doctorSpecialty = config.doctorSpecialty;
  if (config.logoPath !== undefined) updateData.logoPath = config.logoPath;
  if (config.primaryColor !== undefined) updateData.primaryColor = config.primaryColor;
  if (config.accentColor !== undefined) updateData.accentColor = config.accentColor;
  if (config.whatsappDefaultMessage !== undefined) updateData.whatsappDefaultMessage = config.whatsappDefaultMessage;
  if (config.clinicUrl !== undefined) updateData.clinicUrl = config.clinicUrl;
  if (config.settings !== undefined) updateData.settings = config.settings;
  
  await updateClinic(clinicId, updateData);
  
  cachedConfig = null;
}

export function clearClinicConfigCache(): void {
  cachedConfig = null;
  configPromise = null;
}

export function getDefaultClinicConfig(): ClinicConfig {
  return {
    clinicName: "Sua Clínica",
    doctorName: "Dr. Profissional",
    doctorSpecialty: "Saúde",
    adminEmail: "",
    clinicUrl: "",
    appId: "com.cuidarx.app",
    logoPath: "/logo.png",
    primaryColor: "#0B4C33",
    accentColor: "#CBAA6C",
    whatsappDefaultMessage: "",
    clinicId: "",
    clinicSlug: "",
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
  };
}