'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Cita, CalendarEvent, EstadoCita } from '@/types';
import { calcularHoraFin } from '@/lib/utils';

const CitaSchema = z.object({
  cliente_id: z.string().uuid('Cliente requerido'),
  empleado_id: z.string().uuid('Empleado requerido'),
  servicio_id: z.string().uuid('Servicio requerido'),
  fecha: z.string().min(1, 'Fecha requerida'),
  hora_inicio: z.string().min(1, 'Hora requerida'),
  notas: z.string().optional(),
});

export async function getCitas(filters?: {
  fecha?: string;
  empleado_id?: string;
  estado?: EstadoCita;
  desde?: string;
  hasta?: string;
}): Promise<Cita[]> {
  const supabase = await createClient();
  let query = supabase
    .from('citas')
    .select(`*, cliente:clientes(*), empleado:empleados(*), servicio:servicios(*)`)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (filters?.fecha) query = query.eq('fecha', filters.fecha);
  if (filters?.empleado_id) query = query.eq('empleado_id', filters.empleado_id);
  if (filters?.estado) query = query.eq('estado', filters.estado);
  if (filters?.desde) query = query.gte('fecha', filters.desde);
  if (filters?.hasta) query = query.lte('fecha', filters.hasta);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCita(id: string): Promise<Cita | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('citas')
    .select(`*, cliente:clientes(*), empleado:empleados(*), servicio:servicios(*)`)
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function getCitasCalendar(desde: string, hasta: string): Promise<CalendarEvent[]> {
  const citas = await getCitas({ desde, hasta });

  return citas.map((cita) => ({
    id: cita.id,
    title: `${cita.cliente?.nombre ?? 'Cliente'} - ${cita.servicio?.nombre ?? 'Servicio'}`,
    start: `${cita.fecha}T${cita.hora_inicio}`,
    end: `${cita.fecha}T${cita.hora_fin}`,
    backgroundColor: cita.empleado?.color_calendario ?? '#3B82F6',
    borderColor: cita.empleado?.color_calendario ?? '#3B82F6',
    extendedProps: { cita },
  }));
}

export async function createCita(data: {
  cliente_id: string;
  empleado_id: string;
  servicio_id: string;
  fecha: string;
  hora_inicio: string;
  notas?: string;
}) {
  const result = CitaSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();

  // Get service duration
  const { data: servicio } = await supabase
    .from('servicios')
    .select('duracion_minutos, precio')
    .eq('id', data.servicio_id)
    .single();

  if (!servicio) return { error: 'Servicio no encontrado' };

  const hora_fin = calcularHoraFin(data.hora_inicio, servicio.duracion_minutos);

  // Check for conflicts: existing.hora_inicio < new.hora_fin AND existing.hora_fin > new.hora_inicio
  const { data: conflicts } = await supabase
    .from('citas')
    .select('id')
    .eq('empleado_id', data.empleado_id)
    .eq('fecha', data.fecha)
    .not('estado', 'in', '("cancelada","no_asistio")')
    .lt('hora_inicio', hora_fin)
    .gt('hora_fin', data.hora_inicio);

  if (conflicts && conflicts.length > 0) {
    return { error: 'El empleado ya tiene una cita en ese horario' };
  }

  const { data: user } = await supabase.auth.getUser();

  const { data: newCita, error } = await supabase
    .from('citas')
    .insert({
      ...result.data,
      hora_fin,
      precio: servicio.precio,
      estado: 'pendiente',
      created_by: user.user?.id,
    })
    .select(`*, cliente:clientes(*), empleado:empleados(*), servicio:servicios(*)`)
    .single();

  if (error) return { error: 'Error al crear cita' };

  revalidatePath('/citas');
  return { success: 'Cita creada', data: newCita };
}

export async function updateEstadoCita(id: string, estado: EstadoCita) {
  const supabase = await createClient();
  const { error } = await supabase.from('citas').update({ estado }).eq('id', id);
  if (error) return { error: 'Error al actualizar estado' };
  revalidatePath('/citas');
  return { success: true };
}

export async function updateCita(id: string, data: Partial<Cita>) {
  const supabase = await createClient();
  const { error } = await supabase.from('citas').update(data).eq('id', id);
  if (error) return { error: 'Error al actualizar cita' };
  revalidatePath('/citas');
  return { success: true };
}

export async function deleteCita(id: string) {
  const supabase = await createClient();
  // Soft delete — preserves audit trail
  const { error } = await supabase.from('citas').update({ estado: 'cancelada' }).eq('id', id);
  if (error) return { error: 'Error al eliminar cita' };
  revalidatePath('/citas');
  return { success: true };
}
