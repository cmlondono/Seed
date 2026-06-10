'use client';

import type { Venta } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

// PDF must be client-side only
const FacturaPDFButton = dynamic(
  () => import('./factura-pdf').then((m) => m.FacturaPDFButton),
  { ssr: false, loading: () => <Button variant="outline" size="sm" disabled>Cargando PDF...</Button> }
);

interface Props {
  venta: Venta;
  open: boolean;
  onClose: () => void;
}

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta', mixto: 'Mixto',
};

export function VentaDetailDialog({ venta, open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Factura #{String(venta.numero_factura).padStart(4, '0')}
            <Badge variant="secondary">{METODO_LABELS[venta.metodo_pago]}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span>{formatDateTime(venta.created_at)}</span>
            </div>
            {venta.cliente && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span>{venta.cliente.nombre} {venta.cliente.apellido}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empleado</span>
              <span>{venta.empleado?.nombre} {venta.empleado?.apellido}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            {(venta.detalles ?? []).map((d) => (
              <div key={d.id} className="flex justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <span className="truncate">{d.descripcion}</span>
                  {d.cantidad > 1 && (
                    <span className="text-muted-foreground ml-1">x{d.cantidad}</span>
                  )}
                </div>
                <span className="flex-shrink-0 ml-4 font-medium">{formatCurrency(d.subtotal)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(venta.subtotal)}</span>
            </div>
            {venta.descuento > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descuento</span>
                <span className="text-red-500">-{formatCurrency(venta.descuento)}</span>
              </div>
            )}
            {venta.impuesto > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span>{formatCurrency(venta.impuesto)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1 border-t">
              <span>Total</span>
              <span>{formatCurrency(venta.total)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <FacturaPDFButton venta={venta} />
          <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
