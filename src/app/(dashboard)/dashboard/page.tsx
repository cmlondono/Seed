import { getDashboardStats, getVentasPorDia, getServiciosTop } from '@/actions/dashboard';
import { getCitas } from '@/actions/citas';
import { getInventarioBajoStock } from '@/actions/inventario';
import { StatsCards } from '@/components/modules/dashboard/stats-cards';
import { VentasChart } from '@/components/modules/dashboard/ventas-chart';
import { CitasHoy } from '@/components/modules/dashboard/citas-hoy';
import { ServiciosTopChart } from '@/components/modules/dashboard/servicios-top-chart';
import { AlertasStock } from '@/components/modules/dashboard/alertas-stock';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const hoy = format(new Date(), 'yyyy-MM-dd');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('role, negocio_id').eq('id', user!.id).single();
  const isAdmin = profile?.role === 'admin';

  const { data: negocio } = profile?.negocio_id
    ? await supabase.from('negocios').select('nombre').eq('id', profile.negocio_id).single()
    : { data: null };

  let empleadoId: string | undefined;
  if (!isAdmin) {
    const { data: emp } = await supabase.from('empleados').select('id').eq('profile_id', user!.id).single();
    empleadoId = emp?.id;
  }

  const [stats, ventasPorDia, serviciosTop, citasHoy, bajoStock] = await Promise.all([
    getDashboardStats(),
    isAdmin ? getVentasPorDia(30) : Promise.resolve([]),
    isAdmin ? getServiciosTop() : Promise.resolve([]),
    getCitas({ fecha: hoy, ...(empleadoId ? { empleado_id: empleadoId } : {}) }),
    getInventarioBajoStock(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </p>
          {negocio?.nombre && (
            <>
              <span className="text-muted-foreground/40 text-sm">·</span>
              <p className="text-sm font-medium text-foreground">{negocio.nombre}</p>
            </>
          )}
        </div>
      </div>

      <StatsCards stats={stats} isAdmin={isAdmin} />

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <VentasChart data={ventasPorDia} />
          </div>
          <div>
            <ServiciosTopChart data={serviciosTop} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CitasHoy citas={citasHoy} />
        <AlertasStock items={bajoStock} />
      </div>
    </div>
  );
}
