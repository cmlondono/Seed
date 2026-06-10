'use client';

import { useState } from 'react';
import type { Venta } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Eye, Search, Receipt } from 'lucide-react';

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  mixto: 'Mixto',
};

interface Props {
  ventas: Venta[];
  onSelect: (venta: Venta) => void;
}

export function VentasTable({ ventas, onSelect }: Props) {
  const [search, setSearch] = useState('');

  const filtered = ventas.filter((v) => {
    const q = search.toLowerCase();
    return (
      !q ||
      v.cliente?.nombre?.toLowerCase().includes(q) ||
      v.empleado?.nombre?.toLowerCase().includes(q) ||
      String(v.numero_factura).includes(q)
    );
  });

  return (
    <Card className="border-0 shadow-sm">
      <div className="p-4 border-b">
        <div className="relative max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
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
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">#</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Fecha</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Cliente</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Empleado</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Método</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Total</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Sin ventas registradas
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs">#{v.numero_factura}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{formatDateTime(v.created_at)}</td>
                  <td className="py-3 px-4">
                    {v.cliente ? `${v.cliente.nombre} ${v.cliente.apellido ?? ''}` : <span className="text-muted-foreground">Sin cliente</span>}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {v.empleado?.nombre} {v.empleado?.apellido}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary" className="text-xs">{METODO_LABELS[v.metodo_pago]}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">{formatCurrency(v.total)}</td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="icon" onClick={() => onSelect(v)} className="h-7 w-7">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
