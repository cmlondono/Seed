'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { Inventario } from '@/types';
import Link from 'next/link';

interface Props { items: Inventario[] }

export function AlertasStock({ items }: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Stock bajo</CardTitle>
        {items.length > 0 && (
          <Link href="/inventario" className="text-xs text-primary hover:underline">Ver todo</Link>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Todo el inventario en orden ✓
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.nombre}</p>
                    <p className="text-xs text-muted-foreground">{item.proveedor ?? 'Sin proveedor'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant="destructive" className="text-xs">
                    {item.stock_actual} {item.unidad}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-0.5">mín: {item.stock_minimo}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
