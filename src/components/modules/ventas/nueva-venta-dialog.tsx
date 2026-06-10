'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createVenta } from '@/actions/ventas';
import { createCredito } from '@/actions/creditos';
import type { Empleado, Cliente, Servicio, Producto, Venta } from '@/types';
import { format, addMonths } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const detalleSchema = z.object({
  tipo: z.enum(['producto', 'servicio']),
  producto_id: z.string().optional().nullable(),
  servicio_id: z.string().optional().nullable(),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precio_unitario: z.number().min(0),
  descuento: z.number().min(0),
});

const schema = z.object({
  empleado_id: z.string().uuid('Selecciona empleado'),
  cliente_id: z.string().optional().nullable(),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta', 'mixto', 'credito']),
  descuento: z.number().min(0),
  notas: z.string().optional(),
  detalles: z.array(detalleSchema).min(1, 'Agrega al menos un item'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (venta: Venta) => void;
  empleados: Empleado[];
  clientes: Cliente[];
  servicios: Servicio[];
  productos: Producto[];
}

export function NuevaVentaDialog({ open, onClose, onCreated, empleados, clientes, servicios, productos }: Props) {
  const [loading, setLoading] = useState(false);
  const [numCuotas, setNumCuotas] = useState(3);
  const [fechaPrimeraCuota, setFechaPrimeraCuota] = useState('');

  useEffect(() => {
    setFechaPrimeraCuota(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      metodo_pago: 'efectivo',
      descuento: 0,
      detalles: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'detalles' });

  const detalles = form.watch('detalles');
  const descuento = form.watch('descuento') || 0;

  const subtotal = detalles.reduce((s, d) => s + ((d.precio_unitario || 0) * (d.cantidad || 1) - (d.descuento || 0)), 0);
  const total = Math.max(0, subtotal - descuento);

  const addServicio = () => {
    append({ tipo: 'servicio', servicio_id: null, producto_id: null, descripcion: '', cantidad: 1, precio_unitario: 0, descuento: 0 });
  };

  const addProducto = () => {
    append({ tipo: 'producto', producto_id: null, servicio_id: null, descripcion: '', cantidad: 1, precio_unitario: 0, descuento: 0 });
  };

  const handleServicioSelect = (index: number, id: string) => {
    const s = servicios.find((sv) => sv.id === id);
    if (s) {
      form.setValue(`detalles.${index}.descripcion`, s.nombre);
      form.setValue(`detalles.${index}.precio_unitario`, s.precio);
      form.setValue(`detalles.${index}.servicio_id`, id);
    }
  };

  const handleProductoSelect = (index: number, id: string) => {
    const p = productos.find((pd) => pd.id === id);
    if (p) {
      form.setValue(`detalles.${index}.descripcion`, p.nombre);
      form.setValue(`detalles.${index}.precio_unitario`, p.precio);
      form.setValue(`detalles.${index}.producto_id`, id);
    }
  };

  const metodoPago = form.watch('metodo_pago');
  const empleadoId = form.watch('empleado_id');
  const clienteId = form.watch('cliente_id');
  const montoCuota = metodoPago === 'credito' && numCuotas > 0
    ? parseFloat((total / numCuotas).toFixed(2))
    : 0;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const result = await createVenta({
      ...data,
      cliente_id: data.cliente_id || undefined,
      detalles: data.detalles.map((d) => ({
        ...d,
        producto_id: d.producto_id || undefined,
        servicio_id: d.servicio_id || undefined,
      })),
    });

    if (result.error) {
      setLoading(false);
      toast.error(result.error);
      return;
    }

    if (data.metodo_pago === 'credito' && result.ventaId) {
      const creditoResult = await createCredito({
        venta_id: result.ventaId,
        cliente_id: clienteId || undefined,
        empleado_id: empleadoId,
        total_credito: total,
        numero_cuotas: numCuotas,
        fecha_primera_cuota: fechaPrimeraCuota,
      });
      if (creditoResult.error) {
        toast.error(`Venta creada pero error en crédito: ${creditoResult.error}`);
      } else {
        toast.success('Venta y plan de crédito registrados');
      }
    } else {
      toast.success('Venta registrada');
    }

    setLoading(false);
    form.reset();
    onCreated({ id: result.ventaId } as Venta);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Empleado *</Label>
              <Select onValueChange={(v) => form.setValue('empleado_id', v as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.filter((e) => e.activo).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.empleado_id && (
                <p className="text-xs text-destructive">{form.formState.errors.empleado_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select onValueChange={(v) => form.setValue('cliente_id', (v as string) === 'none' ? null : v as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre} {c.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Método de pago</Label>
            <Select defaultValue="efectivo" onValueChange={(v) => form.setValue('metodo_pago', v as FormData['metodo_pago'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[['efectivo', 'Efectivo'], ['transferencia', 'Transferencia'], ['tarjeta', 'Tarjeta'], ['mixto', 'Mixto'], ['credito', 'Crédito / Cuotas']].map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={addServicio} className="text-xs h-7">
                  <Plus className="w-3 h-3 mr-1" /> Servicio
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addProducto} className="text-xs h-7">
                  <Plus className="w-3 h-3 mr-1" /> Producto
                </Button>
              </div>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Agrega servicios o productos</p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase">{field.tipo}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>

                {field.tipo === 'servicio' ? (
                  <Select onValueChange={(v) => handleServicioSelect(index, v as string)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.filter((s) => s.activo).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre} — {formatCurrency(s.precio)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select onValueChange={(v) => handleProductoSelect(index, v as string)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.filter((p) => p.activo).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre} — {formatCurrency(p.precio)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Cantidad</Label>
                    <Input type="number" min={1} className="h-8 text-sm" {...form.register(`detalles.${index}.cantidad`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label className="text-xs">Precio</Label>
                    <Input type="number" min={0} className="h-8 text-sm" {...form.register(`detalles.${index}.precio_unitario`, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <Label className="text-xs">Descuento</Label>
                    <Input type="number" min={0} className="h-8 text-sm" {...form.register(`detalles.${index}.descuento`, { valueAsNumber: true })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Configurador de crédito */}
          {metodoPago === 'credito' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Plan de crédito</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Número de cuotas</Label>
                  <Input
                    type="number"
                    min={1}
                    max={48}
                    value={numCuotas}
                    onChange={(e) => setNumCuotas(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fecha primera cuota</Label>
                  <Input
                    type="date"
                    value={fechaPrimeraCuota}
                    onChange={(e) => setFechaPrimeraCuota(e.target.value)}
                    className="h-8 text-sm"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
              {total > 0 && numCuotas > 0 && (
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {numCuotas} cuota{numCuotas > 1 ? 's' : ''} de <strong>{formatCurrency(montoCuota)}</strong> · Total: <strong>{formatCurrency(total)}</strong>
                </p>
              )}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Descuento general</Label>
              <Input
                type="number"
                min={0}
                className="h-8 w-32 text-sm text-right"
                {...form.register('descuento', { valueAsNumber: true })}
              />
            </div>

            <div className="rounded-lg bg-muted/40 p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="text-red-500">-{formatCurrency(descuento)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Registrar venta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
