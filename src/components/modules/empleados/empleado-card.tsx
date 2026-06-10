'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { deleteEmpleado } from '@/actions/empleados';
import type { Empleado } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Edit, Trash2, Mail, Phone } from 'lucide-react';

interface Props {
  empleado: Empleado;
  onEdit: () => void;
  onUpdate: (e: Empleado) => void;
  onDelete: (id: string) => void;
}

export function EmpleadoCard({ empleado, onEdit, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteEmpleado(empleado.id);
    setDeleting(false);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Empleado eliminado');
    onDelete(empleado.id);
  };

  const initials = `${empleado.nombre[0]}${empleado.apellido[0]}`.toUpperCase();

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: empleado.color_calendario }}
            >
              {initials}
            </div>
            <div>
              <p className="font-semibold text-sm">{empleado.nombre} {empleado.apellido}</p>
              <p className="text-xs text-muted-foreground">{empleado.cargo}</p>
            </div>
          </div>
          <Badge variant={empleado.activo ? 'default' : 'secondary'} className="text-xs">
            {empleado.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="space-y-1.5">
          {empleado.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3 h-3" /> {empleado.email}
            </div>
          )}
          {empleado.telefono && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" /> {empleado.telefono}
            </div>
          )}
        </div>

        {empleado.servicios && empleado.servicios.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {empleado.servicios.slice(0, 3).map((s) => (
              <Badge key={s.id} variant="secondary" className="text-xs">{s.nombre}</Badge>
            ))}
            {empleado.servicios.length > 3 && (
              <Badge variant="secondary" className="text-xs">+{empleado.servicios.length - 3}</Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 h-7 text-xs gap-1">
            <Edit className="w-3 h-3" /> Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 w-7 p-0 text-destructive hover:text-destructive')}>
              <Trash2 className="w-3 h-3" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará a {empleado.nombre} {empleado.apellido} permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
