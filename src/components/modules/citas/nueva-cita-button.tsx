'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NuevaCitaDialog } from './nueva-cita-dialog';
import type { Empleado, Cliente, Servicio } from '@/types';
import { toast } from 'sonner';

interface Props {
  empleados: Empleado[];
  clientes: Cliente[];
  servicios: Servicio[];
}

export function NuevaCitaButton({ empleados, clientes, servicios }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" className="gap-2">
        <Plus className="w-4 h-4" /> Nueva cita
      </Button>
      <NuevaCitaDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          toast.success('Cita creada');
          setOpen(false);
        }}
        empleados={empleados}
        clientes={clientes}
        servicios={servicios}
      />
    </>
  );
}
