'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { updateEstadoCita, deleteCita } from '@/actions/citas';
import type { Cita, EstadoCita } from '@/types';
import { formatCurrency, formatDate, formatTime, getEstadoColor, getEstadoLabel, cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Clock, User, Scissors, DollarSign, CalendarDays, Trash2 } from 'lucide-react';

const estados: EstadoCita[] = ['pendiente', 'confirmada', 'en_proceso', 'completada', 'cancelada', 'no_asistio'];

interface Props {
  cita: Cita;
  open: boolean;
  onClose: () => void;
  onUpdate: (cita: Cita) => void;
}

export function CitaDetailDialog({ cita, open, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);

  const handleEstadoChange = async (estado: EstadoCita) => {
    setLoading(true);
    const result = await updateEstadoCita(cita.id, estado);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Estado actualizado');
    onUpdate({ ...cita, estado });
  };

  const handleDelete = async () => {
    setLoading(true);
    const result = await deleteCita(cita.id);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Cita eliminada');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalle de cita
            <Badge variant="outline" className={getEstadoColor(cita.estado)}>
              {getEstadoLabel(cita.estado)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{cita.cliente?.nombre} {cita.cliente?.apellido}</p>
              <p className="text-xs text-muted-foreground">{cita.cliente?.telefono}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Scissors className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{cita.servicio?.nombre}</p>
              <p className="text-xs text-muted-foreground">{cita.servicio?.duracion_minutos} min</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{cita.empleado?.nombre} {cita.empleado?.apellido}</p>
              <p className="text-xs text-muted-foreground">{cita.empleado?.cargo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm">{formatDate(cita.fecha, 'EEEE, d MMMM yyyy')}</p>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm">{formatTime(cita.hora_inicio)} — {formatTime(cita.hora_fin)}</p>
          </div>

          <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm font-medium">{formatCurrency(cita.precio)}</p>
          </div>

          {cita.notas && (
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              {cita.notas}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Cambiar estado</p>
            <Select value={cita.estado} onValueChange={(v) => handleEstadoChange(v as EstadoCita)} disabled={loading}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estados.map((e) => (
                  <SelectItem key={e} value={e} className="text-sm">
                    {getEstadoLabel(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <AlertDialog>
            <AlertDialogTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-destructive hover:text-destructive')}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
                <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
