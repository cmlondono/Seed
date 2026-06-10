'use client';

import { useState } from 'react';
import type { Venta, Empleado, Cliente, Servicio, Producto } from '@/types';
import { NuevaVentaDialog } from './nueva-venta-dialog';
import { VentaDetailDialog } from './venta-detail-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { VentasTable } from './ventas-table';

interface Props {
  ventas: Venta[];
  empleados: Empleado[];
  clientes: Cliente[];
  servicios: Servicio[];
  productos: Producto[];
}

export function VentasClient({ ventas: initialVentas, empleados, clientes, servicios, productos }: Props) {
  const [ventas, setVentas] = useState<Venta[]>(initialVentas);
  const [openNueva, setOpenNueva] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpenNueva(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Nueva venta
        </Button>
      </div>

      <VentasTable
        ventas={ventas}
        onSelect={setSelectedVenta}
      />

      <NuevaVentaDialog
        open={openNueva}
        onClose={() => setOpenNueva(false)}
        onCreated={(venta) => {
          setVentas((prev) => [venta, ...prev]);
          setOpenNueva(false);
        }}
        empleados={empleados}
        clientes={clientes}
        servicios={servicios}
        productos={productos}
      />

      {selectedVenta && (
        <VentaDetailDialog
          venta={selectedVenta}
          open={!!selectedVenta}
          onClose={() => setSelectedVenta(null)}
        />
      )}
    </div>
  );
}
