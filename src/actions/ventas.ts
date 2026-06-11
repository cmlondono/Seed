'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { format, startOfMonth } from 'date-fns';
import type { Venta, VentaFormData } from '@/types';

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

  // Default to current month when no date range specified
  const desde = filters?.desde ?? format(startOfMonth(new Date()), 'yyyy-MM-dd');

  let query = supabase
    .from('ventas')
    .select(`*, cliente:clientes(*), empleado:empleados(*), detalles:detalle_ventas(*, servicio:servicios(*))`)
    .gte('created_at', desde)
    .order('created_at', { ascending: false });

  if (filters?.hasta) query = query.lte('created_at', `${filters.hasta}T23:59:59`);
  if (filters?.empleado_id) query = query.eq('empleado_id', filters.empleado_id);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getVenta(id: string): Promise<Venta | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ventas')
    .select(`*, cliente:clientes(*), empleado:empleados(*), detalles:detalle_ventas(*, servicio:servicios(*))`)
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

  const supabase = await createClient();

  // Check cita not already linked to another venta
  if (ventaBase.cita_id) {
    const { data: citaExistente } = await supabase
      .from('ventas')
      .select('id')
      .eq('cita_id', ventaBase.cita_id)
      .neq('estado', 'cancelada')
      .single();
    if (citaExistente) return { error: 'Esta cita ya tiene una venta registrada' };
  }

  // Pre-validate ALL stock BEFORE inserting venta
  const productosDetalles = detalles.filter((d) => d.tipo === 'producto' && d.producto_id);
  const stockSnapshots: { inventario_id: string; stock_actual: number; nombre: string }[] = [];

  for (const detalle of productosDetalles) {
    const { data: inv } = await supabase
      .from('inventario')
      .select('stock_actual, nombre')
      .eq('id', detalle.producto_id!)
      .single();

    if (!inv || inv.stock_actual < detalle.cantidad) {
      return { error: `Stock insuficiente: ${inv?.nombre ?? detalle.descripcion}` };
    }
    stockSnapshots.push({ inventario_id: detalle.producto_id!, stock_actual: inv.stock_actual, nombre: inv.nombre });
  }

  // Calculate totals
  const subtotal = detalles.reduce((acc, d) => acc + (d.precio_unitario * d.cantidad - d.descuento), 0);
  const totalConDescuento = Math.max(0, subtotal - descuento);

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

  // Decrement stock (pre-validated, so this should always succeed)
  for (const snap of stockSnapshots) {
    await supabase
      .from('inventario')
      .update({ stock_actual: snap.stock_actual - (productosDetalles.find((d) => d.producto_id === snap.inventario_id)?.cantidad ?? 0) })
      .eq('id', snap.inventario_id);
  }

  // Insert detalle_ventas
  // inventario_id is set only if the column exists (migration 1 in migrations.sql)
  const detallesConVenta = detalles.map((d) => ({
    venta_id: venta.id,
    tipo: d.tipo,
    producto_id: null,
    servicio_id: d.servicio_id || null,
    descripcion: d.descripcion,
    cantidad: d.cantidad,
    precio_unitario: d.precio_unitario,
    descuento: d.descuento,
    subtotal: d.precio_unitario * d.cantidad - d.descuento,
  }));

  const { error: detallesError } = await supabase.from('detalle_ventas').insert(detallesConVenta);

  if (detallesError) {
    await supabase.from('ventas').delete().eq('id', venta.id);
    return { error: 'Error al guardar detalles de venta' };
  }

  if (ventaBase.cita_id) {
    await supabase.from('citas').update({ estado: 'completada' }).eq('id', ventaBase.cita_id);
  }

  const { data: ventaCompleta } = await supabase
    .from('ventas')
    .select(`*, cliente:clientes(*), empleado:empleados(*), detalles:detalle_ventas(*, servicio:servicios(*))`)
    .eq('id', venta.id)
    .single();

  revalidatePath('/ventas');
  revalidatePath('/dashboard');
  revalidatePath('/inventario');
  revalidatePath('/creditos');
  return { success: 'Venta registrada', ventaId: venta.id, venta: ventaCompleta as Venta };
}

export async function cancelarVenta(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('ventas').update({ estado: 'cancelada' }).eq('id', id);
  if (error) return { error: 'Error al cancelar venta' };

  revalidatePath('/ventas');
  revalidatePath('/inventario');
  return { success: true };
}
