'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createEmpleado, updateEmpleado, updateServiciosEmpleado, updateHorariosEmpleado } from '@/actions/empleados';
import type { Empleado, Servicio } from '@/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  nombre: z.string().min(1, 'Requerido'),
  apellido: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  cargo: z.string().min(1, 'Requerido'),
  color_calendario: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  activo: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const DIAS = [
  { dia: 1, label: 'Lunes' }, { dia: 2, label: 'Martes' }, { dia: 3, label: 'Miércoles' },
  { dia: 4, label: 'Jueves' }, { dia: 5, label: 'Viernes' }, { dia: 6, label: 'Sábado' },
  { dia: 0, label: 'Domingo' },
];

const PRESET_COLORS = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#EF4444','#6366F1','#14B8A6'];

interface Props {
  open: boolean;
  empleado: Empleado | null;
  servicios: Servicio[];
  onClose: () => void;
  onSaved: (e: Empleado) => void;
}

export function EmpleadoDialog({ open, empleado, servicios, onClose, onSaved }: Props) {
  const isEdit = !!empleado;
  const [loading, setLoading] = useState(false);
  const [selectedServicios, setSelectedServicios] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<Record<number, { hora_inicio: string; hora_fin: string; activo: boolean }>>(
    Object.fromEntries(DIAS.map((d) => [d.dia, { hora_inicio: '08:00', hora_fin: '18:00', activo: d.dia !== 0 }]))
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '', apellido: '', email: '', telefono: '', cargo: 'Empleado',
      color_calendario: '#3B82F6', activo: true,
    },
  });

  useEffect(() => {
    if (empleado) {
      form.reset({
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        email: empleado.email,
        telefono: empleado.telefono ?? '',
        cargo: empleado.cargo,
        color_calendario: empleado.color_calendario,
        activo: empleado.activo,
      });
      setSelectedServicios(empleado.servicios?.map((s) => s.id) ?? []);
      if (empleado.horarios?.length) {
        const h = { ...horarios };
        for (const hor of empleado.horarios) {
          h[hor.dia_semana] = { hora_inicio: hor.hora_inicio, hora_fin: hor.hora_fin, activo: hor.activo };
        }
        setHorarios(h);
      }
    } else {
      form.reset({ nombre: '', apellido: '', email: '', cargo: 'Empleado', color_calendario: '#3B82F6', activo: true });
      setSelectedServicios([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleado, open]);

  const toggleServicio = (id: string) => {
    setSelectedServicios((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.set(k, String(v)));

    let result;
    let savedId: string;

    if (isEdit && empleado) {
      result = await updateEmpleado(empleado.id, null, formData);
      savedId = empleado.id;
    } else {
      result = await createEmpleado(null, formData);
      savedId = (result as { data?: { id: string } }).data?.id ?? '';
    }

    if (result.error) { setLoading(false); toast.error(result.error); return; }

    await Promise.all([
      updateServiciosEmpleado(savedId, selectedServicios),
      updateHorariosEmpleado(savedId, DIAS.map((d) => ({
        empleado_id: savedId,
        dia_semana: d.dia,
        hora_inicio: horarios[d.dia].hora_inicio,
        hora_fin: horarios[d.dia].hora_fin,
        activo: horarios[d.dia].activo,
      }))),
    ]);

    setLoading(false);
    toast.success(isEdit ? 'Empleado actualizado' : 'Empleado creado');
    onSaved({ ...data, id: savedId, servicios: servicios.filter((s) => selectedServicios.includes(s.id)) } as Empleado);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar empleado' : 'Nuevo empleado'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="info" className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Información</TabsTrigger>
              <TabsTrigger value="servicios" className="flex-1">Servicios</TabsTrigger>
              <TabsTrigger value="horarios" className="flex-1">Horarios</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre *</Label>
                  <Input className="h-8 text-sm" {...form.register('nombre')} />
                  {form.formState.errors.nombre && <p className="text-xs text-destructive">{form.formState.errors.nombre.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Apellido *</Label>
                  <Input className="h-8 text-sm" {...form.register('apellido')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input type="email" className="h-8 text-sm" {...form.register('email')} />
                {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Teléfono</Label>
                  <Input className="h-8 text-sm" {...form.register('telefono')} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cargo *</Label>
                  <Input className="h-8 text-sm" {...form.register('cargo')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Color en calendario</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => form.setValue('color_calendario', c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${form.watch('color_calendario') === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <Input
                    type="color"
                    className="w-7 h-7 p-0 rounded-full border-0 cursor-pointer"
                    {...form.register('color_calendario')}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={form.watch('activo')}
                  onCheckedChange={(v) => form.setValue('activo', v)}
                />
                <Label className="text-sm">Activo</Label>
              </div>
            </TabsContent>

            <TabsContent value="servicios" className="space-y-2">
              <p className="text-xs text-muted-foreground">Servicios que puede prestar este empleado</p>
              <div className="space-y-2">
                {servicios.filter((s) => s.activo).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40">
                    <Checkbox
                      id={`svc-${s.id}`}
                      checked={selectedServicios.includes(s.id)}
                      onCheckedChange={() => toggleServicio(s.id)}
                    />
                    <label htmlFor={`svc-${s.id}`} className="flex-1 text-sm cursor-pointer">
                      <span className="font-medium">{s.nombre}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{s.duracion_minutos}min</span>
                    </label>
                  </div>
                ))}
                {servicios.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">No hay servicios activos</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="horarios" className="space-y-2">
              <p className="text-xs text-muted-foreground">Configura el horario semanal</p>
              {DIAS.map(({ dia, label }) => (
                <div key={dia} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <Switch
                    checked={horarios[dia].activo}
                    onCheckedChange={(v) => setHorarios((h) => ({ ...h, [dia]: { ...h[dia], activo: v } }))}
                  />
                  <span className="w-20 text-sm font-medium">{label}</span>
                  <Input
                    type="time"
                    value={horarios[dia].hora_inicio}
                    onChange={(e) => setHorarios((h) => ({ ...h, [dia]: { ...h[dia], hora_inicio: e.target.value } }))}
                    disabled={!horarios[dia].activo}
                    className="h-7 w-24 text-xs"
                  />
                  <span className="text-muted-foreground text-xs">—</span>
                  <Input
                    type="time"
                    value={horarios[dia].hora_fin}
                    onChange={(e) => setHorarios((h) => ({ ...h, [dia]: { ...h[dia], hora_fin: e.target.value } }))}
                    disabled={!horarios[dia].activo}
                    className="h-7 w-24 text-xs"
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
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
