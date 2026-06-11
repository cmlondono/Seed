import { addMonths, format, parseISO } from 'date-fns';

export interface CuotaData {
  numero_cuota: number;
  monto: number;
  fecha_vencimiento: string; // 'YYYY-MM-DD'
  estado: 'pendiente';
  email_enviado: false;
}

/**
 * Pure installment generator — no DB calls.
 * Extracted from src/actions/creditos.ts createCredito.
 */
export function generarCuotas(
  totalCredito: number,
  numeroCuotas: number,
  fechaPrimeraCuota: string,
): CuotaData[] {
  const montoCuota = parseFloat((totalCredito / numeroCuotas).toFixed(2));
  const diferencia = parseFloat((totalCredito - montoCuota * numeroCuotas).toFixed(2));

  return Array.from({ length: numeroCuotas }, (_, i) => ({
    numero_cuota: i + 1,
    monto: i === numeroCuotas - 1 ? montoCuota + diferencia : montoCuota,
    fecha_vencimiento: format(addMonths(parseISO(fechaPrimeraCuota), i), 'yyyy-MM-dd'),
    estado: 'pendiente' as const,
    email_enviado: false as const,
  }));
}

/**
 * Calculate new balance after paying a cuota.
 */
export function calcularNuevoSaldo(saldoActual: number, montoCuota: number): number {
  return parseFloat(Math.max(0, saldoActual - montoCuota).toFixed(2));
}
