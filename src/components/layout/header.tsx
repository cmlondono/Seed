'use client';

import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Button } from '@/components/ui/button';
import { MobileNav } from './mobile-nav';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  citas: 'Citas',
  clientes: 'Clientes',
  empleados: 'Empleados',
  servicios: 'Servicios',
  inventario: 'Inventario',
  ventas: 'Ventas',
  creditos: 'Créditos',
  reportes: 'Reportes',
  configuracion: 'Configuración',
  nuevo: 'Nuevo',
  editar: 'Editar',
};

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { profile } = useAuthStore();

  const segments = pathname.split('/').filter(Boolean);

  const initials = profile
    ? `${profile.nombre?.[0] ?? ''}${profile.apellido?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card sticky top-0 z-10 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              const label = routeLabels[segment] ?? segment;
              const href = '/' + segments.slice(0, index + 1).join('/');

              return (
                <span key={segment} className="flex items-center gap-1.5">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-semibold text-foreground">{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href} className="text-muted-foreground hover:text-foreground">
                        {label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {profile && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium leading-tight">{profile.nombre} {profile.apellido}</p>
              <p className="text-[10px] text-muted-foreground capitalize leading-tight">{profile.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-primary-foreground">{initials}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
