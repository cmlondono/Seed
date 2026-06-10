'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Credito, CuotaCredito } from '@/types';
import { pagarCuota, cancelarCredito } from '@/actions/creditos';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, Clock, XCircle, User, CreditCard } from 'lucide-react';

const estadoCuotaConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pendiente: { label: 'Pendiente', icon: Clock,        className: 'text-yellow-600' },
  pagado:    { label: 'Pagado',    icon: CheckCircle2, className: 'text-green-600' },
  vencido:   { label: 'Vencido',   icon: XCircle,      className: 'text-red-600' },
};

interface Props {
  credito: Credito;
  open: boolean;
  onClose: () => void;
  onUpdate: (c: Credito) => void;
}

export function CreditoDetailDialog({ credito, open, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const cuotas: CuotaCredito[] = (credito.cuotas ?? []).sort((a, b) => a.numero_cuota - b.numero_cuota);

  const handlePagar = async (cuota: CuotaCredito) => {
    setLoading(cuota.id);
    const result = await pagarCuota(cuota.id);
    setLoading(null);
    if (result.error) { toast.error(result.error); return; }
    toast.success(`Cuota ${cuota.numero_cuota} marcada como pagada`);
    onUpdate({
      ...credito,
      saldo_pendiente: Math.max(0, credito.saldo_pendiente - cuota.monto),
      cuotas: cuotas.map((q) => q.id === cuota.id ? { ...q, estado: 'pagado' as const } : q),
    });
  };

  const handleCancelar = async () => {
    const result = await cancelarCredito(credito.id);
    if (result.error) { toast.error(result.error); return; }
    toast.success('Crédito cancelado');
    onUpdate({ ...credito, estado: 'cancelado' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Detalle del crédito
          </DialogTitle>
        </DialogHeader>

        {/* Info cliente */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
          <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{credito.cliente?.nombre} {credito.cliente?.apellido}</p>
            <p className="text-xs text-muted-foreground">{credito.cliente?.telefono}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="font-semibold text-sm">{formatCurrency(credito.saldo_pendiente)}</p>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total crédito</p>
            <p className="font-semibold">{formatCurrency(credito.total_credito)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cuotas</p>
            <p className="font-semibold">{cuotas.filter((q) => q.estado === 'pagado').length}/{credito.numero_cuotas}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Inicio</p>
            <p className="font-semibold text-xs">{formatDate(credito.created_at)}</p>
          </div>
        </div>

        <Separator />

        {/* Cuotas */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan de pagos</p>
          {cuotas.map((cuota) => {
            const cfg = estadoCuotaConfig[cuota.estado];
            const Icon = cfg.icon;
            const isPending = cuota.estado !== 'pagado' && credito.estado !== 'cancelado';
            return (
              <div
                key={cuota.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  cuota.estado === 'pagado' ? 'bg-green-50/50 border-green-100 dark:bg-green-950/20' :
                  cuota.estado === 'vencido' ? 'bg-red-50/50 border-red-100 dark:bg-red-950/20' :
                  'bg-background border-border'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', cfg.className)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Cuota {cuota.numero_cuota}</p>
                  <p className="text-xs text-muted-foreground">
                    Vence: {formatDate(cuota.fecha_vencimiento)}
                    {cuota.fecha_pago && ` · Pagado: ${formatDate(cuota.fecha_pago)}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm">{formatCurrency(cuota.monto)}</p>
                  {isPending && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 h-6 text-xs px-2"
                      disabled={loading === cuota.id}
                      onClick={() => handlePagar(cuota)}
                    >
                      Pagar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {credito.estado === 'activo' && (
          <>
            <Separator />
            <div className="flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-destructive hover:text-destructive')}>
                  Cancelar crédito
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar crédito?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se marcará como cancelado. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelar}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancelar crédito
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
