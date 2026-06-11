'use client';

import { useState, useActionState } from 'react';
import { updateConfiguracion } from '@/actions/configuracion';
import type { Configuracion } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Mail } from 'lucide-react';

interface Props { config: Configuracion | null }

export function ConfiguracionClient({ config }: Props) {
  const [state, formAction, isPending] = useActionState(updateConfiguracion, null);

  const [fields, setFields] = useState({
    nombre_negocio: config?.nombre_negocio ?? '',
    telefono: config?.telefono ?? '',
    email: config?.email ?? '',
    direccion: config?.direccion ?? '',
    ciudad: config?.ciudad ?? '',
    pais: config?.pais ?? 'Colombia',
    moneda: config?.moneda ?? 'COP',
    simbolo_moneda: config?.simbolo_moneda ?? '$',
    porcentaje_impuesto: String(config?.porcentaje_impuesto ?? 0),
    zona_horaria: config?.zona_horaria ?? 'America/Bogota',
    hora_apertura: config?.hora_apertura ?? '08:00',
    hora_cierre: config?.hora_cierre ?? '18:00',
    color_primario: config?.color_primario ?? '#3B82F6',
    email_hora_envio: String(config?.email_hora_envio ?? 12),
    email_asunto: config?.email_asunto ?? 'Recordatorio de pago — Cuota {numero_cuota}/{total_cuotas}',
    email_cuerpo: config?.email_cuerpo ?? `Estimado/a {cliente_nombre},\n\nTiene una cuota con vencimiento el {fecha_vencimiento}.\n\nCuota: {numero_cuota} de {total_cuotas}\nMonto: {monto}\n\nContáctenos{negocio_telefono} para coordinar su pago.\n\n{negocio_nombre}`,
  });

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const setText = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="max-w-2xl space-y-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state?.success && (
        <Alert>
          <AlertDescription className="text-green-600">{state.success}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} className="space-y-6">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Información del negocio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre del negocio *</Label>
              <Input name="nombre_negocio" className="h-9" value={fields.nombre_negocio} onChange={set('nombre_negocio')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Teléfono</Label>
                <Input name="telefono" className="h-9" value={fields.telefono} onChange={set('telefono')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input name="email" type="email" className="h-9" value={fields.email} onChange={set('email')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dirección</Label>
              <Input name="direccion" className="h-9" value={fields.direccion} onChange={set('direccion')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Ciudad</Label>
                <Input name="ciudad" className="h-9" value={fields.ciudad} onChange={set('ciudad')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">País</Label>
                <Input name="pais" className="h-9" value={fields.pais} onChange={set('pais')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Moneda e impuestos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Moneda</Label>
                <Input name="moneda" className="h-9" value={fields.moneda} onChange={set('moneda')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Símbolo</Label>
                <Input name="simbolo_moneda" className="h-9" value={fields.simbolo_moneda} onChange={set('simbolo_moneda')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">IVA (%)</Label>
                <Input name="porcentaje_impuesto" type="number" min={0} max={100} className="h-9" value={fields.porcentaje_impuesto} onChange={set('porcentaje_impuesto')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Horarios y zona horaria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Zona horaria</Label>
              <Input name="zona_horaria" className="h-9" value={fields.zona_horaria} onChange={set('zona_horaria')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Hora apertura</Label>
                <Input name="hora_apertura" type="time" className="h-9" value={fields.hora_apertura} onChange={set('hora_apertura')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hora cierre</Label>
                <Input name="hora_cierre" type="time" className="h-9" value={fields.hora_cierre} onChange={set('hora_cierre')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm">Apariencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label className="text-xs">Color primario</Label>
              <div className="flex items-center gap-3">
                <Input
                  name="color_primario"
                  type="color"
                  className="h-9 w-16 p-1 rounded-md cursor-pointer"
                  value={fields.color_primario}
                  onChange={set('color_primario')}
                />
                <span className="text-sm text-muted-foreground">Color del sistema</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="w-4 h-4" /> Recordatorios de pago por email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Hora de envío (hora Colombia)</Label>
              <Input
                name="email_hora_envio"
                type="number"
                min={0}
                max={23}
                className="h-9 w-24"
                value={fields.email_hora_envio}
                onChange={set('email_hora_envio')}
              />
              <p className="text-xs text-muted-foreground">0 = medianoche · 12 = mediodía · 17 = 5pm</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Asunto del correo</Label>
              <Input
                name="email_asunto"
                className="h-9"
                value={fields.email_asunto}
                onChange={set('email_asunto')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cuerpo del mensaje</Label>
              <Textarea
                name="email_cuerpo"
                rows={8}
                className="text-sm font-mono"
                value={fields.email_cuerpo}
                onChange={setText('email_cuerpo')}
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles: <code className="bg-muted px-1 rounded">{'{cliente_nombre}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{numero_cuota}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{total_cuotas}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{monto}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{fecha_vencimiento}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{negocio_nombre}'}</code>{' '}
                <code className="bg-muted px-1 rounded">{'{negocio_telefono}'}</code>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
