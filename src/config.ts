import { getDefaultClinicConfig, getCachedClinicConfig } from "./services/clinicConfigService";

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
  subscription?: {
    plan: "free" | "basic" | "pro" | "enterprise";
    status: "active" | "canceled" | "past_due";
  };
  settings?: {
    allowOnlineBooking: boolean;
    requireConfirmation: boolean;
    bookingWindowDays: number;
    timezone: string;
    expedienteStart?: string;
    expedienteEnd?: string;
  };
}

let currentConfig: ClinicConfig | null = null;

export function setClinicConfig(config: ClinicConfig | null): void {
  currentConfig = config;
}

export function getClinicConfig(): ClinicConfig {
  if (currentConfig) return currentConfig;
  
  const cached = getCachedClinicConfig();
  if (cached) {
    currentConfig = cached;
    return currentConfig;
  }
  
  return getDefaultClinicConfig();
}

export const clinicConfig: ClinicConfig = getClinicConfig();

export function resetClinicConfig(): void {
  currentConfig = null;
}