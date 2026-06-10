'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createCita } from '@/actions/citas';
import { getDisponibilidadEmpleado } from '@/actions/empleados';
import type { Empleado, Cliente, Servicio, Cita } from '@/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({
  cliente_id: z.string().uuid('Selecciona un cliente'),
  empleado_id: z.string().uuid('Selecciona un empleado'),
  servicio_id: z.string().uuid('Selecciona un servicio'),
  fecha: z.string().min(1, 'Fecha requerida'),
  hora_inicio: z.string().min(1, 'Hora requerida'),
  notas: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  defaultFecha?: string;
  onClose: () => void;
  onCreated: (cita: Cita) => void;
  empleados: Empleado[];
  clientes: Cliente[];
  servicios: Servicio[];
}

export function NuevaCitaDialog({ open, defaultFecha, onClose, onCreated, empleados, clientes, servicios }: Props) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fecha: defaultFecha ?? '', notas: '' },
  });

  const watchEmpleado = form.watch('empleado_id');
  const watchServicio = form.watch('servicio_id');
  const watchFecha = form.watch('fecha');

  const selectedServicio = servicios.find((s) => s.id === watchServicio);

  const loadSlots = async () => {
    if (!watchEmpleado || !watchServicio || !watchFecha) return;
    const servicio = servicios.find((s) => s.id === watchServicio);
    if (!servicio) return;
    setLoadingSlots(true);
    const available = await getDisponibilidadEmpleado(watchEmpleado, watchFecha, servicio.duracion_minutos);
    setSlots(available);
    setLoadingSlots(false);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const result = await createCita(data);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Cita creada exitosamente');
    onCreated(result.data as Cita);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select onValueChange={(v) => form.setValue('cliente_id', v as string)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre} {c.apellido} {c.telefono ? `— ${c.telefono}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.cliente_id && (
              <p className="text-xs text-destructive">{form.formState.errors.cliente_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select onValueChange={(v) => { form.setValue('empleado_id', v as string); form.setValue('hora_inicio', ''); setSlots([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.filter((e) => e.activo).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre} {e.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Servicio</Label>
              <Select onValueChange={(v) => { form.setValue('servicio_id', v as string); form.setValue('hora_inicio', ''); setSlots([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.filter((s) => s.activo).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre} ({s.duracion_minutos}min — {formatCurrency(s.precio)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...form.register('fecha')}
              onChange={(e) => { form.setValue('fecha', e.target.value); setSlots([]); form.setValue('hora_inicio', ''); }}
            />
          </div>

          {watchEmpleado && watchServicio && watchFecha && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Hora disponible</Label>
                <Button type="button" variant="ghost" size="sm" onClick={loadSlots} disabled={loadingSlots}>
                  {loadingSlots ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Ver horarios'}
                </Button>
              </div>
              {slots.length > 0 ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => form.setValue('hora_inicio', slot)}
                      className={`py-1.5 text-xs rounded border transition-colors ${
                        form.watch('hora_inicio') === slot
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-accent border-border'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : slots.length === 0 && !loadingSlots && (
                <p className="text-xs text-muted-foreground">Haz clic en &quot;Ver horarios&quot; para cargar disponibilidad</p>
              )}
              {form.formState.errors.hora_inicio && (
                <p className="text-xs text-destructive">{form.formState.errors.hora_inicio.message}</p>
              )}
            </div>
          )}

          {selectedServicio && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="text-muted-foreground">
                Duración: <span className="font-medium text-foreground">{selectedServicio.duracion_minutos} min</span> ·
                Precio: <span className="font-medium text-foreground">{formatCurrency(selectedServicio.precio)}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea {...form.register('notas')} rows={2} placeholder="Observaciones..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Crear cita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
