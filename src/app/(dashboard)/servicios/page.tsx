import { getServicios } from '@/actions/servicios';
import { ServiciosClient } from '@/components/modules/servicios/servicios-client';

export const dynamic = 'force-dynamic';

export default async function ServiciosPage() {
  const servicios = await getServicios();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
        <p className="text-muted-foreground text-sm">Catálogo de servicios ofrecidos</p>
      </div>
      <ServiciosClient servicios={servicios} />
    </div>
  );
}
