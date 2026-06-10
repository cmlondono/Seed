'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createInventario, updateInventario } from '@/actions/inventario';
import type { Inventario, CategoriaInventario } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  descripcion: z.string().optional(),
  categoria_id: z.string().optional(),
  stock_actual: z.number().min(0),
  stock_minimo: z.number().min(0),
  unidad: z.string(),
  costo_unitario: z.number().min(0),
  proveedor: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  item: Inventario | null;
  categorias: CategoriaInventario[];
  onClose: () => void;
  onSaved: (i: Inventario) => void;
}

export function InventarioDialog({ open, item, categorias, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!item;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', stock_actual: 0, stock_minimo: 0, unidad: 'unidad', costo_unitario: 0 },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        nombre: item.nombre, descripcion: item.descripcion ?? '',
        categoria_id: item.categoria_id ?? '', stock_actual: item.stock_actual,
        stock_minimo: item.stock_minimo, unidad: item.unidad,
        costo_unitario: item.costo_unitario, proveedor: item.proveedor ?? '',
      });
    } else {
      form.reset({ nombre: '', stock_actual: 0, stock_minimo: 0, unidad: 'unidad', costo_unitario: 0 });
    }
  }, [item, open, form]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.set(k, v !== undefined ? String(v) : ''));

    let result;
    if (isEdit && item) {
      result = await updateInventario(item.id, null, fd);
    } else {
      result = await createInventario(null, fd);
    }

    setLoading(false);
    if (result.error) { toast.error(result.error); return; }

    toast.success(isEdit ? 'Item actualizado' : 'Item creado');
    onSaved({ ...item, ...data, id: item?.id ?? crypto.randomUUID() } as Inventario);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar item' : 'Nuevo item'}</DialogTitle>
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
              <Label className="text-xs">Categoría</Label>
              <Select onValueChange={(v) => form.setValue('categoria_id', (v as string) === 'none' ? '' : v as string)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unidad</Label>
              <Input className="h-8 text-sm" placeholder="unidad, kg, L..." {...form.register('unidad')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Stock actual</Label>
              <Input type="number" min={0} className="h-8 text-sm" {...form.register('stock_actual', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stock mínimo</Label>
              <Input type="number" min={0} className="h-8 text-sm" {...form.register('stock_minimo', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Costo unitario</Label>
              <Input type="number" min={0} className="h-8 text-sm" {...form.register('costo_unitario', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Proveedor</Label>
            <Input className="h-8 text-sm" {...form.register('proveedor')} />
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
