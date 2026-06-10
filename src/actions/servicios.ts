'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Servicio } from '@/types';

const ServicioSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  descripcion: z.string().optional(),
  duracion_minutos: z.coerce.number().int().min(5).max(480),
  precio: z.coerce.number().min(0),
  activo: z.boolean().default(true),
});

export async function getServicios(): Promise<Servicio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .order('nombre');
  if (error) throw error;
  return data ?? [];
}

export async function getServicio(id: string): Promise<Servicio | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createServicio(prevState: unknown, formData: FormData) {
  const result = ServicioSchema.safeParse({
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion'),
    duracion_minutos: formData.get('duracion_minutos'),
    precio: formData.get('precio'),
    activo: formData.get('activo') === 'true',
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('servicios').insert(result.data);

  if (error) return { error: 'Error al crear servicio' };

  revalidatePath('/servicios');
  return { success: 'Servicio creado' };
}

export async function updateServicio(id: string, prevState: unknown, formData: FormData) {
  const result = ServicioSchema.safeParse({
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion'),
    duracion_minutos: formData.get('duracion_minutos'),
    precio: formData.get('precio'),
    activo: formData.get('activo') === 'true',
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('servicios').update(result.data).eq('id', id);

  if (error) return { error: 'Error al actualizar servicio' };

  revalidatePath('/servicios');
  return { success: 'Servicio actualizado' };
}

export async function deleteServicio(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('servicios').delete().eq('id', id);
  if (error) return { error: 'Error al eliminar servicio' };
  revalidatePath('/servicios');
  return { success: true };
}

export async function toggleServicio(id: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('servicios').update({ activo }).eq('id', id);
  if (error) return { error: 'Error al actualizar' };
  revalidatePath('/servicios');
  return { success: true };
}
