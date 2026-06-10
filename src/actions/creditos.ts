'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Credito, CuotaCredito } from '@/types';
import { addMonths, format } from 'date-fns';

export async function getCreditos(): Promise<Credito[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('creditos')
    .select(`*, cliente:clientes(id,nombre,apellido,telefono,email), empleado:empleados(id,nombre,apellido), venta:ventas(id,numero_factura,total), cuotas:cuotas_credito(*)`)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as Credito[];
}

export async function getCredito(id: string): Promise<Credito | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('creditos')
    .select(`*, cliente:clientes(id,nombre,apellido,telefono,email), empleado:empleados(id,nombre,apellido), venta:ventas(id,numero_factura,total), cuotas:cuotas_credito(*)`)
    .eq('id', id)
    .single();
  return (data as Credito) ?? null;
}

export interface CreateCreditoInput {
  venta_id: string;
  cliente_id?: string;
  empleado_id: string;
  total_credito: number;
  numero_cuotas: number;
  fecha_primera_cuota: string;
  notas?: string;
}

export async function createCredito(input: CreateCreditoInput): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();

  const montoCuota = parseFloat((input.total_credito / input.numero_cuotas).toFixed(2));
  const diferencia = parseFloat((input.total_credito - montoCuota * input.numero_cuotas).toFixed(2));

  const { data, error } = await supabase
    .from('creditos')
    .insert({
      venta_id: input.venta_id,
      cliente_id: input.cliente_id || null,
      empleado_id: input.empleado_id,
      total_credito: input.total_credito,
      saldo_pendiente: input.total_credito,
      numero_cuotas: input.numero_cuotas,
      notas: input.notas || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  const cuotas = Array.from({ length: input.numero_cuotas }, (_, i) => ({
    credito_id: data.id,
    numero_cuota: i + 1,
    monto: i === input.numero_cuotas - 1 ? montoCuota + diferencia : montoCuota,
    fecha_vencimiento: format(addMonths(new Date(input.fecha_primera_cuota), i), 'yyyy-MM-dd'),
    estado: 'pendiente' as const,
  }));

  const { error: cuotasError } = await supabase.from('cuotas_credito').insert(cuotas);
  if (cuotasError) return { error: cuotasError.message };

  revalidatePath('/creditos');
  return { id: data.id };
}

export async function pagarCuota(
  cuotaId: string,
  comprobante?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: cuota, error: fetchError } = await supabase
    .from('cuotas_credito')
    .select('*, credito:creditos(*)')
    .eq('id', cuotaId)
    .single();

  if (fetchError || !cuota) return { error: 'Cuota no encontrada' };
  if (cuota.estado === 'pagado') return { error: 'Cuota ya pagada' };

  const { error: updateError } = await supabase
    .from('cuotas_credito')
    .update({ estado: 'pagado', fecha_pago: format(new Date(), 'yyyy-MM-dd'), comprobante: comprobante || null })
    .eq('id', cuotaId);

  if (updateError) return { error: updateError.message };

  const nuevoSaldo = parseFloat(((cuota.credito as { saldo_pendiente: number }).saldo_pendiente - cuota.monto).toFixed(2));
  const nuevoEstado = nuevoSaldo <= 0 ? 'pagado' : 'activo';

  await supabase
    .from('creditos')
    .update({ saldo_pendiente: Math.max(0, nuevoSaldo), estado: nuevoEstado })
    .eq('id', cuota.credito_id);

  revalidatePath('/creditos');
  return {};
}

export async function cancelarCredito(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('creditos').update({ estado: 'cancelado' }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/creditos');
  return {};
}

export async function getCuotasVencidas(): Promise<CuotaCredito[]> {
  const supabase = await createClient();
  const hoy = format(new Date(), 'yyyy-MM-dd');
  const { data } = await supabase
    .from('cuotas_credito')
    .select(`*, credito:creditos(*, cliente:clientes(nombre,apellido,email))`)
    .lt('fecha_vencimiento', hoy)
    .eq('estado', 'pendiente');
  return (data ?? []) as CuotaCredito[];
}

export async function getCuotasVencenHoy(): Promise<CuotaCredito[]> {
  const supabase = await createClient();
  const hoy = format(new Date(), 'yyyy-MM-dd');
  const { data } = await supabase
    .from('cuotas_credito')
    .select(`*, credito:creditos(*, cliente:clientes(nombre,apellido,email))`)
    .eq('fecha_vencimiento', hoy)
    .eq('estado', 'pendiente')
    .eq('email_enviado', false);
  return (data ?? []) as CuotaCredito[];
}

export async function marcarEmailEnviado(cuotaId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from('cuotas_credito').update({ email_enviado: true }).eq('id', cuotaId);
}
