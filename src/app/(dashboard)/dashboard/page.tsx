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

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const hoy = format(new Date(), 'yyyy-MM-dd');

  const [stats, ventasPorDia, serviciosTop, citasHoy, bajoStock] = await Promise.all([
    getDashboardStats(),
    getVentasPorDia(30),
    getServiciosTop(),
    getCitas({ fecha: hoy }),
    getInventarioBajoStock(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VentasChart data={ventasPorDia} />
        </div>
        <div>
          <ServiciosTopChart data={serviciosTop} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CitasHoy citas={citasHoy} />
        <AlertasStock items={bajoStock} />
      </div>
    </div>
  );
}
