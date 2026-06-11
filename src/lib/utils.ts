import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EstadoCita } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${new Intl.NumberFormat('es-CO').format(amount)}`;
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: es });
}

export function formatTime(time: string): string {
  return time.substring(0, 5);
}

export function formatDateTime(date: string | undefined | null): string {
  if (!date) return '—';
  return format(parseISO(date), 'dd MMM yyyy HH:mm', { locale: es });
}

export function getEstadoColor(estado: EstadoCita): string {
  const map: Record<EstadoCita, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmada: 'bg-blue-100 text-blue-800 border-blue-200',
    en_proceso: 'bg-purple-100 text-purple-800 border-purple-200',
    completada: 'bg-green-100 text-green-800 border-green-200',
    cancelada: 'bg-red-100 text-red-800 border-red-200',
    no_asistio: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return map[estado] ?? 'bg-gray-100 text-gray-800';
}

export function getEstadoLabel(estado: EstadoCita): string {
  const map: Record<EstadoCita, string> = {
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    en_proceso: 'En Proceso',
    completada: 'Completada',
    cancelada: 'Cancelada',
    no_asistio: 'No Asistió',
  };
  return map[estado] ?? estado;
}

export function getDiaSemanaLabel(dia: number): string {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[dia] ?? '';
}

export function calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
  const [hours, minutes] = horaInicio.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duracionMinutos;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateTimeSlots(inicio: string, fin: string, intervalo = 30): string[] {
  const slots: string[] = [];
  const [startH, startM] = inicio.split(':').map(Number);
  const [endH, endM] = fin.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    current += intervalo;
  }
  return slots;
}
