export interface Patient {
  id: string;
  name: string;
  phone: string;
  phoneNormalized?: string; // digits only, for querying by phone
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
  packageService?: string;
  packageQuantity?: number; // Total de sessões do pacote contratado
  packageSessionsUsed?: number; // Sessões já utilizadas
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
  serviceType?: "podologia" | "enfermagem";
  checklist?: string[]; // Podoprofilaxia Completa, Onicocriptose, Curativo/Retorno, Órtese Laminar, Calosidade, Verruga Plantar, Outros
  value?: number;
  paymentMethod?: string; // Pix, Dinheiro, Débito, Crédito
  procedureDescription?: string;
  homecareRecommendations?: string;
  photosBefore?: string[];
  photosAfter?: string[];
  nextAppointmentScheduled?: boolean;
  nextAppointmentDate?: string;
  nextAppointmentTime?: string;
  professionalSignature?: string;
  clientSignature?: string;
  signedAt?: string;
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
  quantity?: number; // Nº de sessões / pacote contratado
  calendarEventId?: string; // Google Calendar event ID for sync
  source?: "manual" | "google" | "portal"; // Origin: manual (app), google (imported), or portal (public booking)
  colorId?: string; // Google Calendar color ID for category classification
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
  date: string;       // YYYY-MM-DD (vazio para bloqueios recorrentes)
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  reason: string;     // "Almoço", "Férias", "Reunião", etc.
  createdAt: string;  // ISO string
  calendarEventId?: string; // Google Calendar event ID for sync
  source?: "manual" | "google"; // Origin: manual (app) or google (imported from Google Calendar)
  colorId?: string; // Google Calendar color ID for category classification
  recurrence?: {
    frequency: "none" | "diaria" | "semanal" | "dias_uteis" | "personalizada";
    daysOfWeek: number[]; // 0=Dom, 1=Seg, ..., 6=Sáb
  };
}

// ── Inventory Types ──

export type ProductCategory = "material" | "quimico" | "descartavel" | "medicamento" | "equipamento" | "revenda";
export type ProductUsage = "interno" | "revenda";

export interface InventoryProduct {
  id: string;
  name: string;
  category: ProductCategory;
  usage: ProductUsage;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unitCost?: number;
  salePrice?: number;
  supplier?: string;
  barcode?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductLot {
  id: string;
  productId: string;
  lotNumber: string;
  expiryDate: string;
  costPrice: number;
  supplier: string;
  quantity: number;
  remainingQuantity: number;
  receivedAt?: string;
  invoiceNumber?: string;
}

export interface SurgicalInstrument {
  id: string;
  name: string;
  serialNumber?: string;
  sterilizationDate: string;
  surgicalGrade: string;
  gradeExpiryDate: string;
  autoclaveId?: string;
  cycleNumber?: number;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TechnicalDiscard {
  id: string;
  productName: string;
  productId: string;
  quantity: number;
  reason: string;
  discardedAt: string;
}

export interface ProcedureKit {
  id: string;
  name: string;
  description?: string;
  items: { productId: string; productName: string; quantityNeeded: number }[];
  createdAt: string;
  updatedAt: string;
}

