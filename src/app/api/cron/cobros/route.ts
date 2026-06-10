import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getResend } from '@/lib/email/resend';
import { cuotaCobroHtml, cuotaCobroText } from '@/lib/email/templates/cuota-cobro';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verificar autorización (Vercel Cron envía el header automáticamente)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const hoy = format(new Date(), 'yyyy-MM-dd');

  // 1. Marcar como vencidas las cuotas pendientes con fecha pasada
  await supabase
    .from('cuotas_credito')
    .update({ estado: 'vencido' })
    .lt('fecha_vencimiento', hoy)
    .eq('estado', 'pendiente');

  // Actualizar estado credito si todas las cuotas están vencidas
  await supabase.rpc('actualizar_estado_creditos_vencidos').maybeSingle();

  // 2. Obtener config del negocio
  const { data: config } = await supabase
    .from('configuracion')
    .select('nombre_negocio, telefono, email, simbolo_moneda')
    .single();

  const negocioEmail = config?.email ?? process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com';
  const negocioNombre = config?.nombre_negocio ?? 'Tu Negocio';

  // 3. Enviar emails para cuotas que vencen hoy
  const { data: cuotas } = await supabase
    .from('cuotas_credito')
    .select(`
      id, numero_cuota, monto, fecha_vencimiento,
      credito:creditos(
        numero_cuotas,
        cliente:clientes(nombre, apellido, email)
      )
    `)
    .eq('fecha_vencimiento', hoy)
    .eq('estado', 'pendiente')
    .eq('email_enviado', false);

  let enviados = 0;
  const errores: string[] = [];

  for (const cuota of cuotas ?? []) {
    const credito = cuota.credito as unknown as {
      numero_cuotas: number;
      cliente: { nombre: string; apellido?: string; email?: string } | null;
    };
    const cliente = credito?.cliente;
    if (!cliente?.email) continue;

    const fechaFormateada = format(new Date(cuota.fecha_vencimiento + 'T12:00:00'), "d 'de' MMMM yyyy", { locale: es });

    try {
      await getResend().emails.send({
        from: `${negocioNombre} <${negocioEmail}>`,
        to: [cliente.email],
        subject: `Recordatorio de pago — Cuota ${cuota.numero_cuota}/${credito.numero_cuotas}`,
        html: cuotaCobroHtml({
          clienteNombre: `${cliente.nombre}${cliente.apellido ? ' ' + cliente.apellido : ''}`,
          numeroCuota: cuota.numero_cuota,
          totalCuotas: credito.numero_cuotas,
          monto: cuota.monto,
          fechaVencimiento: fechaFormateada,
          negocioNombre,
          negocioTelefono: config?.telefono,
          simboloMoneda: config?.simbolo_moneda ?? '$',
        }),
        text: cuotaCobroText({
          clienteNombre: `${cliente.nombre}${cliente.apellido ? ' ' + cliente.apellido : ''}`,
          numeroCuota: cuota.numero_cuota,
          totalCuotas: credito.numero_cuotas,
          monto: cuota.monto,
          fechaVencimiento: fechaFormateada,
          negocioNombre,
          negocioTelefono: config?.telefono,
          simboloMoneda: config?.simbolo_moneda ?? '$',
        }),
      });

      await supabase
        .from('cuotas_credito')
        .update({ email_enviado: true })
        .eq('id', cuota.id);

      enviados++;
    } catch (e) {
      errores.push(`Cuota ${cuota.id}: ${e}`);
    }
  }

  return NextResponse.json({
    ok: true,
    fecha: hoy,
    emails_enviados: enviados,
    errores,
  });
}
