import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMail } from '@/lib/email/mailer';
import { cuotaCobroHtml, cuotaCobroText } from '@/lib/email/templates/cuota-cobro';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const hoy = format(new Date(), 'yyyy-MM-dd');

  // Marcar como vencidas las cuotas pendientes con fecha pasada
  await supabase
    .from('cuotas_credito')
    .update({ estado: 'vencido' })
    .lt('fecha_vencimiento', hoy)
    .eq('estado', 'pendiente');

  await supabase.rpc('actualizar_estado_creditos_vencidos').maybeSingle();

  // Obtener config del negocio
  const { data: config } = await supabase
    .from('configuracion')
    .select('nombre_negocio, telefono, email, simbolo_moneda')
    .single();

  const remitente = process.env.GMAIL_USER ?? '';
  const negocioNombre = config?.nombre_negocio ?? 'Tu Negocio';

  // Cuotas que vencen hoy, pendientes, sin email enviado
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

    const fechaFormateada = format(
      new Date(cuota.fecha_vencimiento + 'T12:00:00'),
      "d 'de' MMMM yyyy",
      { locale: es },
    );

    const emailData = {
      clienteNombre: `${cliente.nombre}${cliente.apellido ? ' ' + cliente.apellido : ''}`,
      numeroCuota: cuota.numero_cuota,
      totalCuotas: credito.numero_cuotas,
      monto: cuota.monto,
      fechaVencimiento: fechaFormateada,
      negocioNombre,
      negocioTelefono: config?.telefono,
      simboloMoneda: config?.simbolo_moneda ?? '$',
    };

    try {
      await sendMail({
        from: `${negocioNombre} <${remitente}>`,
        to: cliente.email,
        subject: `Recordatorio de pago — Cuota ${cuota.numero_cuota}/${credito.numero_cuotas}`,
        html: cuotaCobroHtml(emailData),
        text: cuotaCobroText(emailData),
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
