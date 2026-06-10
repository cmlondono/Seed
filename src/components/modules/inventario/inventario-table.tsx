'use client';

import { useState } from 'react';
import type { Inventario } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Edit, Trash2, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  inventario: Inventario[];
  onEdit: (i: Inventario) => void;
  onMovimiento: (i: Inventario) => void;
  onDelete: (id: string) => void;
  onUpdate: (i: Inventario) => void;
}

export function InventarioTable({ inventario, onEdit, onMovimiento, onDelete }: Props) {
  const [search, setSearch] = useState('');

  const filtered = inventario.filter((i) => {
    const q = search.toLowerCase();
    return !q || i.nombre.toLowerCase().includes(q) || i.proveedor?.toLowerCase().includes(q);
  });

  const getStockStatus = (item: Inventario) => {
    if (item.stock_actual <= 0) return 'empty';
    if (item.stock_actual <= item.stock_minimo) return 'low';
    return 'ok';
  };

  return (
    <Card className="border-0 shadow-sm">
      <div className="p-4 border-b">
        <div className="relative max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9 h-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Item</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Categoría</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Stock</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Costo</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Proveedor</th>
              <th className="py-3 px-4 w-32" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground text-sm">Sin items en inventario</td>
              </tr>
            ) : (
              filtered.map((item) => {
                const status = getStockStatus(item);
                const pct = item.stock_minimo > 0
                  ? Math.min(100, (item.stock_actual / (item.stock_minimo * 3)) * 100)
                  : item.stock_actual > 0 ? 100 : 0;

                return (
                  <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {status !== 'ok' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                        <div>
                          <p className="font-medium">{item.nombre}</p>
                          {item.descripcion && <p className="text-xs text-muted-foreground truncate max-w-40">{item.descripcion}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.categoria ? (
                        <Badge variant="secondary" className="text-xs">{item.categoria.nombre}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1.5 min-w-24">
                        <div className="flex items-center justify-between text-xs">
                          <span className={status === 'empty' ? 'text-red-500 font-medium' : status === 'low' ? 'text-yellow-600 font-medium' : 'font-medium'}>
                            {item.stock_actual} {item.unidad}
                          </span>
                          <span className="text-muted-foreground">mín {item.stock_minimo}</span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-1"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatCurrency(item.costo_unitario)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.proveedor ?? '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMovimiento(item)} title="Registrar movimiento">
                          <span className="text-xs font-bold">±</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7 text-destructive hover:text-destructive')}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
                              <AlertDialogDescription>Se eliminará &quot;{item.nombre}&quot; del inventario.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={async () => {
                                  const r = await import('@/actions/inventario-delete').then(m => m.deleteInventarioItem(item.id));
                                  if (r.error) { toast.error(r.error); return; }
                                  toast.success('Item eliminado');
                                  onDelete(item.id);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
