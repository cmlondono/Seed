'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ServicioTop } from '@/types';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

interface Props { data: ServicioTop[] }

export function ServiciosTopChart({ data }: Props) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Servicios más populares</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Sin datos este mes
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 10 }}
                width={90}
                tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v}
              />
              <Tooltip
                formatter={(v: unknown) => [(v as number), 'Citas']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="total_citas" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
