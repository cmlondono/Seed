'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Venta, VentaFormData, Producto } from '@/types';

const DetalleSchema = z.object({
  tipo: z.enum(['producto', 'servicio']),
  producto_id: z.string().uuid().optional().nullable(),
  servicio_id: z.string().uuid().optional().nullable(),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precio_unitario: z.number().min(0),
  descuento: z.number().min(0).default(0),
});

const VentaSchema = z.object({
  cliente_id: z.string().uuid().optional().nullable(),
  empleado_id: z.string().uuid(),
  cita_id: z.string().uuid().optional().nullable(),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'mixto', 'credito']),
  descuento: z.number().min(0).default(0),
  notas: z.string().optional(),
  detalles: z.array(DetalleSchema).min(1, 'Agrega al menos un item'),
});

export async function getVentas(filters?: {
  desde?: string;
  hasta?: string;
  empleado_id?: string;
}): Promise<Venta[]> {
  const supabase = await createClient();
  let query = supabase
    .from('ventas')
    .select(`*, cliente:clientes(*), empleado:empleados(*), detalles:detalle_ventas(*, producto:productos(*), servicio:servicios(*))`)
    .order('created_at', { ascending: false });

  if (filters?.desde) query = query.gte('created_at', filters.desde);
  if (filters?.hasta) query = query.lte('created_at', filters.hasta);
  if (filters?.empleado_id) query = query.eq('empleado_id', filters.empleado_id);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getVenta(id: string): Promise<Venta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ventas')
    .select(`*, cliente:clientes(*), empleado:empleados(*), detalles:detalle_ventas(*, producto:productos(*), servicio:servicios(*))`)
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function createVenta(ventaData: VentaFormData) {
  const result = VentaSchema.safeParse(ventaData);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { detalles, descuento, ...ventaBase } = result.data;

  // Calculate totals
  const subtotal = detalles.reduce((acc, d) => acc + (d.precio_unitario * d.cantidad - d.descuento), 0);
  const totalConDescuento = Math.max(0, subtotal - descuento);

  const supabase = await createClient();

  // Get tax rate
  const { data: config } = await supabase.from('configuracion').select('porcentaje_impuesto').single();
  const taxRate = config?.porcentaje_impuesto ?? 0;
  const impuesto = totalConDescuento * (taxRate / 100);
  const total = totalConDescuento + impuesto;

  const { data: user } = await supabase.auth.getUser();

  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .insert({
      ...ventaBase,
      cliente_id: ventaBase.cliente_id || null,
      cita_id: ventaBase.cita_id || null,
      subtotal,
      descuento,
      impuesto,
      total,
      estado: 'completada',
      created_by: user.user?.id,
    })
    .select()
    .single();

  if (ventaError) return { error: 'Error al crear venta' };

  // Check and decrement inventario stock before inserting details
  const productosDetalles = detalles.filter((d) => d.tipo === 'producto' && d.producto_id);
  for (const detalle of productosDetalles) {
    const { data: inv } = await supabase
      .from('inventario')
      .select('stock_actual, nombre')
      .eq('id', detalle.producto_id!)
      .single();

    if (!inv || inv.stock_actual < detalle.cantidad) {
      await supabase.from('ventas').delete().eq('id', venta.id);
      return { error: `Stock insuficiente: ${inv?.nombre ?? detalle.descripcion}` };
    }

    await supabase
      .from('inventario')
      .update({ stock_actual: inv.stock_actual - detalle.cantidad })
      .eq('id', detalle.producto_id!);
  }

  // Insert details — producto_id set to null since we use inventario directly (no productos table rows)
  const detallesConVenta = detalles.map((d) => ({
    ...d,
    venta_id: venta.id,
    subtotal: d.precio_unitario * d.cantidad - d.descuento,
    producto_id: null,
    servicio_id: d.servicio_id || null,
  }));

  const { error: detallesError } = await supabase.from('detalle_ventas').insert(detallesConVenta);

  if (detallesError) {
    await supabase.from('ventas').delete().eq('id', venta.id);
    return { error: 'Error al guardar detalles de venta' };
  }

  // Update cita to completada if linked
  if (ventaBase.cita_id) {
    await supabase.from('citas').update({ estado: 'completada' }).eq('id', ventaBase.cita_id);
  }

  revalidatePath('/ventas');
  revalidatePath('/dashboard');
  revalidatePath('/inventario');
  return { success: 'Venta registrada', ventaId: venta.id };
}

export async function cancelarVenta(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('ventas').update({ estado: 'cancelada' }).eq('id', id);
  if (error) return { error: 'Error al cancelar venta' };
  revalidatePath('/ventas');
  return { success: true };
}

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
