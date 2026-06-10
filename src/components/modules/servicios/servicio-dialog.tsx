'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createServicio, updateServicio } from '@/actions/servicios';
import type { Servicio } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  duracion_minutos: z.number().int().min(5, 'Mín 5 min').max(480, 'Máx 8h'),
  precio: z.number().min(0, 'Precio inválido'),
  activo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  servicio: Servicio | null;
  onClose: () => void;
  onSaved: (s: Servicio) => void;
}

export function ServicioDialog({ open, servicio, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!servicio;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', descripcion: '', duracion_minutos: 60, precio: 0, activo: true },
  });

  useEffect(() => {
    if (servicio) {
      form.reset({ nombre: servicio.nombre, descripcion: servicio.descripcion ?? '', duracion_minutos: servicio.duracion_minutos, precio: servicio.precio, activo: servicio.activo });
    } else {
      form.reset({ nombre: '', descripcion: '', duracion_minutos: 60, precio: 0, activo: true });
    }
  }, [servicio, open, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.set(k, String(v)));

    let result;
    if (isEdit && servicio) {
      result = await updateServicio(servicio.id, null, fd);
    } else {
      result = await createServicio(null, fd);
    }

    setLoading(false);
    if (result.error) { toast.error(result.error); return; }

    toast.success(isEdit ? 'Servicio actualizado' : 'Servicio creado');
    onSaved({ ...data, id: servicio?.id ?? crypto.randomUUID(), created_at: '', updated_at: '' } as Servicio);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre *</Label>
            <Input className="h-8 text-sm" {...form.register('nombre')} />
            {form.formState.errors.nombre && <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Descripción</Label>
            <Textarea className="text-sm resize-none" rows={2} {...form.register('descripcion')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Duración (min) *</Label>
              <Input type="number" min={5} className="h-8 text-sm" {...form.register('duracion_minutos', { valueAsNumber: true })} />
              {form.formState.errors.duracion_minutos && <p className="text-xs text-destructive">{form.formState.errors.duracion_minutos.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Precio *</Label>
              <Input type="number" min={0} className="h-8 text-sm" {...form.register('precio', { valueAsNumber: true })} />
              {form.formState.errors.precio && <p className="text-xs text-destructive">{form.formState.errors.precio.message}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.watch('activo')} onCheckedChange={(v) => form.setValue('activo', v)} />
            <Label className="text-sm">Activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
