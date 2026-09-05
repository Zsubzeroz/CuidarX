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
}

export interface Appointment {
  id: string;
  time: string;
  patientId: string;
  patientName: string;
  condition: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'canceled';
  type: string;
}

export type TabType = 'inicio' | 'agenda' | 'fichas' | 'perfil';
