'use client';

import { usePathname } from 'next/navigation';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
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

  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="h-14 md:h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex items-center justify-between px-4 md:px-6">
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
                      <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
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

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
