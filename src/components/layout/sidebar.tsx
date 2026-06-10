'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth-store';
import {
  LayoutDashboard, CalendarDays, Users, UserCircle, Scissors,
  Package, ShoppingCart, Settings, ChevronLeft, ChevronRight,
  LogOut, BarChart3, CreditCard
} from 'lucide-react';
import { useState } from 'react';
import { logout } from '@/actions/auth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'empleado'] },
  { href: '/citas', label: 'Citas', icon: CalendarDays, roles: ['admin', 'empleado'] },
  { href: '/clientes', label: 'Clientes', icon: UserCircle, roles: ['admin', 'empleado'] },
  { href: '/empleados', label: 'Empleados', icon: Users, roles: ['admin'] },
  { href: '/servicios', label: 'Servicios', icon: Scissors, roles: ['admin'] },
  { href: '/inventario', label: 'Inventario', icon: Package, roles: ['admin', 'empleado'] },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart, roles: ['admin', 'empleado'] },
  { href: '/creditos', label: 'Créditos', icon: CreditCard, roles: ['admin', 'empleado'] },
  { href: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['admin'] },
  { href: '/configuracion', label: 'Configuración', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter(
    (item) => !profile || item.roles.includes(profile.role)
  );

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen bg-background border-r border-border transition-all duration-300 sticky top-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-4 border-b border-border', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Scissors className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm truncate">Panel Admin</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {visibleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              if (collapsed) {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      className={cn(
                        'flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="border-t border-border p-3 space-y-2">
          {!collapsed && profile && (
            <div className="px-2 py-1">
              <p className="text-xs font-medium truncate">{profile.nombre} {profile.apellido}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
            </div>
          )}
          <form action={logout}>
            {collapsed ? (
              <Tooltip>
                {/* TooltipTrigger IS the submit button — no nested button */}
                <TooltipTrigger
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'w-full justify-center px-2'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar sesión</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" type="submit">
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </Button>
            )}
          </form>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-border border border-border flex items-center justify-center hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
