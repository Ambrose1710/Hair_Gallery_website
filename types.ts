
export enum AppointmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  subName?: string; // Details like "back-length" or "small parts"
  price: number;
  duration: string;
  description: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: number;
}

export interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

export interface DailyAvailability {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}
