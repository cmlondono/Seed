import { getClientes } from '@/actions/clientes';
import { ClientesClient } from '@/components/modules/clientes/clientes-client';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground text-sm">Directorio y historial de clientes</p>
      </div>
      <ClientesClient clientes={clientes} />
    </div>
  );
}
