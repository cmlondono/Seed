/**
 * Pure slot availability calculator — no DB calls.
 * Extracted from src/actions/empleados.ts getDisponibilidadEmpleado.
 */

export interface HorarioData {
  hora_inicio: string; // 'HH:MM' or 'HH:MM:SS'
  hora_fin: string;
}

export interface CitaSlot {
  hora_inicio: string;
  hora_fin: string;
}

export interface BloqueoSlot {
  fecha_inicio: string; // ISO datetime
  fecha_fin: string;    // ISO datetime
}

function toMinutes(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calcularSlotsDisponibles(
  horario: HorarioData,
  duracionMinutos: number,
  citasExistentes: CitaSlot[],
  fecha: string,
  bloqueos: BloqueoSlot[],
  intervaloMinutos = 30,
): string[] {
  const start = toMinutes(horario.hora_inicio);
  const end = toMinutes(horario.hora_fin);
  const slots: string[] = [];

  let current = start;
  while (current + duracionMinutos <= end) {
    const slotFin = current + duracionMinutos;
    const hStart = toTimeString(current);
    const hEnd = toTimeString(slotFin);

    const ocupado = citasExistentes.some((c) => {
      const cs = toMinutes(c.hora_inicio);
      const ce = toMinutes(c.hora_fin);
      return current < ce && slotFin > cs;
    });

    const bloqueado = bloqueos.some((b) => {
      const bStart = new Date(b.fecha_inicio).getTime();
      const bEnd = new Date(b.fecha_fin).getTime();
      const slotStart = new Date(`${fecha}T${hStart}`).getTime();
      const slotEnd = new Date(`${fecha}T${hEnd}`).getTime();
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!ocupado && !bloqueado) slots.push(hStart);
    current += intervaloMinutos;
  }

  return slots;
}

/** Check if two time intervals overlap. */
export function hayConflicto(
  horaInicioA: string,
  horaFinA: string,
  horaInicioB: string,
  horaFinB: string,
): boolean {
  const aStart = toMinutes(horaInicioA);
  const aEnd = toMinutes(horaFinA);
  const bStart = toMinutes(horaInicioB);
  const bEnd = toMinutes(horaFinB);
  return aStart < bEnd && aEnd > bStart;
}
