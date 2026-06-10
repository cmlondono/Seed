'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Cliente } from '@/types';

const ClienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  observaciones: z.string().optional(),
});

export async function getClientes(): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data ?? [];
}

export async function getCliente(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select(`*, citas(*, empleado:empleados(nombre,apellido), servicio:servicios(nombre)), ventas(*)`)
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function searchClientes(query: string): Promise<Cliente[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('clientes')
    .select('*')
    .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,telefono.ilike.%${query}%,email.ilike.%${query}%`)
    .eq('activo', true)
    .limit(10);
  return data ?? [];
}

export async function createCliente(prevState: unknown, formData: FormData) {
  const result = ClienteSchema.safeParse({
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    telefono: formData.get('telefono'),
    email: formData.get('email') || undefined,
    observaciones: formData.get('observaciones'),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .insert({ ...result.data, email: result.data.email || null })
    .select()
    .single();

  if (error) return { error: 'Error al crear cliente' };

  revalidatePath('/clientes');
  return { success: 'Cliente creado', data };
}

export async function updateCliente(id: string, prevState: unknown, formData: FormData) {
  const result = ClienteSchema.safeParse({
    nombre: formData.get('nombre'),
    apellido: formData.get('apellido'),
    telefono: formData.get('telefono'),
    email: formData.get('email') || undefined,
    observaciones: formData.get('observaciones'),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('clientes')
    .update({ ...result.data, email: result.data.email || null })
    .eq('id', id);

  if (error) return { error: 'Error al actualizar cliente' };

  revalidatePath('/clientes');
  return { success: 'Cliente actualizado' };
}

export async function deleteCliente(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('clientes').update({ activo: false }).eq('id', id);
  if (error) return { error: 'Error al eliminar cliente' };
  revalidatePath('/clientes');
  return { success: true };
}
