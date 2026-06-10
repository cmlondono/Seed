'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CalendarDays, Users, AlertTriangle, DollarSign, CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/types';

interface Props { stats: DashboardStats }

export function StatsCards({ stats }: Props) {
  const cards = [
    {
      title: 'Ventas Hoy',
      value: formatCurrency(stats.ventas_hoy),
      icon: DollarSign,
      description: 'Ingresos del día',
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Ventas del Mes',
      value: formatCurrency(stats.ventas_mes),
      icon: TrendingUp,
      description: 'Ingresos del mes actual',
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Citas Hoy',
      value: stats.citas_hoy,
      icon: CalendarDays,
      description: 'Citas programadas para hoy',
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Citas Pendientes',
      value: stats.citas_pendientes,
      icon: CalendarClock,
      description: 'Por confirmar o completar',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 dark:bg-yellow-950',
    },
    {
      title: 'Clientes Nuevos',
      value: stats.clientes_nuevos_mes,
      icon: Users,
      description: 'Este mes',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950',
    },
    {
      title: 'Stock Bajo',
      value: stats.items_bajo_stock,
      icon: AlertTriangle,
      description: 'Items bajo stock mínimo',
      color: stats.items_bajo_stock > 0 ? 'text-red-600' : 'text-gray-600',
      bg: stats.items_bajo_stock > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-gray-50 dark:bg-gray-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
