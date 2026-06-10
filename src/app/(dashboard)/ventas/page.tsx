import { getVentas } from '@/actions/ventas';
import { getEmpleados } from '@/actions/empleados';
import { getClientes } from '@/actions/clientes';
import { getServicios } from '@/actions/servicios';
import { getProductos } from '@/actions/ventas';
import { VentasClient } from '@/components/modules/ventas/ventas-client';

export const dynamic = 'force-dynamic';

export default async function VentasPage() {
  const [ventas, empleados, clientes, servicios, productos] = await Promise.all([
    getVentas(),
    getEmpleados(),
    getClientes(),
    getServicios(),
    getProductos(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground text-sm">Registro de ventas y facturación</p>
        </div>
      </div>
      <VentasClient
        ventas={ventas}
        empleados={empleados}
        clientes={clientes}
        servicios={servicios}
        productos={productos}
      />
    </div>
  );
}
