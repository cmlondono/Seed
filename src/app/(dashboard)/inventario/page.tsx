import { getInventario, getCategorias } from '@/actions/inventario';
import { InventarioClient } from '@/components/modules/inventario/inventario-client';

export const dynamic = 'force-dynamic';

export default async function InventarioPage() {
  const [inventario, categorias] = await Promise.all([getInventario(), getCategorias()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
        <p className="text-muted-foreground text-sm">Control de stock y movimientos</p>
      </div>
      <InventarioClient inventario={inventario} categorias={categorias} />
    </div>
  );
}
