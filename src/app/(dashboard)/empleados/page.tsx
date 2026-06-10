import { getEmpleados } from '@/actions/empleados';
import { getServicios } from '@/actions/servicios';
import { EmpleadosClient } from '@/components/modules/empleados/empleados-client';

export const dynamic = 'force-dynamic';

export default async function EmpleadosPage() {
  const [empleados, servicios] = await Promise.all([getEmpleados(), getServicios()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Empleados</h1>
        <p className="text-muted-foreground text-sm">Gestión de personal, horarios y servicios</p>
      </div>
      <EmpleadosClient empleados={empleados} servicios={servicios} />
    </div>
  );
}
