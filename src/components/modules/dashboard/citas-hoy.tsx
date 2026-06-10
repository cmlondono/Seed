'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTime, getEstadoColor, getEstadoLabel } from '@/lib/utils';
import type { Cita } from '@/types';
import { Clock } from 'lucide-react';

interface Props { citas: Cita[] }

export function CitasHoy({ citas }: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Citas de hoy — {citas.length}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {citas.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No hay citas para hoy
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {citas.map((cita) => (
              <div
                key={cita.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-2 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cita.empleado?.color_calendario ?? '#3B82F6' }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {cita.cliente?.nombre} {cita.cliente?.apellido}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{cita.servicio?.nombre}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTime(cita.hora_inicio)}
                  </div>
                  <Badge variant="outline" className={`text-xs ${getEstadoColor(cita.estado)}`}>
                    {getEstadoLabel(cita.estado)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
