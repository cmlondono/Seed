'use server';

import { createClient } from '@/lib/supabase/server';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import type { DashboardStats, VentasPorDia, ServicioTop } from '@/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const hoy = format(new Date(), 'yyyy-MM-dd');
  const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const finMes = format(endOfMonth(new Date()), 'yyyy-MM-dd');

  const [ventasHoy, ventasMes, citasHoy, citasPendientes, clientesMes, bajoStock] = await Promise.all([
    supabase
      .from('ventas')
      .select('total')
      .gte('created_at', `${hoy}T00:00:00`)
      .lte('created_at', `${hoy}T23:59:59`)
      .eq('estado', 'completada'),
    supabase
      .from('ventas')
      .select('total')
      .gte('created_at', `${inicioMes}T00:00:00`)
      .lte('created_at', `${finMes}T23:59:59`)
      .eq('estado', 'completada'),
    supabase.from('citas').select('id', { count: 'exact' }).eq('fecha', hoy),
    supabase
      .from('citas')
      .select('id', { count: 'exact' })
      .in('estado', ['pendiente', 'confirmada']),
    supabase
      .from('clientes')
      .select('id', { count: 'exact' })
      .gte('fecha_registro', `${inicioMes}T00:00:00`),
    supabase
      .from('inventario')
      .select('id', { count: 'exact' })
      .eq('activo', true)
      .filter('stock_actual', 'lte', 'stock_minimo'),
  ]);

  return {
    ventas_hoy: ventasHoy.data?.reduce((s, v) => s + (v.total ?? 0), 0) ?? 0,
    ventas_mes: ventasMes.data?.reduce((s, v) => s + (v.total ?? 0), 0) ?? 0,
    citas_hoy: citasHoy.count ?? 0,
    citas_pendientes: citasPendientes.count ?? 0,
    clientes_nuevos_mes: clientesMes.count ?? 0,
    items_bajo_stock: bajoStock.count ?? 0,
  };
}

export async function getVentasPorDia(dias = 30): Promise<VentasPorDia[]> {
  const supabase = await createClient();
  const desde = format(subDays(new Date(), dias), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('ventas')
    .select('created_at, total')
    .gte('created_at', `${desde}T00:00:00`)
    .eq('estado', 'completada')
    .order('created_at');

  if (error) return [];

  const grouped = (data ?? []).reduce<Record<string, { total: number; cantidad: number }>>((acc, v) => {
    const fecha = v.created_at.substring(0, 10);
    if (!acc[fecha]) acc[fecha] = { total: 0, cantidad: 0 };
    acc[fecha].total += v.total ?? 0;
    acc[fecha].cantidad += 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([fecha, values]) => ({
    fecha,
    ...values,
  }));
}

export async function getServiciosTop(): Promise<ServicioTop[]> {
  const supabase = await createClient();
  const inicioMes = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('citas')
    .select(`servicio_id, precio, servicio:servicios(nombre)`)
    .gte('fecha', inicioMes)
    .eq('estado', 'completada');

  if (error) return [];

  const grouped = (data ?? []).reduce<Record<string, ServicioTop>>((acc, c) => {
    const id = c.servicio_id;
    if (!acc[id]) {
      acc[id] = {
        servicio_id: id,
        nombre: (c.servicio as unknown as { nombre: string })?.nombre ?? 'Servicio',
        total_citas: 0,
        ingresos: 0,
      };
    }
    acc[id].total_citas += 1;
    acc[id].ingresos += c.precio ?? 0;
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => b.total_citas - a.total_citas).slice(0, 5);
}

export async function getReporteVentas(desde: string, hasta: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ventas')
    .select(`*, cliente:clientes(nombre), empleado:empleados(nombre,apellido), detalles:detalle_ventas(*)`)
    .gte('created_at', `${desde}T00:00:00`)
    .lte('created_at', `${hasta}T23:59:59`)
    .eq('estado', 'completada')
    .order('created_at', { ascending: false });

  if (error) return { data: [], totales: { ingresos: 0, cantidad: 0, ticket_promedio: 0 } };

  const ingresos = (data ?? []).reduce((s, v) => s + (v.total ?? 0), 0);
  const cantidad = data?.length ?? 0;

  return {
    data: data ?? [],
    totales: {
      ingresos,
      cantidad,
      ticket_promedio: cantidad > 0 ? ingresos / cantidad : 0,
    },
  };
}

export async function getReporteCitas(desde: string, hasta: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('citas')
    .select(`*, cliente:clientes(nombre), empleado:empleados(nombre,apellido), servicio:servicios(nombre)`)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false });

  if (error) return { data: [], totales: { total: 0, completadas: 0, canceladas: 0, ingresos: 0 } };

  const completadas = (data ?? []).filter((c) => c.estado === 'completada').length;
  const canceladas = (data ?? []).filter((c) => c.estado === 'cancelada').length;
  const ingresos = (data ?? []).filter((c) => c.estado === 'completada').reduce((s, c) => s + (c.precio ?? 0), 0);

  return {
    data: data ?? [],
    totales: {
      total: data?.length ?? 0,
      completadas,
      canceladas,
      ingresos,
    },
  };
}
