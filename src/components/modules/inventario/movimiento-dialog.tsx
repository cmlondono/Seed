'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { registrarMovimiento } from '@/actions/inventario';
import type { Inventario, TipoMovimiento } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  item: Inventario;
  onClose: () => void;
  onSaved: (stockNuevo: number) => void;
}

export function MovimientoDialog({ open, item, onClose, onSaved }: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(cantidad);
    if (isNaN(c) || c <= 0) { toast.error('Cantidad inválida'); return; }

    setLoading(true);
    const result = await registrarMovimiento({
      inventario_id: item.id,
      tipo,
      cantidad: c,
      motivo: motivo || undefined,
    });
    setLoading(false);

    if (result.error) { toast.error(result.error); return; }

    toast.success('Movimiento registrado');
    onSaved(result.stock_nuevo ?? item.stock_actual);
    setCantidad('');
    setMotivo('');
  };

  const preview = () => {
    const c = parseFloat(cantidad) || 0;
    switch (tipo) {
      case 'entrada': return item.stock_actual + c;
      case 'salida': return Math.max(0, item.stock_actual - c);
      case 'ajuste': return c;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Movimiento — {item.nombre}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Stock actual: </span>
            <span className="font-semibold">{item.stock_actual} {item.unidad}</span>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Tipo de movimiento</Label>
            <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoMovimiento)}>
              <TabsList className="w-full">
                <TabsTrigger value="entrada" className="flex-1 text-xs">Entrada</TabsTrigger>
                <TabsTrigger value="salida" className="flex-1 text-xs">Salida</TabsTrigger>
                <TabsTrigger value="ajuste" className="flex-1 text-xs">Ajuste</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              {tipo === 'ajuste' ? 'Nuevo stock' : 'Cantidad'}
            </Label>
            <Input
              type="number"
              min={0}
              className="h-8 text-sm"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="0"
            />
          </div>

          {cantidad && !isNaN(parseFloat(cantidad)) && (
            <div className="rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground">
              Stock resultante: <span className="font-semibold text-foreground">{preview()} {item.unidad}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Motivo (opcional)</Label>
            <Textarea className="text-sm resize-none" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={loading || !cantidad}>
              {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
