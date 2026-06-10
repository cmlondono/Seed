import { ReportesClient } from '@/components/modules/reportes/reportes-client';

export const dynamic = 'force-dynamic';

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground text-sm">Análisis de citas, ventas e inventario</p>
      </div>
      <ReportesClient />
    </div>
  );
}
