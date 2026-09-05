export type TagColor = 'teal' | 'clay' | 'sage';

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  note: string;
  done: boolean;
  procedure?: string;
}

export interface PhotoRecord {
  id: string;
  type: 'before' | 'after' | 'progress';
  label: string;
  url: string;
  date: string;
}

export interface FootMarker {
  id: string;
  foot: 'left' | 'right';
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  date: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  locationDetails: string;
  timeAgo: string;
  tagColor: TagColor;
  phone?: string;
  cpf?: string;
  status: 'active' | 'completed' | 'in-progress';
  timeline: TimelineItem[];
  photos: PhotoRecord[];
  notes?: string;
  // Fatores clínicos e anamnese podológica especializada
  isDiabetic?: boolean;
  hasCirculatoryIssues?: boolean;
  isHypertensive?: boolean;
  allergies?: string;
  painScale?: number; // 0 a 10
  footStrike?: 'pronada' | 'supinada' | 'neutra';
  shoeHabit?: string;
  footMarkers?: FootMarker[];
}

export interface Professional {
  id: string;
  name: string;
  title: string;
  crpo: string;
  avatar: string;
  color: string;
  email: string;
  phone: string;
  specialties: string[];
  bio: string;
  availableDays: string[];
  workingHours: string;
  active: boolean;
  rating?: number;
  reviewsCount?: number;
}

export interface Appointment {
  id: string;
  time: string;
  patientId: string;
  patientName: string;
  condition: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'canceled';
  type: string;
  date?: string;
  phone?: string;
  notes?: string;
  bookedOnline?: boolean;
  price?: string;
  duration?: string;
  // Vínculo do profissional (Multi-usuário)
  professionalId?: string;
  professionalName?: string;
  professionalAvatar?: string;
  // Bloqueio de agenda
  isBlock?: boolean;
  blockReason?: string;
  blockColor?: string;
}

export type TabType =
  | 'inicio'
  | 'agenda'
  | 'fichas'
  | 'financeiro'
  | 'servicos'
  | 'estoque'
  | 'ia'
  | 'configuracoes'
  | 'perfil';
