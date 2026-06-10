interface CuotaEmailData {
  clienteNombre: string;
  numeroCuota: number;
  totalCuotas: number;
  monto: number;
  fechaVencimiento: string;
  negocioNombre: string;
  negocioTelefono?: string;
  simboloMoneda?: string;
}

export function cuotaCobroHtml(data: CuotaEmailData): string {
  const simbolo = data.simboloMoneda ?? '$';
  const montoFormateado = `${simbolo}${data.monto.toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recordatorio de pago</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:28px 36px;">
              <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.3px;">${data.negocioNombre}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px;">
              <p style="margin:0 0 8px;color:#374151;font-size:15px;">Estimado/a <strong>${data.clienteNombre}</strong>,</p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.6;">
                Le recordamos que tiene una cuota de crédito con vencimiento próximo.
              </p>

              <!-- Card cuota -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Cuota</td>
                        <td align="right" style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Vencimiento</td>
                      </tr>
                      <tr>
                        <td style="color:#111827;font-size:18px;font-weight:700;">${data.numeroCuota} / ${data.totalCuotas}</td>
                        <td align="right" style="color:#111827;font-size:16px;font-weight:600;">${data.fechaVencimiento}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:16px;border-top:1px solid #e5e7eb;margin-top:16px;">
                          <span style="color:#6b7280;font-size:13px;">Monto a pagar:</span>
                          <span style="color:#111827;font-size:24px;font-weight:700;margin-left:8px;">${montoFormateado}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">
                Para coordinar su pago o si tiene alguna pregunta, por favor contáctenos${data.negocioTelefono ? ` al <strong>${data.negocioTelefono}</strong>` : ''}.
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                Recuerde que el pago puntual evita recargos y mantiene su crédito en buen estado.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 36px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                Este es un mensaje automático de ${data.negocioNombre}. Por favor no responda a este correo.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function cuotaCobroText(data: CuotaEmailData): string {
  const simbolo = data.simboloMoneda ?? '$';
  return `Recordatorio de pago — ${data.negocioNombre}

Estimado/a ${data.clienteNombre},

Tiene una cuota de crédito próxima a vencer:

  Cuota: ${data.numeroCuota} de ${data.totalCuotas}
  Monto: ${simbolo}${data.monto}
  Fecha de vencimiento: ${data.fechaVencimiento}

${data.negocioTelefono ? `Contáctenos al ${data.negocioTelefono} para coordinar su pago.` : 'Contáctenos para coordinar su pago.'}

— ${data.negocioNombre}`;
}
