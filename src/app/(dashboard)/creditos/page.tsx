import { getCreditos } from '@/actions/creditos';
import { getClientes } from '@/actions/clientes';
import { getEmpleados } from '@/actions/empleados';
import { CreditosClient } from '@/components/modules/creditos/creditos-client';

export const dynamic = 'force-dynamic';

export default async function CreditosPage() {
  const [creditos, clientes, empleados] = await Promise.all([
    getCreditos(),
    getClientes(),
    getEmpleados(),
  ]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Créditos</h1>
        <p className="text-muted-foreground text-sm">Gestiona ventas diferidas y cobros en cuotas</p>
      </div>
      <CreditosClient creditos={creditos} clientes={clientes} empleados={empleados} />
    </div>
  );
}
