'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Empleado, Horario } from '@/types';

const EmpleadoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  cargo: z.string().min(1, 'Cargo requerido'),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  activo: z.boolean().default(true),
});

export async function getEmpleados(): Promise<Empleado[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('empleados')
    .select(`*, servicios:empleado_servicios(servicio:servicios(*)), horarios(*)`)
    .order('nombre');
  if (error) throw error;
  return (data ?? []).map((e) => ({
    ...e,
    servicios: e.servicios?.map((es: { servicio: unknown }) => es.servicio) ?? [],
  }));
}

export async function getEmpleado(id: string): Promise<Empleado | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('empleados')
    .select(`*, servicios:empleado_servicios(servicio:servicios(*)), horarios(*)`)
    .eq('id', id)
    .single();
  if (error) return null;
  return {
    ...data,
    servicios: data.servicios?.map((es: { servicio: unknown }) => es.servicio) ?? [],
  };
}

export async function createEmpleado(prevState: unknown, formData: FormData) {
  const result = EmpleadoSchema.safeParse({
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    cargo: formData.get('cargo'),
    color_calendario: formData.get('color_calendario') || '#3B82F6',
    activo: formData.get('activo') !== 'false',
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('empleados').insert(result.data);

  if (error) {
    if (error.code === '23505') return { error: 'Email ya registrado' };
    return { error: 'Error al crear empleado' };
  }

  revalidatePath('/empleados');
  return { success: 'Empleado creado' };
}

export async function updateEmpleado(id: string, prevState: unknown, formData: FormData) {
  const result = EmpleadoSchema.safeParse({
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    cargo: formData.get('cargo'),
    color_calendario: formData.get('color_calendario') || '#3B82F6',
    activo: formData.get('activo') !== 'false',
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('empleados').update(result.data).eq('id', id);

  if (error) return { error: 'Error al actualizar empleado' };

  revalidatePath('/empleados');
  return { success: 'Empleado actualizado' };
}

export async function deleteEmpleado(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('empleados').delete().eq('id', id);
  if (error) return { error: 'Error al eliminar empleado' };
  revalidatePath('/empleados');
  return { success: true };
}

export async function updateServiciosEmpleado(empleadoId: string, servicioIds: string[]) {
  const supabase = await createClient();

  await supabase.from('empleado_servicios').delete().eq('empleado_id', empleadoId);

  if (servicioIds.length > 0) {
    const { error } = await supabase.from('empleado_servicios').insert(
      servicioIds.map((id) => ({ empleado_id: empleadoId, servicio_id: id }))
    );
    if (error) return { error: 'Error al asignar servicios' };
  }

  revalidatePath('/empleados');
  return { success: true };
}

export async function updateHorariosEmpleado(empleadoId: string, horarios: Omit<Horario, 'id' | 'created_at' | 'updated_at'>[]) {
  const supabase = await createClient();

  for (const horario of horarios) {
    await supabase
      .from('horarios')
      .upsert({ ...horario, empleado_id: empleadoId }, { onConflict: 'empleado_id,dia_semana' });
  }

  revalidatePath('/empleados');
  return { success: true };
}

export async function getDisponibilidadEmpleado(
  empleadoId: string,
  fecha: string,
  duracionMinutos: number
): Promise<string[]> {
  const supabase = await createClient();

  const fechaDate = new Date(fecha);
  const diaSemana = fechaDate.getDay();

  const { data: horario } = await supabase
    .from('horarios')
    .select('*')
    .eq('empleado_id', empleadoId)
    .eq('dia_semana', diaSemana)
    .eq('activo', true)
    .single();

  if (!horario) return [];

  const { data: citasExistentes } = await supabase
    .from('citas')
    .select('hora_inicio, hora_fin')
    .eq('empleado_id', empleadoId)
    .eq('fecha', fecha)
    .not('estado', 'in', '("cancelada","no_asistio")');

  const { data: bloqueos } = await supabase
    .from('bloqueos')
    .select('fecha_inicio, fecha_fin')
    .eq('empleado_id', empleadoId)
    .lte('fecha_inicio', `${fecha}T23:59:59`)
    .gte('fecha_fin', `${fecha}T00:00:00`);

  const [startH, startM] = horario.hora_inicio.split(':').map(Number);
  const [endH, endM] = horario.hora_fin.split(':').map(Number);
  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  const slots: string[] = [];

  while (current + duracionMinutos <= end) {
    const slotFin = current + duracionMinutos;
    const hStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
    const hEnd = `${String(Math.floor(slotFin / 60)).padStart(2, '0')}:${String(slotFin % 60).padStart(2, '0')}`;

    const ocupado = citasExistentes?.some((c) => {
      const [cs, cm] = c.hora_inicio.split(':').map(Number);
      const [ce, cem] = c.hora_fin.split(':').map(Number);
      const citaStart = cs * 60 + cm;
      const citaEnd = ce * 60 + cem;
      return current < citaEnd && slotFin > citaStart;
    });

    const bloqueado = bloqueos?.some((b) => {
      const bStart = new Date(b.fecha_inicio).getTime();
      const bEnd = new Date(b.fecha_fin).getTime();
      const slotStart = new Date(`${fecha}T${hStart}`).getTime();
      const slotEnd = new Date(`${fecha}T${hEnd}`).getTime();
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!ocupado && !bloqueado) {
      slots.push(hStart);
    }

    current += 30;
  }

  return slots;
}
