
export type ViewMode = 'summary' | 'detailed' | 'admin' | 'edit' | 'checklist';

export type SessionStatus = 'Publicado' | 'Borrador' | 'Programado' | 'Archivado';

export interface Speaker {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
}

export interface Session {
  id: string;
  timeStart: string;
  timeEnd: string;
  title: string;
  category: string;
  categoryColor: string;
  speakers: Speaker[];
  location?: string;
  description?: string;
  status: SessionStatus;
  date?: string;
  tags?: string[];
}

export interface DaySchedule {
  dayNumber: number;
  date: string;
  label: string;
  sessions: Session[];
}
