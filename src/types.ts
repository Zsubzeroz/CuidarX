export interface Patient {
  id: string;
  name: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  gender: string;
  cpf?: string;
  email?: string;
  cep?: string;
  address?: string;
  responsableName?: string;
  responsableDob?: string;
  responsableCpf?: string;
  responsablePhone?: string;
  isDiabetic: boolean;
  hasCirculatoryIssues: boolean;
  isSmoker: boolean;
  hasAllergies: string; // description or "Não"
  footStrikeType?: string; // Neutra, Pronada, Supinada
  observations: string;
  profession?: string;
  hypertension?: boolean;
  cardiopathy?: boolean;
  oncological?: boolean;
  pregnant?: boolean;
  anticoagulant?: boolean;
  physicalActivity?: boolean;
  mainComplaint?: string;
  tactileSensitivity?: string;
  footwearType?: string;
  jointPain?: boolean;
  signature?: string;
  contractAccepted?: boolean;
  contractConsentType?: string;
  imageUseAuthorized?: string;
  contractObservations?: string;
  signedAt?: string;
  footIssues: FootIssue[];
  evolutions: Evolution[];
  avaliacaoDate?: string;
  nailCutting?: string;
  createdAt: string;
}

export interface FootIssue {
  id: string;
  foot: "left" | "right";
  x: number; // percentage coordinate on SVG
  y: number; // percentage coordinate on SVG
  condition: string; // e.g., Onicocriptose, Calo, Fissura, Verruga
  notes: string;
  status: "active" | "resolved";
  createdAt: string;
}

export interface Evolution {
  id: string;
  date: string;
  procedure: string; // e.g., Podopatia, Órtese, Debridamento
  notes: string;
  recommendations: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  service: string;
  price: number;
  status: "scheduled" | "confirmed" | "completed" | "canceled";
  notes?: string;
  calendarEventId?: string; // Google Calendar event ID for sync
  source?: "manual" | "google"; // Origin: manual (app) or google (imported from Google Calendar)
}

export interface FinanceRecord {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
}

export interface ClinicService {
  id: string;
  name: string;
  price: number;
  duration?: number; // duration in minutes (e.g. 30, 60)
  description?: string;
  isActive: boolean;
}

export interface ScheduleBlock {
  id: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  reason: string;     // "Almoço", "Férias", "Reunião", etc.
  createdAt: string;  // ISO string
}

