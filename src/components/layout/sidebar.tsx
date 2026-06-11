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
import { buttonVariants } from '@/components/ui/button';
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

  const initials = profile
    ? `${profile.nombre?.[0] ?? ''}${profile.apellido?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          'hidden md:flex flex-col h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 sticky top-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-sidebar-border',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Scissors className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-semibold text-sm leading-tight text-sidebar-foreground">Panel Admin</p>
              <p className="text-[10px] text-sidebar-foreground/50 leading-tight tracking-wide uppercase">Sistema de Gestión</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <ul className="space-y-0.5 px-2">
            {visibleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              if (collapsed) {
                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center justify-center rounded-md p-2.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sidebar-primary" />
                    )}
                    <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-sidebar-primary')} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {!collapsed && profile && (
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-sidebar-primary-foreground">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate text-sidebar-foreground">{profile.nombre} {profile.apellido}</p>
                <p className="text-[10px] text-sidebar-foreground/50 capitalize">{profile.role}</p>
              </div>
            </div>
          )}
          <form action={logout}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'w-full justify-center px-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar sesión</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="submit"
                className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-xs font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar sesión
              </button>
            )}
          </form>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-sidebar-foreground" /> : <ChevronLeft className="w-3 h-3 text-sidebar-foreground" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
