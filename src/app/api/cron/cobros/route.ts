import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendMail } from '@/lib/email/mailer';
import { cuotaCobroHtml } from '@/lib/email/templates/cuota-cobro';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

function horaActualColombia(): number {
  return parseInt(
    new Intl.DateTimeFormat('es-CO', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/Bogota',
    }).format(new Date()),
    10,
  );
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{${k}}`, v),
    template,
  );
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const hoy = format(new Date(), 'yyyy-MM-dd');

  // Obtener config
  const { data: config } = await supabase
    .from('configuracion')
    .select('nombre_negocio, telefono, simbolo_moneda, email_hora_envio, email_asunto, email_cuerpo')
    .single();

  // Verificar hora configurada (cron corre cada hora)
  const horaEnvio = config?.email_hora_envio ?? 12;
  const horaActual = horaActualColombia();
  if (horaActual !== horaEnvio) {
    return NextResponse.json({ ok: true, skipped: true, hora_actual: horaActual, hora_envio: horaEnvio });
  }

  // Marcar cuotas vencidas
  await supabase
    .from('cuotas_credito')
    .update({ estado: 'vencido' })
    .lt('fecha_vencimiento', hoy)
    .eq('estado', 'pendiente');

  await supabase.rpc('actualizar_estado_creditos_vencidos').maybeSingle();

  const remitente = process.env.GMAIL_USER ?? '';
  const negocioNombre = config?.nombre_negocio ?? 'Tu Negocio';
  const simbolo = config?.simbolo_moneda ?? '$';

  const asuntoTpl = config?.email_asunto ?? 'Recordatorio de pago — Cuota {numero_cuota}/{total_cuotas}';
  const cuerpoTpl = config?.email_cuerpo ?? `Estimado/a {cliente_nombre},\n\nTiene una cuota con vencimiento el {fecha_vencimiento}.\n\nCuota: {numero_cuota} de {total_cuotas}\nMonto: {monto}\n\n{negocio_nombre}`;

  // Cuotas que vencen hoy
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

    const montoFormateado = `${simbolo}${cuota.monto.toLocaleString('es-CO')}`;
    const telTexto = config?.telefono ? ` al ${config.telefono}` : '';
    const clienteNombre = `${cliente.nombre}${cliente.apellido ? ' ' + cliente.apellido : ''}`;

    const vars: Record<string, string> = {
      cliente_nombre: clienteNombre,
      numero_cuota: String(cuota.numero_cuota),
      total_cuotas: String(credito.numero_cuotas),
      monto: montoFormateado,
      fecha_vencimiento: fechaFormateada,
      negocio_nombre: negocioNombre,
      negocio_telefono: telTexto,
    };

    try {
      await sendMail({
        from: `${negocioNombre} <${remitente}>`,
        to: cliente.email,
        subject: renderTemplate(asuntoTpl, vars),
        html: cuotaCobroHtml({
          clienteNombre,
          numeroCuota: cuota.numero_cuota,
          totalCuotas: credito.numero_cuotas,
          monto: cuota.monto,
          fechaVencimiento: fechaFormateada,
          negocioNombre,
          negocioTelefono: config?.telefono,
          simboloMoneda: simbolo,
        }),
        text: renderTemplate(cuerpoTpl, vars),
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

  return NextResponse.json({ ok: true, fecha: hoy, emails_enviados: enviados, errores });
}
