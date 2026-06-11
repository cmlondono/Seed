'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Inventario, MovimientoInventario, TipoMovimiento, Producto } from '@/types';

const InventarioSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  categoria_id: z.string().uuid().optional().nullable(),
  stock_actual: z.number().min(0),
  stock_minimo: z.number().min(0),
  unidad: z.string().min(1).default('unidad'),
  costo_unitario: z.number().min(0),
  precio_venta: z.number().min(0).default(0),
  proveedor: z.string().optional(),
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

type InventarioInput = z.infer<typeof InventarioSchema>;

export async function createInventario(input: InventarioInput) {
  const result = InventarioSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventario')
    .insert({ ...result.data, activo: true })
    .select('*, categoria:categorias_inventario(*)')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/inventario');
  return { item: data as Inventario };
}

export async function updateInventario(id: string, input: InventarioInput) {
  const result = InventarioSchema.safeParse(input);
  if (!result.success) return { error: result.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventario')
    .update(result.data)
    .eq('id', id)
    .select('*, categoria:categorias_inventario(*)')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/inventario');
  return { item: data as Inventario };
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

// Maps inventario items to the Producto shape used by the ventas module
export async function getProductos(): Promise<Producto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('inventario')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  return (data ?? []).map((item) => ({
    id: item.id,
    nombre: item.nombre,
    descripcion: item.descripcion ?? undefined,
    precio: item.precio_venta > 0 ? item.precio_venta : item.costo_unitario,
    costo: item.costo_unitario,
    stock: item.stock_actual,
    inventario_id: item.id,
    activo: item.activo,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}
