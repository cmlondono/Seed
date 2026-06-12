'use client';

import { usePathname } from 'next/navigation';
import { Moon, Sun, KeyRound, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileNav } from './mobile-nav';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useState, useActionState } from 'react';
import { changeOwnPassword } from '@/actions/usuarios';
import { toast } from 'sonner';

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
  usuarios: 'Usuarios',
  nuevo: 'Nuevo',
  editar: 'Editar',
};

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { profile } = useAuthStore();
  const [openPassword, setOpenPassword] = useState(false);

  const [state, formAction, isPending] = useActionState(async (prev: unknown, formData: FormData) => {
    const result = await changeOwnPassword(prev, formData);
    if (result.error) { toast.error(result.error); return result; }
    toast.success(result.success as string);
    setOpenPassword(false);
    return result;
  }, null);

  const segments = pathname.split('/').filter(Boolean);

  const initials = profile
    ? `${profile.nombre?.[0] ?? ''}${profile.apellido?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card sticky top-0 z-10 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        <MobileNav />
        <Breadcrumb className="overflow-hidden">
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
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity outline-none">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium leading-tight">{profile.nombre} {profile.apellido}</p>
                <p className="text-[10px] text-muted-foreground capitalize leading-tight">{profile.role}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-primary-foreground">{initials}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setOpenPassword(true)} className="gap-2 cursor-pointer">
                <KeyRound className="w-3.5 h-3.5" />
                Cambiar contraseña
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={openPassword} onOpenChange={setOpenPassword}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar contraseña</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-3 py-1">
            {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
            <div className="space-y-1.5">
              <Label className="text-xs">Nueva contraseña *</Label>
              <Input name="new_password" type="password" className="h-9" placeholder="Mínimo 6 caracteres" minLength={6} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirmar contraseña *</Label>
              <Input name="confirm_password" type="password" className="h-9" placeholder="Repite la contraseña" minLength={6} required />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenPassword(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
