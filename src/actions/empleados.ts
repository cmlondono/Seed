'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, getNegocioId } from '@/lib/auth';
import { z } from 'zod';
import type { Empleado, Horario } from '@/types';

const EmpleadoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  cargo: z.string().min(1, 'Cargo requerido'),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido'),
  activo: z.boolean(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export async function getEmpleados(): Promise<Empleado[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('empleados')
    .select(`*, servicios:empleado_servicios(servicio:servicios(*)), horarios(*)`)
    .eq('activo', true)
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

type EmpleadoInput = {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  cargo: string;
  color_calendario: string;
  activo: boolean;
  password?: string;
};

export async function createEmpleado(input: EmpleadoInput) {
  const result = EmpleadoSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  await requireAdmin();
  const negocioId = await getNegocioId();
  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: result.data.email,
    password: result.data.password,
    email_confirm: true,
  });
  if (authError) return { error: authError.message };

  await admin.from('profiles').upsert({
    id: authData.user.id,
    email: result.data.email,
    nombre: result.data.nombre,
    apellido: result.data.apellido,
    role: 'empleado',
    activo: true,
    negocio_id: negocioId,
  });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('empleados')
    .insert({
      nombre: result.data.nombre,
      apellido: result.data.apellido,
      email: result.data.email,
      telefono: result.data.telefono,
      cargo: result.data.cargo,
      color_calendario: result.data.color_calendario,
      activo: result.data.activo,
      negocio_id: negocioId,
      profile_id: authData.user.id,
    })
    .select()
    .single();

  if (error) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: 'Error al crear empleado' };
  }

  revalidatePath('/empleados');
  return { item: data as Empleado };
}

export async function updateEmpleado(id: string, input: EmpleadoInput) {
  const result = EmpleadoSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('empleados')
    .update(result.data)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/empleados');
  return { item: data as Empleado };
}

export async function deleteEmpleado(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  // Soft delete — preserves FK integrity with citas y ventas históricas
  const { error } = await supabase.from('empleados').update({ activo: false }).eq('id', id);
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
  const negocioId = await getNegocioId();

  for (const horario of horarios) {
    await supabase
      .from('horarios')
      .upsert({ ...horario, empleado_id: empleadoId, negocio_id: negocioId }, { onConflict: 'empleado_id,dia_semana' });
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

  const diaSemana = new Date(fecha).getDay();

  // Horario must be fetched first — if none, no slots available
  const { data: horario } = await supabase
    .from('horarios')
    .select('*')
    .eq('empleado_id', empleadoId)
    .eq('dia_semana', diaSemana)
    .eq('activo', true)
    .single();

  if (!horario) return [];

  // Fetch citas and bloqueos in parallel
  const [{ data: citasExistentes }, { data: bloqueos }] = await Promise.all([
    supabase
      .from('citas')
      .select('hora_inicio, hora_fin')
      .eq('empleado_id', empleadoId)
      .eq('fecha', fecha)
      .not('estado', 'in', '("cancelada","no_asistio")'),
    supabase
      .from('bloqueos')
      .select('fecha_inicio, fecha_fin')
      .eq('empleado_id', empleadoId)
      .lte('fecha_inicio', `${fecha}T23:59:59`)
      .gte('fecha_fin', `${fecha}T00:00:00`),
  ]);

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
      return current < (ce * 60 + cem) && slotFin > (cs * 60 + cm);
    });

    const bloqueado = bloqueos?.some((b) => {
      const bStart = new Date(b.fecha_inicio).getTime();
      const bEnd = new Date(b.fecha_fin).getTime();
      const slotStart = new Date(`${fecha}T${hStart}`).getTime();
      const slotEnd = new Date(`${fecha}T${hEnd}`).getTime();
      return slotStart < bEnd && slotEnd > bStart;
    });

    if (!ocupado && !bloqueado) slots.push(hStart);
    current += 30;
  }

  return slots;
}
