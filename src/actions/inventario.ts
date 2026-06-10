'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Inventario, MovimientoInventario, TipoMovimiento } from '@/types';

const InventarioSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  categoria_id: z.string().uuid().optional().nullable(),
  stock_actual: z.coerce.number().min(0),
  stock_minimo: z.coerce.number().min(0),
  unidad: z.string().default('unidad'),
  costo_unitario: z.coerce.number().min(0),
  proveedor: z.string().optional(),
  activo: z.boolean().default(true),
});

const MovimientoSchema = z.object({
  inventario_id: z.string().uuid(),
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  cantidad: z.coerce.number(),
  motivo: z.string().optional(),
});

export async function getInventario(): Promise<Inventario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventario')
    .select(`*, categoria:categorias_inventario(*)`)
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data ?? [];
}

export async function getInventarioItem(id: string): Promise<Inventario | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventario')
    .select(`*, categoria:categorias_inventario(*)`)
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function getInventarioBajoStock(): Promise<Inventario[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventario')
    .select(`*, categoria:categorias_inventario(*)`)
    .eq('activo', true)
    .filter('stock_actual', 'lte', 'stock_minimo');
  if (error) return [];
  return data ?? [];
}

export async function createInventario(prevState: unknown, formData: FormData) {
  const result = InventarioSchema.safeParse({
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion'),
    categoria_id: formData.get('categoria_id') || null,
    stock_actual: formData.get('stock_actual'),
    stock_minimo: formData.get('stock_minimo'),
    unidad: formData.get('unidad') || 'unidad',
    costo_unitario: formData.get('costo_unitario'),
    proveedor: formData.get('proveedor'),
    activo: true,
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('inventario').insert(result.data);

  if (error) return { error: 'Error al crear item' };

  revalidatePath('/inventario');
  return { success: 'Item creado' };
}

export async function updateInventario(id: string, prevState: unknown, formData: FormData) {
  const result = InventarioSchema.safeParse({
    nombre: formData.get('nombre'),
    descripcion: formData.get('descripcion'),
    categoria_id: formData.get('categoria_id') || null,
    stock_actual: formData.get('stock_actual'),
    stock_minimo: formData.get('stock_minimo'),
    unidad: formData.get('unidad') || 'unidad',
    costo_unitario: formData.get('costo_unitario'),
    proveedor: formData.get('proveedor'),
    activo: formData.get('activo') !== 'false',
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('inventario').update(result.data).eq('id', id);

  if (error) return { error: 'Error al actualizar item' };

  revalidatePath('/inventario');
  return { success: 'Item actualizado' };
}

export async function registrarMovimiento(data: {
  inventario_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
}) {
  const result = MovimientoSchema.safeParse(data);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();

  const { data: item, error: fetchError } = await supabase
    .from('inventario')
    .select('stock_actual')
    .eq('id', data.inventario_id)
    .single();

  if (fetchError || !item) return { error: 'Item no encontrado' };

  const stock_anterior = item.stock_actual;
  let stock_nuevo: number;

  switch (data.tipo) {
    case 'entrada':
      stock_nuevo = stock_anterior + Math.abs(data.cantidad);
      break;
    case 'salida':
      stock_nuevo = stock_anterior - Math.abs(data.cantidad);
      if (stock_nuevo < 0) return { error: 'Stock insuficiente' };
      break;
    case 'ajuste':
      stock_nuevo = Math.max(0, data.cantidad);
      break;
  }

  const { data: user } = await supabase.auth.getUser();

  const { error: moveError } = await supabase.from('movimientos_inventario').insert({
    inventario_id: data.inventario_id,
    tipo: data.tipo,
    cantidad: data.cantidad,
    stock_anterior,
    stock_nuevo,
    motivo: data.motivo,
    created_by: user.user?.id,
  });

  if (moveError) return { error: 'Error al registrar movimiento' };

  const { error: updateError } = await supabase
    .from('inventario')
    .update({ stock_actual: stock_nuevo })
    .eq('id', data.inventario_id);

  if (updateError) return { error: 'Error al actualizar stock' };

  revalidatePath('/inventario');
  return { success: true, stock_nuevo };
}

export async function getMovimientos(inventario_id?: string): Promise<MovimientoInventario[]> {
  const supabase = await createClient();
  let query = supabase
    .from('movimientos_inventario')
    .select(`*, inventario:inventario(*), profile:profiles(nombre, apellido)`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (inventario_id) query = query.eq('inventario_id', inventario_id);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function getCategorias() {
  const supabase = await createClient();
  const { data } = await supabase.from('categorias_inventario').select('*').order('nombre');
  return data ?? [];
}
