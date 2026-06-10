'use client';

import { useState, useTransition } from 'react';
import { getReporteVentas, getReporteCitas } from '@/actions/dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatTime, getEstadoColor, getEstadoLabel } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { FileText, TrendingUp, CalendarDays, Loader2 } from 'lucide-react';
import type { Venta, Cita } from '@/types';

type ReporteVentas = Awaited<ReturnType<typeof getReporteVentas>>;
type ReporteCitas = Awaited<ReturnType<typeof getReporteCitas>>;

const PRESETS = [
  { label: 'Hoy', desde: format(new Date(), 'yyyy-MM-dd'), hasta: format(new Date(), 'yyyy-MM-dd') },
  { label: 'Últimos 7 días', desde: format(subDays(new Date(), 7), 'yyyy-MM-dd'), hasta: format(new Date(), 'yyyy-MM-dd') },
  { label: 'Este mes', desde: format(startOfMonth(new Date()), 'yyyy-MM-dd'), hasta: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'Últimos 30 días', desde: format(subDays(new Date(), 30), 'yyyy-MM-dd'), hasta: format(new Date(), 'yyyy-MM-dd') },
];

export function ReportesClient() {
  const [desde, setDesde] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [hasta, setHasta] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reporteVentas, setReporteVentas] = useState<ReporteVentas | null>(null);
  const [reporteCitas, setReporteCitas] = useState<ReporteCitas | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchReportes = () => {
    startTransition(async () => {
      const [rv, rc] = await Promise.all([
        getReporteVentas(desde, hasta),
        getReporteCitas(desde, hasta),
      ]);
      setReporteVentas(rv);
      setReporteCitas(rc);
    });
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setDesde(preset.desde);
    setHasta(preset.hasta);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => applyPreset(p)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Desde</Label>
                <Input type="date" className="h-8 text-xs" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hasta</Label>
                <Input type="date" className="h-8 text-xs" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </div>
              <Button size="sm" onClick={fetchReportes} disabled={isPending} className="h-8 gap-2">
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                Generar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!reporteVentas && !reporteCitas && (
        <div className="py-16 text-center text-muted-foreground text-sm">
          Selecciona un rango de fechas y haz clic en Generar
        </div>
      )}

      {(reporteVentas || reporteCitas) && (
        <Tabs defaultValue="ventas">
          <TabsList>
            <TabsTrigger value="ventas" className="gap-2">
              <TrendingUp className="w-3.5 h-3.5" /> Ventas
            </TabsTrigger>
            <TabsTrigger value="citas" className="gap-2">
              <CalendarDays className="w-3.5 h-3.5" /> Citas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ventas" className="space-y-4">
            {reporteVentas && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Ingresos', value: formatCurrency(reporteVentas.totales.ingresos) },
                    { label: 'Ventas', value: reporteVentas.totales.cantidad },
                    { label: 'Ticket promedio', value: formatCurrency(reporteVentas.totales.ticket_promedio) },
                  ].map((k) => (
                    <Card key={k.label} className="border-0 shadow-sm">
                      <CardHeader className="pb-1 pt-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-xl font-bold">{k.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Table */}
                <Card className="border-0 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">#</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Fecha</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Cliente</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Empleado</th>
                          <th className="text-right py-2 px-4 text-xs font-medium text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteVentas.data.length === 0 ? (
                          <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">Sin ventas en este período</td></tr>
                        ) : (
                          (reporteVentas.data as Venta[]).map((v) => (
                            <tr key={v.id} className="border-b hover:bg-muted/20">
                              <td className="py-2 px-4 font-mono text-xs">#{v.numero_factura}</td>
                              <td className="py-2 px-4 text-xs text-muted-foreground">{formatDate(v.created_at)}</td>
                              <td className="py-2 px-4 text-xs">{(v.cliente as { nombre: string })?.nombre ?? '—'}</td>
                              <td className="py-2 px-4 text-xs">{(v.empleado as { nombre: string; apellido: string })?.nombre} {(v.empleado as { nombre: string; apellido: string })?.apellido}</td>
                              <td className="py-2 px-4 text-right font-medium">{formatCurrency(v.total)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="citas" className="space-y-4">
            {reporteCitas && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total citas', value: reporteCitas.totales.total },
                    { label: 'Completadas', value: reporteCitas.totales.completadas },
                    { label: 'Canceladas', value: reporteCitas.totales.canceladas },
                    { label: 'Ingresos', value: formatCurrency(reporteCitas.totales.ingresos) },
                  ].map((k) => (
                    <Card key={k.label} className="border-0 shadow-sm">
                      <CardHeader className="pb-1 pt-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <p className="text-xl font-bold">{k.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-0 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Fecha</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Cliente</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Servicio</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Empleado</th>
                          <th className="text-left py-2 px-4 text-xs font-medium text-muted-foreground">Estado</th>
                          <th className="text-right py-2 px-4 text-xs font-medium text-muted-foreground">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteCitas.data.length === 0 ? (
                          <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">Sin citas en este período</td></tr>
                        ) : (
                          (reporteCitas.data as Cita[]).map((c) => (
                            <tr key={c.id} className="border-b hover:bg-muted/20">
                              <td className="py-2 px-4 text-xs">
                                {formatDate(c.fecha)} {formatTime(c.hora_inicio)}
                              </td>
                              <td className="py-2 px-4 text-xs">{(c.cliente as { nombre: string })?.nombre}</td>
                              <td className="py-2 px-4 text-xs">{(c.servicio as { nombre: string })?.nombre}</td>
                              <td className="py-2 px-4 text-xs">{(c.empleado as { nombre: string; apellido: string })?.nombre} {(c.empleado as { nombre: string; apellido: string })?.apellido}</td>
                              <td className="py-2 px-4">
                                <Badge variant="outline" className={`text-xs ${getEstadoColor(c.estado)}`}>
                                  {getEstadoLabel(c.estado)}
                                </Badge>
                              </td>
                              <td className="py-2 px-4 text-right text-xs font-medium">{formatCurrency(c.precio)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
