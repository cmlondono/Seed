import { getConfiguracion } from '@/actions/configuracion';
import { ConfiguracionClient } from '@/components/modules/configuracion/configuracion-client';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const config = await getConfiguracion();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground text-sm">Datos del negocio y parámetros del sistema</p>
      </div>
      <ConfiguracionClient config={config} />
    </div>
  );
}
