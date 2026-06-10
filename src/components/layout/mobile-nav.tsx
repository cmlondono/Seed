'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/use-auth-store';
import {
  LayoutDashboard, CalendarDays, Users, UserCircle, Scissors,
  Package, ShoppingCart, Settings, LogOut, BarChart3, CreditCard, Menu, X,
} from 'lucide-react';
import { logout } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useAuthStore();

  const visibleItems = navItems.filter(
    (item) => !profile || item.roles.includes(profile.role)
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </Button>

      <Sheet open={open} onOpenChange={(v) => setOpen(v)}>
        <SheetContent side="left" className="p-0 w-72" showCloseButton={false}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Scissors className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">Panel Admin</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 overflow-y-auto">
              <ul className="space-y-1 px-2">
                {visibleItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User + Logout */}
            <div className="border-t border-border p-3 space-y-2">
              {profile && (
                <div className="px-2 py-1">
                  <p className="text-sm font-medium">{profile.nombre} {profile.apellido}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                </div>
              )}
              <form action={logout}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" type="submit">
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </Button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
