'use client';

import { useState } from 'react';
import type { Credito, Cliente, Empleado } from '@/types';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye } from 'lucide-react';
import { CreditoDetailDialog } from './credito-detail-dialog';

const estadoConfig: Record<string, { label: string; className: string }> = {
  activo:    { label: 'Activo',    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  pagado:    { label: 'Pagado',    className: 'bg-green-50 text-green-700 border-green-200' },
  vencido:   { label: 'Vencido',   className: 'bg-red-50 text-red-700 border-red-200' },
  cancelado: { label: 'Cancelado', className: 'bg-gray-50 text-gray-500 border-gray-200' },
};

interface Props {
  creditos: Credito[];
  clientes: Cliente[];
  empleados: Empleado[];
}

export function CreditosClient({ creditos: initial }: Props) {
  const [creditos, setCreditos] = useState<Credito[]>(initial);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Credito | null>(null);

  const filtered = creditos.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const cliente = c.cliente;
    return (
      cliente?.nombre?.toLowerCase().includes(q) ||
      cliente?.apellido?.toLowerCase().includes(q) ||
      c.id.includes(q)
    );
  });

  const totalPendiente = creditos
    .filter((c) => c.estado === 'activo' || c.estado === 'vencido')
    .reduce((s, c) => s + c.saldo_pendiente, 0);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total créditos', value: creditos.length },
          { label: 'Activos', value: creditos.filter((c) => c.estado === 'activo').length },
          { label: 'Vencidos', value: creditos.filter((c) => c.estado === 'vencido').length },
          { label: 'Saldo total', value: formatCurrency(totalPendiente) },
        ].map((k) => (
          <Card key={k.label} className="border-0 shadow-sm p-4">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="text-xl font-bold mt-1">{k.value}</p>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <div className="p-4 border-b">
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              className="pl-9 h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden sm:table-cell">Fecha</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Cuotas</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Total</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Saldo</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Estado</th>
                <th className="py-3 px-4 w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                    No hay créditos registrados
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const cfg = estadoConfig[c.estado] ?? estadoConfig.activo;
                  return (
                    <tr key={c.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">
                          {c.cliente?.nombre} {c.cliente?.apellido}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.cliente?.telefono}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="py-3 px-4 text-xs hidden md:table-cell">
                        {c.cuotas?.filter((q) => q.estado === 'pagado').length ?? 0} / {c.numero_cuotas}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{formatCurrency(c.total_credito)}</td>
                      <td className="py-3 px-4 text-sm">{formatCurrency(c.saldo_pendiente)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={cn('text-xs', cfg.className)}>{cfg.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSelected(c)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selected && (
        <CreditoDetailDialog
          credito={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setCreditos((prev) => prev.map((c) => c.id === updated.id ? updated : c));
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
