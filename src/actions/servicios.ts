'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Servicio } from '@/types';

const ServicioSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100),
  descripcion: z.string().optional(),
  duracion_minutos: z.number().int().min(5).max(480),
  precio: z.number().min(0),
  activo: z.boolean(),
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

type ServicioInput = {
  nombre: string;
  descripcion?: string;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
};

export async function createServicio(input: ServicioInput) {
  const result = ServicioSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('servicios')
    .insert(result.data)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/servicios');
  return { item: data as Servicio };
}

export async function updateServicio(id: string, input: ServicioInput) {
  const result = ServicioSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('servicios')
    .update(result.data)
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/servicios');
  return { item: data as Servicio };
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
