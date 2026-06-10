'use client';

import { useActionState } from 'react';
import { updateConfiguracion } from '@/actions/configuracion';
import type { Configuracion } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save } from 'lucide-react';

interface Props { config: Configuracion | null }

export function ConfiguracionClient({ config }: Props) {
  const [state, formAction, isPending] = useActionState(updateConfiguracion, null);

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
              <Input name="nombre_negocio" className="h-9" defaultValue={config?.nombre_negocio ?? ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Teléfono</Label>
                <Input name="telefono" className="h-9" defaultValue={config?.telefono ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input name="email" type="email" className="h-9" defaultValue={config?.email ?? ''} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Dirección</Label>
              <Input name="direccion" className="h-9" defaultValue={config?.direccion ?? ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Ciudad</Label>
                <Input name="ciudad" className="h-9" defaultValue={config?.ciudad ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">País</Label>
                <Input name="pais" className="h-9" defaultValue={config?.pais ?? 'Colombia'} />
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
                <Input name="moneda" className="h-9" defaultValue={config?.moneda ?? 'COP'} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Símbolo</Label>
                <Input name="simbolo_moneda" className="h-9" defaultValue={config?.simbolo_moneda ?? '$'} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">IVA (%)</Label>
                <Input name="porcentaje_impuesto" type="number" min={0} max={100} className="h-9" defaultValue={config?.porcentaje_impuesto ?? 0} />
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
              <Input name="zona_horaria" className="h-9" defaultValue={config?.zona_horaria ?? 'America/Bogota'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Hora apertura</Label>
                <Input name="hora_apertura" type="time" className="h-9" defaultValue={config?.hora_apertura ?? '08:00'} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hora cierre</Label>
                <Input name="hora_cierre" type="time" className="h-9" defaultValue={config?.hora_cierre ?? '18:00'} />
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
                  defaultValue={config?.color_primario ?? '#3B82F6'}
                />
                <span className="text-sm text-muted-foreground">Color del sistema</span>
              </div>
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
