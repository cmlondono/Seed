'use client';

import { useState } from 'react';
import type { Inventario, CategoriaInventario } from '@/types';
import { InventarioTable } from './inventario-table';
import { InventarioDialog } from './inventario-dialog';
import { MovimientoDialog } from './movimiento-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Props {
  inventario: Inventario[];
  categorias: CategoriaInventario[];
}

export function InventarioClient({ inventario: initial, categorias }: Props) {
  const [inventario, setInventario] = useState<Inventario[]>(initial);
  const [selected, setSelected] = useState<Inventario | null>(null);
  const [movItem, setMovItem] = useState<Inventario | null>(null);
  const [openNew, setOpenNew] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setOpenNew(true)}>
          <Plus className="w-4 h-4" /> Nuevo item
        </Button>
      </div>

      <InventarioTable
        inventario={inventario}
        onEdit={setSelected}
        onMovimiento={setMovItem}
        onDelete={(id) => setInventario((prev) => prev.filter((i) => i.id !== id))}
        onUpdate={(item) => setInventario((prev) => prev.map((i) => (i.id === item.id ? item : i)))}
      />

      <InventarioDialog
        open={openNew || !!selected}
        item={selected}
        categorias={categorias}
        onClose={() => { setOpenNew(false); setSelected(null); }}
        onSaved={(item) => {
          if (selected) {
            setInventario((prev) => prev.map((i) => (i.id === item.id ? item : i)));
          } else {
            setInventario((prev) => [item, ...prev]);
          }
          setOpenNew(false);
          setSelected(null);
        }}
      />

      {movItem && (
        <MovimientoDialog
          open={!!movItem}
          item={movItem}
          onClose={() => setMovItem(null)}
          onSaved={(stockNuevo) => {
            setInventario((prev) => prev.map((i) => (i.id === movItem.id ? { ...i, stock_actual: stockNuevo } : i)));
            setMovItem(null);
          }}
        />
      )}
    </div>
  );
}
