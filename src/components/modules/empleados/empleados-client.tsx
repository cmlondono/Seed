'use client';

import { useState } from 'react';
import type { Empleado, Servicio } from '@/types';
import { EmpleadoCard } from './empleado-card';
import { EmpleadoDialog } from './empleado-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Props {
  empleados: Empleado[];
  servicios: Servicio[];
}

export function EmpleadosClient({ empleados: initial, servicios }: Props) {
  const [empleados, setEmpleados] = useState<Empleado[]>(initial);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Empleado | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const filtered = empleados.filter((e) => {
    const q = search.toLowerCase();
    return !q || `${e.nombre} ${e.apellido} ${e.cargo}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empleado..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={() => setOpenNew(true)} className="gap-2 ml-auto">
          <Plus className="w-4 h-4" /> Nuevo empleado
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp) => (
          <EmpleadoCard
            key={emp.id}
            empleado={emp}
            onEdit={() => setSelected(emp)}
            onUpdate={(updated) =>
              setEmpleados((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
            }
            onDelete={(id) => setEmpleados((prev) => prev.filter((e) => e.id !== id))}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
            No se encontraron empleados
          </div>
        )}
      </div>

      <EmpleadoDialog
        open={openNew || !!selected}
        empleado={selected}
        servicios={servicios}
        onClose={() => { setOpenNew(false); setSelected(null); }}
        onSaved={(emp) => {
          if (selected) {
            setEmpleados((prev) => prev.map((e) => (e.id === emp.id ? emp : e)));
          } else {
            setEmpleados((prev) => [emp, ...prev]);
          }
          setOpenNew(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
