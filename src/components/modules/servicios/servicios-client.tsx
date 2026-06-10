'use client';

import { useState } from 'react';
import type { Servicio } from '@/types';
import { ServicioDialog } from './servicio-dialog';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Clock, DollarSign, Scissors } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { deleteServicio, toggleServicio } from '@/actions/servicios';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props { servicios: Servicio[] }

export function ServiciosClient({ servicios: initial }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>(initial);
  const [selected, setSelected] = useState<Servicio | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const handleToggle = async (id: string, activo: boolean) => {
    const result = await toggleServicio(id, activo);
    if (result.error) { toast.error(result.error); return; }
    setServicios((prev) => prev.map((s) => (s.id === id ? { ...s, activo } : s)));
  };

  const handleDelete = async (id: string) => {
    const result = await deleteServicio(id);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Servicio eliminado');
    setServicios((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setOpenNew(true)}>
          <Plus className="w-4 h-4" /> Nuevo servicio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {servicios.map((s) => (
          <Card key={s.id} className={`border-0 shadow-sm p-4 space-y-3 ${!s.activo ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{s.nombre}</p>
                  {s.descripcion && <p className="text-xs text-muted-foreground truncate max-w-32">{s.descripcion}</p>}
                </div>
              </div>
              <Switch checked={s.activo} onCheckedChange={(v) => handleToggle(s.id, v)} />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{s.duracion_minutos} min</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                {formatCurrency(s.precio)}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" onClick={() => setSelected(s)}>
                <Edit className="w-3 h-3" /> Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 w-7 p-0 text-destructive hover:text-destructive')}>
                  <Trash2 className="w-3 h-3" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
                    <AlertDialogDescription>Se eliminará &quot;{s.nombre}&quot; permanentemente.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}

        {servicios.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
            No hay servicios creados
          </div>
        )}
      </div>

      <ServicioDialog
        open={openNew || !!selected}
        servicio={selected}
        onClose={() => { setOpenNew(false); setSelected(null); }}
        onSaved={(s) => {
          if (selected) {
            setServicios((prev) => prev.map((x) => (x.id === s.id ? s : x)));
          } else {
            setServicios((prev) => [s, ...prev]);
          }
          setOpenNew(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
